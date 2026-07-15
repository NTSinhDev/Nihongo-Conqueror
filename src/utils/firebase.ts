import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Lesson } from "../data/lessons";
import { VocabularyWord } from "../data/vocabulary";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Use specific databaseId from the applet-config if present
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "default");

const CACHE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes cache duration

export function invalidateLessonsCache(): void {
  try {
    localStorage.removeItem("japanese_lessons_cache");
    localStorage.removeItem("japanese_lessons_cache_time");
  } catch (e) {
    console.warn("Failed to invalidate lessons cache:", e);
  }
}

export function invalidateCasualVocabCache(): void {
  try {
    localStorage.removeItem("casual_vocab_cache");
    localStorage.removeItem("casual_vocab_cache_time");
  } catch (e) {
    console.warn("Failed to invalidate casual vocab cache:", e);
  }
}

export interface CloudProgress {
  unlockedLessons: number[];
  completedLessons: number[];
  lastUpdated: string;
}

export interface SyncUser {
  uid: string;
  isFallback: boolean;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Ensure the client is authenticated (anonymously) to avoid permission issues
 */
let authPromise: Promise<void> | null = null;
export async function ensureAuthenticated(): Promise<void> {
  if (auth.currentUser) return;
  
  if (!authPromise) {
    authPromise = new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          resolve();
        } else {
          try {
            await signInAnonymously(auth);
            resolve();
          } catch (e) {
            console.warn("Auto anonymous sign-in failed, proceeding with local fallback ID:", e);
            resolve();
          }
        }
      });
    });
  }
  
  await authPromise;
}

/**
 * Get the current user's unique identifier, falling back to a stable browser UUID if unauthenticated
 */
export function getCurrentUserId(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  
  let localUid = localStorage.getItem("japanese_course_local_uid");
  if (!localUid) {
    localUid = "usr_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("japanese_course_local_uid", localUid);
  }
  return localUid;
}

/**
 * Handle anonymous authentication with a seamless local-UID fallback 
 * if the operation is restricted on the Firebase console.
 */
export async function authenticateAnonymously(): Promise<SyncUser | null> {
  try {
    const credential = await signInAnonymously(auth);
    return { uid: credential.user.uid, isFallback: false };
  } catch (error: any) {
    console.warn("Firebase Anonymous Authentication fell back key: Using browser-level UUID sync.", error);
    
    const localUid = getCurrentUserId();
    return { uid: localUid, isFallback: true };
  }
}

/**
 * Save user progress to Firestore (lessons list only, no vocabulary memorization)
 */
export async function saveProgressToCloud(
  userId: string,
  unlockedLessons: number[],
  completedLessons: number[]
): Promise<boolean> {
  try {
    await ensureAuthenticated();
    const userDocRef = doc(db, "user_progress", userId);
    await setDoc(userDocRef, {
      userId,
      unlockedLessons,
      completedLessons,
      lastUpdated: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.warn("Could not save progress to Cloud, progress is saved locally:", error);
    return false;
  }
}

/**
 * Load user progress from Firestore
 */
export async function loadProgressFromCloud(userId: string): Promise<CloudProgress | null> {
  try {
    await ensureAuthenticated();
    const userDocRef = doc(db, "user_progress", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        unlockedLessons: data.unlockedLessons || [0],
        completedLessons: data.completedLessons || [],
        lastUpdated: data.lastUpdated || ""
      };
    }
    return null;
  } catch (error) {
    console.warn("Could not load progress from Cloud, using local progress:", error);
    return null;
  }
}

/**
 * Fetch all Japanese lessons from Firestore with caching
 */
export async function getLessonsFromCloud(): Promise<Lesson[]> {
  try {
    // Check local data cache first
    const cachedData = localStorage.getItem("japanese_lessons_cache");
    const cachedTime = localStorage.getItem("japanese_lessons_cache_time");
    if (cachedData && cachedTime) {
      const isExpired = Date.now() - Number(cachedTime) > CACHE_EXPIRATION_MS;
      if (!isExpired) {
        try {
          return JSON.parse(cachedData);
        } catch {
          // Parse failed, ignore and fetch fresh
        }
      }
    }

    await ensureAuthenticated();
    const colRef = collection(db, "japanese_lessons");
    const querySnapshot = await getDocs(colRef);
    const lessons: Lesson[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      
      // Normalize vocabulary words to ensure compatible properties
      const words = Array.isArray(data.words) ? data.words.map((w: any) => {
        return {
          japanese: w.japanese || w.kanji || w.hiragana || "",
          romaji: w.romaji || "",
          vietnameseMeaning: w.vietnameseMeaning || w.meaningVi || "",
          englishMeaning: w.englishMeaning || w.meaningEn || "",
          mnemonic: w.mnemonic || ""
        };
      }) : [];

      // Normalize grammar to ensure compatible properties
      let grammar = data.grammar;
      if (grammar && grammar.items && Array.isArray(grammar.items) && grammar.items.length > 0) {
        const firstItem = grammar.items[0];
        grammar = {
          pattern: firstItem.pattern || firstItem.grammarPoint || "",
          explanation: firstItem.explanation || firstItem.meaningVi || firstItem.meaningEn || "",
          example: firstItem.examples?.[0]?.japanese || firstItem.example || "",
          exampleMeaning: firstItem.examples?.[0]?.meaningVi || firstItem.exampleMeaning || "",
          items: grammar.items
        };
      } else if (grammar) {
        grammar = {
          pattern: grammar.pattern || "",
          explanation: grammar.explanation || "",
          example: grammar.example || "",
          exampleMeaning: grammar.exampleMeaning || ""
        };
      } else {
        grammar = {
          pattern: "",
          explanation: "",
          example: "",
          exampleMeaning: ""
        };
      }

      lessons.push({
        ...data,
        id: typeof data.id === "string" ? parseInt(data.id, 10) : data.id,
        level: data.level || "N5",
        category: data.category || `Minna Bài ${data.id}`,
        words,
        grammar
      });
    });

    // Cache the result
    if (lessons.length > 0) {
      try {
        localStorage.setItem("japanese_lessons_cache", JSON.stringify(lessons));
        localStorage.setItem("japanese_lessons_cache_time", String(Date.now()));
      } catch (e) {
        console.warn("Could not save lessons cache to Local Storage:", e);
      }
    }
    return lessons;
  } catch (error) {
    console.warn("Could not fetch lessons from Cloud, using built-in local lessons:", error);
    return [];
  }
}

/**
 * Seed Japanese lessons list to Firestore
 */
export async function seedLessonsToCloud(lessons: Lesson[]): Promise<boolean> {
  try {
    invalidateLessonsCache();
    await ensureAuthenticated();

    // Get credentials for rules check
    const username = localStorage.getItem("japanese_course_username") || "anonymous";
    const accounts = getLocalAccounts();
    const password = username ? accounts[username] : "";

    for (const lesson of lessons) {
      const docRef = doc(db, "japanese_lessons", String(lesson.id));
      const payload = {
        ...lesson,
        lastUpdatedBy: username,
        adminPassword: password
      };
      await setDoc(docRef, payload);
    }
    return true;
  } catch (error) {
    console.warn("Could not seed lessons to Cloud, lessons saved locally:", error);
    return false;
  }
}

/**
 * Save AI-categorized vocabulary to Firestore for a specific lesson
 */
export async function saveCategorizedVocabToCloud(
  lessonId: number,
  categorizedVocab: any[]
): Promise<boolean> {
  try {
    invalidateLessonsCache();
    await ensureAuthenticated();

    // Get credentials for rules check
    const username = localStorage.getItem("japanese_course_username") || "anonymous";
    const accounts = getLocalAccounts();
    const password = username ? accounts[username] : "";

    const docRef = doc(db, "japanese_lessons", String(lessonId));
    await updateDoc(docRef, {
      categorizedVocab,
      lastUpdatedBy: username,
      adminPassword: password
    });
    return true;
  } catch (error) {
    console.warn("Could not save categorized vocab to Cloud:", error);
    return false;
  }
}

function getLocalAccounts(): Record<string, string> {
  try {
    const raw = localStorage.getItem("japanese_course_local_accounts");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAccount(username: string, password: string): void {
  try {
    const accounts = getLocalAccounts();
    accounts[username.trim().toLowerCase()] = password;
    localStorage.setItem("japanese_course_local_accounts", JSON.stringify(accounts));
  } catch (e) {
    console.error("Failed to save local account:", e);
  }
}

/**
 * Register a custom account (username / password) in Firestore
 */
export async function registerCustomAccount(username: string, password: string): Promise<boolean> {
  const uName = username.trim().toLowerCase();
  saveLocalAccount(uName, password);

  try {
    await ensureAuthenticated();
    const userRef = doc(db, "course_accounts", uName);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      throw new Error("Tài khoản đã tồn tại trên hệ thống.");
    }
    const role = uName === "sinh" ? "admin" : "user";
    await setDoc(userRef, {
      username: uName,
      password, // Simple text password for our learning applet
      role,
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (error: any) {
    console.warn("Firestore write failed for registerCustomAccount, falling back to local storage:", error);
    if (error instanceof Error && error.message.includes("Tài khoản đã tồn tại")) {
      throw error;
    }
    return true;
  }
}

/**
 * Verify custom account credentials
 */
export async function verifyCustomAccount(username: string, password: string): Promise<boolean> {
  const uName = username.trim().toLowerCase();
  
  if (uName === "sinh" && password === "123456") {
    try {
      await ensureAuthenticated();
      const userRef = doc(db, "course_accounts", "sinh");
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          username: "sinh",
          password: "123456",
          role: "admin",
          createdAt: new Date().toISOString()
        });
      } else {
        const data = docSnap.data();
        if (data.role !== "admin") {
          await updateDoc(userRef, { role: "admin" });
        }
      }
    } catch (e) {
      console.warn("Could not sync default user 'sinh' to Firestore, continuing with local:", e);
    }
    return true;
  }

  try {
    await ensureAuthenticated();
    const userRef = doc(db, "course_accounts", uName);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.password === password) {
        saveLocalAccount(uName, password);
        return true;
      } else {
        throw new Error("Mật khẩu không đúng. Vui lòng kiểm tra lại!");
      }
    }
  } catch (error: any) {
    console.warn("Firestore authentication failed or permission denied, checking local storage fallback:", error);
    if (error instanceof Error && error.message.includes("Mật khẩu không đúng")) {
      throw error;
    }
  }

  const localAccounts = getLocalAccounts();
  if (localAccounts[uName]) {
    if (localAccounts[uName] === password) {
      return true;
    } else {
      throw new Error("Mật khẩu không đúng. Vui lòng kiểm tra lại!");
    }
  }

  throw new Error("Tài khoản không tồn tại hoặc lỗi kết nối. Vui lòng đăng ký tài khoản mới!");
}

/**
 * Fetch all casual/transient vocabulary from Firestore with caching
 */
export async function getCasualVocabFromCloud(): Promise<VocabularyWord[]> {
  try {
    // Check local data cache first
    const cachedData = localStorage.getItem("casual_vocab_cache");
    const cachedTime = localStorage.getItem("casual_vocab_cache_time");
    if (cachedData && cachedTime) {
      const isExpired = Date.now() - Number(cachedTime) > CACHE_EXPIRATION_MS;
      if (!isExpired) {
        try {
          return JSON.parse(cachedData);
        } catch {
          // Parse failed, ignore and fetch fresh
        }
      }
    }

    await ensureAuthenticated();
    const colRef = collection(db, "casual_vocab");
    const querySnapshot = await getDocs(colRef);
    const words: VocabularyWord[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.japanese) {
        words.push({
          japanese: data.japanese,
          romaji: data.romaji || "",
          vietnameseMeaning: data.vietnameseMeaning || "",
          englishMeaning: data.englishMeaning || ""
        });
      }
    });

    // Cache result
    if (words.length > 0) {
      try {
        localStorage.setItem("casual_vocab_cache", JSON.stringify(words));
        localStorage.setItem("casual_vocab_cache_time", String(Date.now()));
      } catch (e) {
        console.warn("Could not save casual vocab cache to Local Storage:", e);
      }
    }
    return words;
  } catch (error) {
    console.warn("Could not fetch casual vocab from Cloud:", error);
    return [];
  }
}

/**
 * Save or update a single casual/transient vocabulary word in Firestore
 */
export async function saveCasualWordToCloud(word: VocabularyWord): Promise<boolean> {
  try {
    invalidateCasualVocabCache();
    await ensureAuthenticated();
    // Use encodeURIComponent to make document ID safe across firestore systems
    const docId = encodeURIComponent(word.japanese.trim());
    const docRef = doc(db, "casual_vocab", docId);
    await setDoc(docRef, {
      japanese: word.japanese.trim(),
      romaji: word.romaji ? word.romaji.trim() : "",
      vietnameseMeaning: word.vietnameseMeaning.trim(),
      englishMeaning: word.englishMeaning ? word.englishMeaning.trim() : ""
    });
    return true;
  } catch (error) {
    console.warn("Could not save casual word to Cloud:", error);
    return false;
  }
}

/**
 * Seed casual vocabulary to Firestore (from local data list if Firestore is empty)
 */
export async function seedCasualVocabToCloud(words: VocabularyWord[]): Promise<boolean> {
  try {
    await ensureAuthenticated();
    
    // Check cache or db if we already have casual words
    const existing = await getCasualVocabFromCloud();
    if (existing.length > 0) {
      console.log("Casual vocab already seeded. Count:", existing.length);
      return true;
    }

    invalidateCasualVocabCache();
    console.log(`Seeding first 100 casual vocabulary words to Firestore...`);
    // Seed in chunks or sequentially to respect quotas and timing
    const chunk = words.slice(0, 100);
    for (const w of chunk) {
      await saveCasualWordToCloud(w);
    }
    return true;
  } catch (error) {
    console.warn("Could not seed casual vocab to Cloud:", error);
    return false;
  }
}

/**
 * Fetch detailed user account information, including role from cloud
 */
export async function getUserDetailsFromCloud(username: string): Promise<{ username: string; role: "admin" | "user" } | null> {
  const uName = username.trim().toLowerCase();
  try {
    await ensureAuthenticated();
    const userRef = doc(db, "course_accounts", uName);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        username: data.username || uName,
        role: data.role || (uName === "sinh" ? "admin" : "user")
      };
    }
  } catch (e) {
    console.warn("Could not fetch user details from Cloud, using local defaults:", e);
  }
  return {
    username: uName,
    role: uName === "sinh" ? "admin" : "user"
  };
}

