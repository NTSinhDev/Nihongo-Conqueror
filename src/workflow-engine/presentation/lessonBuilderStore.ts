import { LessonBuilderService, CreateDraftInput } from "../application/lessonBuilderService";
import { LessonDraft, PipelineState, StepState } from "../domain/types";
import { ValidationError, BusinessError } from "../domain/errors";
import { ensureAuthenticated, auth, getCurrentUserId } from "../../utils/firebase";

export interface StoreState {
  currentDraft: LessonDraft | null;
  drafts: LessonDraft[];
  selectedDraftId: string | null;

  // Discrete action / lifecycle states
  isLoadingDraft: boolean;
  isLoadingDrafts: boolean;
  isCreatingDraft: boolean;
  isUpdatingDraft: boolean;
  isDeletingDraft: boolean;
  isDuplicatingDraft: boolean;
  isArchivingDraft: boolean;
  isStartingPipeline: boolean;
  isPausingPipeline: boolean;
  isResumingPipeline: boolean;
  isCancelingPipeline: boolean;
  isRetryingStep: boolean;
  isPublishingLesson: boolean;

  error: Error | null;
  isWatching: boolean;
}

type Listener = () => void;

export class LessonBuilderStore {
  private state: StoreState;
  private listeners = new Set<Listener>();
  private unsubscribeWatch: (() => void) | null = null;
  private watchedDraftId: string | null = null;

  constructor(private readonly service: LessonBuilderService) {
    this.state = this.getInitialState();
  }

  private getInitialState(): StoreState {
    return {
      currentDraft: null,
      drafts: [],
      selectedDraftId: null,
      isLoadingDraft: false,
      isLoadingDrafts: false,
      isCreatingDraft: false,
      isUpdatingDraft: false,
      isDeletingDraft: false,
      isDuplicatingDraft: false,
      isArchivingDraft: false,
      isStartingPipeline: false,
      isPausingPipeline: false,
      isResumingPipeline: false,
      isCancelingPipeline: false,
      isRetryingStep: false,
      isPublishingLesson: false,
      error: null,
      isWatching: false,
    };
  }

  public getState(): StoreState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private updateState(updates: Partial<StoreState>): void {
    this.state = {
      ...this.state,
      ...updates,
    };
    this.emit();
  }

  /**
   * Clears any active error state.
   */
  public clearError(): void {
    this.updateState({ error: null });
  }

  /**
   * Resets the entire store to its initial state, unsubscribing from active watch.
   */
  public reset(): void {
    if (this.unsubscribeWatch) {
      this.unsubscribeWatch();
      this.unsubscribeWatch = null;
    }
    this.watchedDraftId = null;
    this.state = this.getInitialState();
    this.emit();
  }

  /**
   * Loads a specific draft.
   */
  public async loadDraft(id: string): Promise<void> {
    this.updateState({ isLoadingDraft: true, error: null });
    try {
      const draft = await this.service.getDraft(id);
      this.updateState({
        currentDraft: draft,
        selectedDraftId: draft.id,
        isLoadingDraft: false,
      });
    } catch (err: any) {
      this.updateState({
        isLoadingDraft: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Loads the list of all drafts.
   */
  public async loadDrafts(): Promise<void> {
    this.updateState({ isLoadingDrafts: true, error: null });
    try {
      const drafts = await this.service.listDrafts();
      this.updateState({
        drafts,
        isLoadingDrafts: false,
      });
    } catch (err: any) {
      this.updateState({
        isLoadingDrafts: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Creates a new draft lesson plan.
   */
  public async createDraft(input: CreateDraftInput): Promise<LessonDraft> {
    this.updateState({ isCreatingDraft: true, error: null });
    try {
      await ensureAuthenticated();
      const currentUserId = getCurrentUserId();
      
      if (!currentUserId) {
        throw new Error("User must be logged in to create a draft.");
      }
      input.createdById = currentUserId;
      const newDraft = await this.service.createDraft(input);
      const updatedDrafts = [newDraft, ...this.state.drafts];
      this.updateState({
        drafts: updatedDrafts,
        currentDraft: newDraft,
        selectedDraftId: newDraft.id,
        isCreatingDraft: false,
      });
      return newDraft;
    } catch (err: any) {
      this.updateState({
        isCreatingDraft: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Updates an existing draft (supports optimistic updates).
   */
  public async updateDraft(id: string, updates: Partial<LessonDraft>): Promise<LessonDraft> {
    const prevCurrentDraft = this.state.currentDraft;
    const prevDrafts = this.state.drafts;

    // Optimistic Update
    let optimisticCurrent = prevCurrentDraft;
    if (prevCurrentDraft && prevCurrentDraft.id === id) {
      optimisticCurrent = {
        ...prevCurrentDraft,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    const optimisticDrafts = prevDrafts.map((d) => {
      if (d.id === id) {
        return {
          ...d,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    this.updateState({
      currentDraft: optimisticCurrent,
      drafts: optimisticDrafts,
      isUpdatingDraft: true,
      error: null,
    });

    try {
      const updatedReal = await this.service.updateDraft(id, updates);
      // Replace optimistic state with the real updated state
      let finalCurrent = this.state.currentDraft;
      if (finalCurrent && finalCurrent.id === id) {
        finalCurrent = updatedReal;
      }
      const finalDrafts = this.state.drafts.map((d) => (d.id === id ? updatedReal : d));

      this.updateState({
        currentDraft: finalCurrent,
        drafts: finalDrafts,
        isUpdatingDraft: false,
      });
      return updatedReal;
    } catch (err: any) {
      // Rollback optimistic update
      this.updateState({
        currentDraft: prevCurrentDraft,
        drafts: prevDrafts,
        isUpdatingDraft: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Deletes a draft (supports optimistic updates).
   */
  public async deleteDraft(id: string): Promise<void> {
    const prevCurrentDraft = this.state.currentDraft;
    const prevDrafts = this.state.drafts;

    // Optimistic Update
    const optimisticDrafts = prevDrafts.filter((d) => d.id !== id);
    let optimisticCurrent = prevCurrentDraft;
    let optimisticSelectedId = this.state.selectedDraftId;
    if (prevCurrentDraft && prevCurrentDraft.id === id) {
      optimisticCurrent = null;
      optimisticSelectedId = null;
    }

    this.updateState({
      currentDraft: optimisticCurrent,
      drafts: optimisticDrafts,
      selectedDraftId: optimisticSelectedId,
      isDeletingDraft: true,
      error: null,
    });

    try {
      await this.service.deleteDraft(id);
      this.updateState({
        isDeletingDraft: false,
      });
    } catch (err: any) {
      // Rollback
      this.updateState({
        currentDraft: prevCurrentDraft,
        drafts: prevDrafts,
        selectedDraftId: prevCurrentDraft ? prevCurrentDraft.id : null,
        isDeletingDraft: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Duplicates a draft.
   */
  public async duplicateDraft(id: string): Promise<LessonDraft> {
    this.updateState({ isDuplicatingDraft: true, error: null });
    try {
      const newDraft = await this.service.duplicateDraft(id);
      const updatedDrafts = [newDraft, ...this.state.drafts];
      this.updateState({
        drafts: updatedDrafts,
        currentDraft: newDraft,
        selectedDraftId: newDraft.id,
        isDuplicatingDraft: false,
      });
      return newDraft;
    } catch (err: any) {
      this.updateState({
        isDuplicatingDraft: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Archives a draft (supports optimistic updates).
   */
  public async archiveDraft(id: string): Promise<LessonDraft> {
    const prevCurrentDraft = this.state.currentDraft;
    const prevDrafts = this.state.drafts;

    // Optimistic Update
    let optimisticCurrent = prevCurrentDraft;
    if (prevCurrentDraft && prevCurrentDraft.id === id) {
      optimisticCurrent = {
        ...prevCurrentDraft,
        archived: true,
        updatedAt: new Date().toISOString(),
      };
    }
    const optimisticDrafts = prevDrafts.map((d) => {
      if (d.id === id) {
        return {
          ...d,
          archived: true,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    this.updateState({
      currentDraft: optimisticCurrent,
      drafts: optimisticDrafts,
      isArchivingDraft: true,
      error: null,
    });

    try {
      const archivedReal = await this.service.archiveDraft(id);
      let finalCurrent = this.state.currentDraft;
      if (finalCurrent && finalCurrent.id === id) {
        finalCurrent = archivedReal;
      }
      const finalDrafts = this.state.drafts.map((d) => (d.id === id ? archivedReal : d));

      this.updateState({
        currentDraft: finalCurrent,
        drafts: finalDrafts,
        isArchivingDraft: false,
      });
      return archivedReal;
    } catch (err: any) {
      // Rollback
      this.updateState({
        currentDraft: prevCurrentDraft,
        drafts: prevDrafts,
        isArchivingDraft: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Starts pipeline execution.
   */
  public async startPipeline(id: string): Promise<void> {
    this.updateState({ isStartingPipeline: true, error: null });
    try {
      await this.service.startPipeline(id);
      this.updateState({ isStartingPipeline: false });
    } catch (err: any) {
      this.updateState({
        isStartingPipeline: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Pauses running pipeline.
   */
  public async pausePipeline(id: string): Promise<void> {
    this.updateState({ isPausingPipeline: true, error: null });
    try {
      await this.service.pausePipeline(id);
      this.updateState({ isPausingPipeline: false });
    } catch (err: any) {
      this.updateState({
        isPausingPipeline: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Resumes pipeline execution.
   */
  public async resumePipeline(id: string): Promise<void> {
    this.updateState({ isResumingPipeline: true, error: null });
    try {
      await this.service.resumePipeline(id);
      this.updateState({ isResumingPipeline: false });
    } catch (err: any) {
      this.updateState({
        isResumingPipeline: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Cancels pipeline execution.
   */
  public async cancelPipeline(id: string): Promise<void> {
    this.updateState({ isCancelingPipeline: true, error: null });
    try {
      await this.service.cancelPipeline(id);
      this.updateState({ isCancelingPipeline: false });
    } catch (err: any) {
      this.updateState({
        isCancelingPipeline: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Retries a specific step.
   */
  public async retryStep(id: string, stepId: string): Promise<void> {
    this.updateState({ isRetryingStep: true, error: null });
    try {
      await this.service.retryStep(id, stepId);
      this.updateState({ isRetryingStep: false });
    } catch (err: any) {
      this.updateState({
        isRetryingStep: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Publishes the completed lesson.
   */
  public async publishLesson(id: string): Promise<void> {
    this.updateState({ isPublishingLesson: true, error: null });
    try {
      await this.service.publishLesson(id);
      try {
        const { invalidateLessonsCache } = await import("../../utils/firebase");
        invalidateLessonsCache();
      } catch (cacheErr) {
        console.warn("Failed to invalidate cache after publish:", cacheErr);
      }
      this.updateState({ isPublishingLesson: false });
    } catch (err: any) {
      this.updateState({
        isPublishingLesson: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Starts a real-time watch subscription. Automatically cleans up existing subscription.
   */
  public watchDraft(id: string): () => void {
    // If already watching the same draft, do not duplicate subscription
    if (this.state.isWatching && this.watchedDraftId === id) {
      return () => {};
    }

    // Clean up existing subscription
    if (this.unsubscribeWatch) {
      this.unsubscribeWatch();
      this.unsubscribeWatch = null;
    }

    this.watchedDraftId = id;
    this.updateState({ isWatching: true });

    const unsubscribe = this.service.watchDraft(id, (draft) => {
      // Verify we are still watching this draft id
      if (this.watchedDraftId !== id) {
        return;
      }

      if (draft) {
        const finalDrafts = this.state.drafts.map((d) => (d.id === id ? draft : d));
        this.updateState({
          currentDraft: draft,
          selectedDraftId: draft.id,
          drafts: this.state.drafts.find((d) => d.id === id) ? finalDrafts : [...this.state.drafts, draft],
        });
      } else {
        // Draft deleted from remote
        const finalDrafts = this.state.drafts.filter((d) => d.id !== id);
        this.updateState({
          currentDraft: null,
          selectedDraftId: null,
          drafts: finalDrafts,
        });
      }
    });

    this.unsubscribeWatch = () => {
      unsubscribe();
      this.updateState({ isWatching: false });
      this.watchedDraftId = null;
      this.unsubscribeWatch = null;
    };

    return this.unsubscribeWatch;
  }
}
