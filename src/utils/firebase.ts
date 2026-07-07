import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Lesson } from "../data/lessons";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Use specific databaseId from the applet-config if present
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "default");

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
 * Handle anonymous authentication with a seamless local-UID fallback 
 * if the operation is restricted on the Firebase console.
 */
export async function authenticateAnonymously(): Promise<SyncUser | null> {
  try {
    const credential = await signInAnonymously(auth);
    return { uid: credential.user.uid, isFallback: false };
  } catch (error: any) {
    console.warn("Firebase Anonymous Authentication fell back key: Using browser-level UUID sync.", error);
    
    let localUid = localStorage.getItem("japanese_course_local_uid");
    if (!localUid) {
      localUid = "usr_" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("japanese_course_local_uid", localUid);
    }
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
    const userDocRef = doc(db, "user_progress", userId);
    await setDoc(userDocRef, {
      userId,
      unlockedLessons,
      completedLessons,
      lastUpdated: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `user_progress/${userId}`);
  }
}

/**
 * Load user progress from Firestore
 */
export async function loadProgressFromCloud(userId: string): Promise<CloudProgress | null> {
  try {
    const userDocRef = doc(db, "user_progress", userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        unlockedLessons: data.unlockedLessons || [1],
        completedLessons: data.completedLessons || [],
        lastUpdated: data.lastUpdated || ""
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `user_progress/${userId}`);
  }
}

/**
 * Fetch all Japanese lessons from Firestore
 */
export async function getLessonsFromCloud(): Promise<Lesson[]> {
  try {
    const colRef = collection(db, "japanese_lessons");
    const querySnapshot = await getDocs(colRef);
    const lessons: Lesson[] = [];
    querySnapshot.forEach((docSnap) => {
      lessons.push(docSnap.data() as Lesson);
    });
    return lessons;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, "japanese_lessons");
  }
}

/**
 * Seed Japanese lessons list to Firestore
 */
export async function seedLessonsToCloud(lessons: Lesson[]): Promise<boolean> {
  try {
    for (const lesson of lessons) {
      const docRef = doc(db, "japanese_lessons", String(lesson.id));
      await setDoc(docRef, lesson);
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "japanese_lessons");
  }
}

/**
 * Register a custom account (username / password) in Firestore
 */
export async function registerCustomAccount(username: string, password: string): Promise<boolean> {
  try {
    const uName = username.trim().toLowerCase();
    const userRef = doc(db, "course_accounts", uName);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      throw new Error("Tài khoản đã tồn tại trên hệ thống.");
    }
    await setDoc(userRef, {
      username: uName,
      password, // Simple text password for our learning applet
      createdAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `course_accounts/${username}`);
  }
}

/**
 * Verify custom account credentials
 */
export async function verifyCustomAccount(username: string, password: string): Promise<boolean> {
  try {
    const uName = username.trim().toLowerCase();
    
    // Auto-create default account "sinh" / "123456" if not present in DB
    if (uName === "sinh" && password === "123456") {
      const userRef = doc(db, "course_accounts", "sinh");
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          username: "sinh",
          password: "123456",
          createdAt: new Date().toISOString()
        });
      }
      return true;
    }

    const userRef = doc(db, "course_accounts", uName);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      throw new Error("Tài khoản không tồn tại. Vui lòng đăng ký tài khoản mới!");
    }
    const data = docSnap.data();
    if (data.password !== password) {
      throw new Error("Mật khẩu không đúng. Vui lòng kiểm tra lại!");
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `course_accounts/${username}`);
  }
}

