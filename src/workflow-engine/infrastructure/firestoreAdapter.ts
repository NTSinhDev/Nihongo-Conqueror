import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  runTransaction, 
  onSnapshot,
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import firebaseConfig from "../../../firebase-applet-config.json";
import { IDraftRepository, ILessonRepository } from "../application/ports";
import { LessonDraft, PipelineContext } from "../domain/types";
import { BusinessError, InfrastructureError } from "../domain/errors";
import { handleFirestoreError, OperationType, ensureAuthenticated, auth, getCurrentUserId } from "../../utils/firebase";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore (pass custom database ID if available in config)
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Helper to recursively remove undefined values from objects before writing to Firestore
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = cleanUndefined(val);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

export class FirestoreDraftRepository implements IDraftRepository {
  // Map to track the last read updatedAt string for each draft ID to support optimistic locking
  private readonly lastReadTimestamps = new Map<string, string>();

  async getById(id: string): Promise<LessonDraft | null> {
    try {
      const docRef = doc(db, "lesson_drafts", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return null;
      }
      const draft = docSnap.data() as LessonDraft;
      // Track this draft's updatedAt value for future optimistic locking checks
      this.lastReadTimestamps.set(id, draft.updatedAt);
      return draft;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.GET, `lesson_drafts/${id}`);
    }
  }

  async create(draft: LessonDraft): Promise<void> {
    try {
      const docRef = doc(db, "lesson_drafts", draft.id);
      await setDoc(docRef, cleanUndefined(draft));
      // Track updatedAt value
      this.lastReadTimestamps.set(draft.id, draft.updatedAt);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `lesson_drafts/${draft.id}`);
    }
  }

  async save(draft: LessonDraft): Promise<void> {
    const docRef = doc(db, "lesson_drafts", draft.id);
    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        if (!docSnap.exists()) {
          throw new BusinessError(`Draft with ID ${draft.id} does not exist to save.`);
        }

        const currentDbData = docSnap.data() as LessonDraft;
        const lastReadVal = this.lastReadTimestamps.get(draft.id);

        // Optimistic Concurrency Control Check
        if (lastReadVal && currentDbData.updatedAt !== lastReadVal) {
          throw new BusinessError(
            `Optimistic locking violation: Draft ${draft.id} was modified by another client or transaction in the database.`
          );
        }

        // Perform transactional write
        transaction.set(docRef, cleanUndefined(draft));
      });

      // Update our tracked timestamp with the new saved updatedAt
      this.lastReadTimestamps.set(draft.id, draft.updatedAt);
    } catch (error: any) {
      if (error instanceof BusinessError) {
        throw error;
      }
      handleFirestoreError(error, OperationType.WRITE, `lesson_drafts/${draft.id}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, "lesson_drafts", id);
      await deleteDoc(docRef);
      this.lastReadTimestamps.delete(id);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `lesson_drafts/${id}`);
    }
  }

  // --- Fully Expose Requested Adapter-specific API ---
  async createDraft(draft: LessonDraft): Promise<void> {
    return this.create(draft);
  }

  async getDraft(id: string): Promise<LessonDraft | null> {
    return this.getById(id);
  }

  async updateDraft(draft: LessonDraft): Promise<void> {
    return this.save(draft);
  }

  async deleteDraft(id: string): Promise<void> {
    return this.delete(id);
  }

  watchDraft(id: string, callback: (draft: LessonDraft | null) => void): () => void {
    const docRef = doc(db, "lesson_drafts", id);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          callback(null);
        } else {
          const draft = docSnap.data() as LessonDraft;
          this.lastReadTimestamps.set(id, draft.updatedAt);
          callback(draft);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `lesson_drafts/${id}`);
      }
    );
  }

  async list(): Promise<LessonDraft[]> {
    try {
      await ensureAuthenticated();
      const currentUserId = getCurrentUserId();
      
      if (!currentUserId) {
        return [];
      }

      const q = query(collection(db, "lesson_drafts"), where("createdById", "==", currentUserId));
      const querySnapshot = await getDocs(q);
      const drafts: LessonDraft[] = [];
      querySnapshot.forEach((docSnap) => {
        const draft = docSnap.data() as LessonDraft;
        this.lastReadTimestamps.set(draft.id, draft.updatedAt);
        drafts.push(draft);
      });
      return drafts;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.LIST, "lesson_drafts");
    }
  }

  watch(id: string, callback: (draft: LessonDraft | null) => void): () => void {
    return this.watchDraft(id, callback);
  }
}

export class FirestoreLessonRepository implements ILessonRepository {
  async publish(lessonId: number, level: string, context: PipelineContext): Promise<void> {
    try {
      const docId = `${level}-L${lessonId}`;
      const docRef = doc(db, "japanese_lessons", docId);

      // Create a well-structured document mapping context properties to the blueprint schema
      const payload = {
        id: lessonId,
        title: context.metadata.titleVi || `Bài ${lessonId}`,
        description: context.metadata.titleEn || `Lesson ${lessonId}`,
        level: level,
        category: context.metadata.level || level,
        grammar: {
          items: context.generated.grammarWithExamples || context.input.grammar
        },
        words: context.generated.vocabularyWithExamples || context.input.vocabulary,
        categorizedVocab: context.generated.vocabularyWithMeanings || [],
        context: context, // persist full context for audit/deep loads
        publishedAt: new Date().toISOString()
      };

      await setDoc(docRef, cleanUndefined(payload));
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `japanese_lessons/${level}-L${lessonId}`);
    }
  }

  async lessonExists(lessonId: number, level: string): Promise<boolean> {
    try {
      const docId = `${level}-L${lessonId}`;
      const docRef = doc(db, "japanese_lessons", docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.GET, `japanese_lessons/${level}-L${lessonId}`);
    }
  }

  // --- Direct Expose Requested Helper ---
  async publishLesson(lessonId: number, level: string, context: PipelineContext): Promise<void> {
    return this.publish(lessonId, level, context);
  }
}
