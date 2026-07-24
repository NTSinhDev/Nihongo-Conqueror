import { describe, it, expect, beforeEach, vi } from "vitest";
import { LessonBuilderStore, StoreState } from "../presentation/lessonBuilderStore";
import { LessonDraft, PipelineState, StepState } from "../domain/types";
import { ValidationError, BusinessError, InfrastructureError } from "../domain/errors";
import {
  selectCurrentDraft,
  selectDrafts,
  selectCompletedSteps,
  selectRunningStep,
  selectFailedSteps,
  selectPipelineProgress,
  selectIsPipelineRunning,
  selectIsPipelinePaused,
  selectIsPipelineCompleted,
  selectHasErrors,
  selectCanPublish,
  selectCanResume,
  selectCanRetry,
} from "../presentation/lessonBuilderContext";

describe("LessonBuilderStore State Management Layer Tests", () => {
  let mockService: any;
  let store: LessonBuilderStore;
  let watchCallbacks: Record<string, (draft: LessonDraft | null) => void> = {};
  let watchUnsubscribeSpies: Record<string, any> = {};

  beforeEach(() => {
    watchCallbacks = {};
    watchUnsubscribeSpies = {};

    mockService = {
      getDraft: vi.fn(),
      listDrafts: vi.fn(),
      createDraft: vi.fn(),
      updateDraft: vi.fn(),
      deleteDraft: vi.fn(),
      duplicateDraft: vi.fn(),
      archiveDraft: vi.fn(),
      startPipeline: vi.fn(),
      pausePipeline: vi.fn(),
      resumePipeline: vi.fn(),
      cancelPipeline: vi.fn(),
      retryStep: vi.fn(),
      publishLesson: vi.fn(),
      watchDraft: vi.fn().mockImplementation((id: string, callback: (draft: LessonDraft | null) => void) => {
        watchCallbacks[id] = callback;
        const unsubscribeSpy = vi.fn();
        watchUnsubscribeSpies[id] = unsubscribeSpy;
        return unsubscribeSpy;
      }),
    };

    store = new LessonBuilderStore(mockService);
  });

  const createMockDraft = (id: string, state: PipelineState = PipelineState.DRAFT): LessonDraft => ({
    id,
    schemaVersion: 1,
    aiModel: "gemini-3.5-flash",
    promptVersion: "1.0",
    pipelineState: state,
    currentStepId: null,
    steps: {},
    context: {
      metadata: { level: "N4", lessonId: 10, titleVi: "Bài 10" },
      input: { vocabulary: [], grammar: [] },
      validated: { vocabulary: [], grammar: [] },
      tokenized: { vocabularyTokens: {} },
      generated: { vocabularyWithMeanings: [], vocabularyWithExamples: [], grammarWithMeanings: [], grammarWithExamples: [], review: null },
    },
    createdById: "user-123",
    createdAt: "2026-07-12T00:00:00Z",
    updatedAt: "2026-07-12T00:00:00Z",
  });

  describe("Initial State", () => {
    it("should initialize with correct default state values", () => {
      const state = store.getState();
      expect(state.currentDraft).toBeNull();
      expect(state.drafts).toEqual([]);
      expect(state.selectedDraftId).toBeNull();
      expect(state.isLoadingDraft).toBe(false);
      expect(state.isLoadingDrafts).toBe(false);
      expect(state.isCreatingDraft).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("Loading Draft & Draft List", () => {
    it("should handle loading a single draft", async () => {
      const draft = createMockDraft("draft-1");
      mockService.getDraft.mockResolvedValueOnce(draft);

      const promise = store.loadDraft("draft-1");
      expect(store.getState().isLoadingDraft).toBe(true);

      await promise;
      const state = store.getState();
      expect(state.isLoadingDraft).toBe(false);
      expect(state.currentDraft).toEqual(draft);
      expect(state.selectedDraftId).toBe("draft-1");
      expect(state.error).toBeNull();
    });

    it("should capture errors when loading a single draft fails", async () => {
      const mockError = new Error("Draft not found");
      mockService.getDraft.mockRejectedValueOnce(mockError);

      await expect(store.loadDraft("draft-1")).rejects.toThrow(mockError);
      const state = store.getState();
      expect(state.isLoadingDraft).toBe(false);
      expect(state.currentDraft).toBeNull();
      expect(state.error).toBe(mockError);
    });

    it("should handle loading all drafts", async () => {
      const drafts = [createMockDraft("d-1"), createMockDraft("d-2")];
      mockService.listDrafts.mockResolvedValueOnce(drafts);

      const promise = store.loadDrafts();
      expect(store.getState().isLoadingDrafts).toBe(true);

      await promise;
      const state = store.getState();
      expect(state.isLoadingDrafts).toBe(false);
      expect(state.drafts).toEqual(drafts);
      expect(state.error).toBeNull();
    });

    it("should capture errors when loading drafts fails", async () => {
      const mockError = new Error("Database error");
      mockService.listDrafts.mockRejectedValueOnce(mockError);

      await expect(store.loadDrafts()).rejects.toThrow(mockError);
      const state = store.getState();
      expect(state.isLoadingDrafts).toBe(false);
      expect(state.drafts).toEqual([]);
      expect(state.error).toBe(mockError);
    });
  });

  describe("Create Draft", () => {
    it("should set creating state, create draft, and update drafts list", async () => {
      const newDraft = createMockDraft("draft-new");
      mockService.createDraft.mockResolvedValueOnce(newDraft);

      const input = {
        metadata: { level: "N4", lessonId: 10, titleVi: "Bái 10" },
        input: { vocabulary: [], grammar: [] },
      };

      const promise = store.createDraft(input);
      expect(store.getState().isCreatingDraft).toBe(true);

      const result = await promise;
      expect(result).toEqual(newDraft);

      const state = store.getState();
      expect(state.isCreatingDraft).toBe(false);
      expect(state.currentDraft).toEqual(newDraft);
      expect(state.drafts).toContainEqual(newDraft);
      expect(state.selectedDraftId).toBe("draft-new");
    });
  });

  describe("Update Draft with Optimistic Updates and Rollbacks", () => {
    it("should update draft optimistically and replace with real value on success", async () => {
      const existing = createMockDraft("d-1");
      store.reset();
      // Set existing in state
      store["updateState"]({ currentDraft: existing, drafts: [existing] });

      const updates = { aiModel: "gemini-ultra-pro" };
      const updatedReal = { ...existing, ...updates, updatedAt: "now" };
      mockService.updateDraft.mockResolvedValueOnce(updatedReal);

      const promise = store.updateDraft("d-1", updates);

      // Check optimistic state
      expect(store.getState().currentDraft?.aiModel).toBe("gemini-ultra-pro");
      expect(store.getState().drafts[0].aiModel).toBe("gemini-ultra-pro");
      expect(store.getState().isUpdatingDraft).toBe(true);

      await promise;

      // Check final real state
      const state = store.getState();
      expect(state.isUpdatingDraft).toBe(false);
      expect(state.currentDraft).toEqual(updatedReal);
      expect(state.drafts[0]).toEqual(updatedReal);
    });

    it("should rollback to previous state if update fails", async () => {
      const existing = createMockDraft("d-1");
      store["updateState"]({ currentDraft: existing, drafts: [existing] });

      const updates = { aiModel: "gemini-ultra-pro" };
      const mockError = new ValidationError("Invalid update options");
      mockService.updateDraft.mockRejectedValueOnce(mockError);

      await expect(store.updateDraft("d-1", updates)).rejects.toThrow(mockError);

      // Verify rollback occurred
      const state = store.getState();
      expect(state.isUpdatingDraft).toBe(false);
      expect(state.currentDraft?.aiModel).toBe("gemini-3.5-flash"); // Rolled back
      expect(state.drafts[0].aiModel).toBe("gemini-3.5-flash"); // Rolled back
      expect(state.error).toBe(mockError);
    });
  });

  describe("Delete Draft with Optimistic Updates and Rollbacks", () => {
    it("should delete draft optimistically and complete on success", async () => {
      const draft1 = createMockDraft("d-1");
      const draft2 = createMockDraft("d-2");
      store["updateState"]({
        currentDraft: draft1,
        drafts: [draft1, draft2],
        selectedDraftId: "d-1",
      });

      mockService.deleteDraft.mockResolvedValueOnce(undefined);

      const promise = store.deleteDraft("d-1");

      // Verify optimistic state (d-1 removed immediately, currentDraft set to null)
      expect(store.getState().drafts).toHaveLength(1);
      expect(store.getState().drafts[0].id).toBe("d-2");
      expect(store.getState().currentDraft).toBeNull();
      expect(store.getState().selectedDraftId).toBeNull();
      expect(store.getState().isDeletingDraft).toBe(true);

      await promise;

      expect(store.getState().isDeletingDraft).toBe(false);
    });

    it("should rollback deleted draft if operation fails", async () => {
      const draft1 = createMockDraft("d-1");
      store["updateState"]({
        currentDraft: draft1,
        drafts: [draft1],
        selectedDraftId: "d-1",
      });

      const mockError = new BusinessError("Cannot delete active pipeline");
      mockService.deleteDraft.mockRejectedValueOnce(mockError);

      await expect(store.deleteDraft("d-1")).rejects.toThrow(mockError);

      // Verify rollback
      const state = store.getState();
      expect(state.isDeletingDraft).toBe(false);
      expect(state.currentDraft).toEqual(draft1);
      expect(state.drafts).toHaveLength(1);
      expect(state.selectedDraftId).toBe("d-1");
      expect(state.error).toBe(mockError);
    });
  });

  describe("Duplicate Draft", () => {
    it("should handle duplication successfully", async () => {
      const draft = createMockDraft("orig");
      const duplicated = createMockDraft("dup-new");
      store["updateState"]({ drafts: [draft] });

      mockService.duplicateDraft.mockResolvedValueOnce(duplicated);

      const promise = store.duplicateDraft("orig");
      expect(store.getState().isDuplicatingDraft).toBe(true);

      const result = await promise;
      expect(result).toEqual(duplicated);

      const state = store.getState();
      expect(state.isDuplicatingDraft).toBe(false);
      expect(state.currentDraft).toEqual(duplicated);
      expect(state.drafts).toContainEqual(duplicated);
      expect(state.selectedDraftId).toBe("dup-new");
    });
  });

  describe("Archive Draft with Optimistic Updates", () => {
    it("should archive draft optimistically and replace with real value", async () => {
      const draft = createMockDraft("d-1");
      store["updateState"]({ currentDraft: draft, drafts: [draft] });

      const archivedReal = { ...draft, archived: true };
      mockService.archiveDraft.mockResolvedValueOnce(archivedReal);

      const promise = store.archiveDraft("d-1");

      // Verify optimistic state
      expect(store.getState().currentDraft?.archived).toBe(true);
      expect(store.getState().drafts[0].archived).toBe(true);
      expect(store.getState().isArchivingDraft).toBe(true);

      await promise;

      const state = store.getState();
      expect(state.isArchivingDraft).toBe(false);
      expect(state.currentDraft).toEqual(archivedReal);
      expect(state.drafts[0]).toEqual(archivedReal);
    });

    it("should rollback archived status if operation fails", async () => {
      const draft = createMockDraft("d-1");
      store["updateState"]({ currentDraft: draft, drafts: [draft] });

      const mockError = new Error("Persistence failed");
      mockService.archiveDraft.mockRejectedValueOnce(mockError);

      await expect(store.archiveDraft("d-1")).rejects.toThrow(mockError);

      // Verify rollback
      const state = store.getState();
      expect(state.isArchivingDraft).toBe(false);
      expect(state.currentDraft?.archived).toBeFalsy();
      expect(state.drafts[0].archived).toBeFalsy();
      expect(state.error).toBe(mockError);
    });
  });

  describe("Pipeline Lifecycle Actions", () => {
    it("should set loading status flags correctly during pipeline actions", async () => {
      // Start
      mockService.startPipeline.mockResolvedValueOnce(undefined);
      let promise = store.startPipeline("d-1");
      expect(store.getState().isStartingPipeline).toBe(true);
      await promise;
      expect(store.getState().isStartingPipeline).toBe(false);

      // Pause
      mockService.pausePipeline.mockResolvedValueOnce(undefined);
      promise = store.pausePipeline("d-1");
      expect(store.getState().isPausingPipeline).toBe(true);
      await promise;
      expect(store.getState().isPausingPipeline).toBe(false);

      // Resume
      mockService.resumePipeline.mockResolvedValueOnce(undefined);
      promise = store.resumePipeline("d-1");
      expect(store.getState().isResumingPipeline).toBe(true);
      await promise;
      expect(store.getState().isResumingPipeline).toBe(false);

      // Cancel
      mockService.cancelPipeline.mockResolvedValueOnce(undefined);
      promise = store.cancelPipeline("d-1");
      expect(store.getState().isCancelingPipeline).toBe(true);
      await promise;
      expect(store.getState().isCancelingPipeline).toBe(false);

      // Retry
      mockService.retryStep.mockResolvedValueOnce(undefined);
      promise = store.retryStep("d-1", "step-1");
      expect(store.getState().isRetryingStep).toBe(true);
      await promise;
      expect(store.getState().isRetryingStep).toBe(false);

      // Publish
      mockService.publishLesson.mockResolvedValueOnce(undefined);
      promise = store.publishLesson("d-1");
      expect(store.getState().isPublishingLesson).toBe(true);
      await promise;
      expect(store.getState().isPublishingLesson).toBe(false);
    });
  });

  describe("Realtime Synchronization and Watch Subscription", () => {
    it("should watch draft updates and update state automatically", () => {
      const listenerSpy = vi.fn();
      store.subscribe(listenerSpy);

      store.watchDraft("d-watch");

      expect(store.getState().isWatching).toBe(true);
      expect(mockService.watchDraft).toHaveBeenCalledWith("d-watch", expect.any(Function));

      // Trigger callback with fresh snapshot
      const snapshot = createMockDraft("d-watch", PipelineState.RUNNING);
      watchCallbacks["d-watch"](snapshot);

      const state = store.getState();
      expect(state.currentDraft).toEqual(snapshot);
      expect(state.selectedDraftId).toBe("d-watch");
      expect(state.drafts).toContainEqual(snapshot);
      expect(listenerSpy).toHaveBeenCalled();
    });

    it("should handle remote deletion gracefully", () => {
      const draft = createMockDraft("d-watch");
      store["updateState"]({ currentDraft: draft, drafts: [draft], selectedDraftId: "d-watch" });

      store.watchDraft("d-watch");
      watchCallbacks["d-watch"](null); // Simulated remote deletion

      const state = store.getState();
      expect(state.currentDraft).toBeNull();
      expect(state.selectedDraftId).toBeNull();
      expect(state.drafts).not.toContain(draft);
    });

    it("should prevent duplicate watch subscriptions for the same draft", () => {
      store.watchDraft("d-same");
      store.watchDraft("d-same");

      expect(mockService.watchDraft).toHaveBeenCalledTimes(1);
    });

    it("should clean up and unsubscribe when switching drafts or resetting", () => {
      store.watchDraft("d-1");
      expect(mockService.watchDraft).toHaveBeenCalledTimes(1);

      store.watchDraft("d-2");
      // Check that unsubscribe spy of first draft was called
      expect(watchUnsubscribeSpies["d-1"]).toHaveBeenCalled();
      expect(mockService.watchDraft).toHaveBeenCalledTimes(2);

      store.reset();
      expect(watchUnsubscribeSpies["d-2"]).toHaveBeenCalled();
      expect(store.getState().isWatching).toBe(false);
    });
  });

  describe("Selector Correctness", () => {
    it("should compute correct derived values using selectors", () => {
      const draft = createMockDraft("d-sel", PipelineState.FAILED);
      draft.currentStepId = "tokenize";
      draft.steps = {
        "validate-vocabulary": { status: StepState.SUCCESS, retryCount: 0 },
        "validate-grammar": { status: StepState.SUCCESS, retryCount: 1 },
        "tokenize": { status: StepState.RUNNING, retryCount: 0 },
        "generate-english": { status: StepState.FAILED, retryCount: 2 },
      };

      const state: StoreState = {
        currentDraft: draft,
        drafts: [draft],
        selectedDraftId: "d-sel",
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

      expect(selectCurrentDraft(state)).toBe(draft);
      expect(selectDrafts(state)).toEqual([draft]);
      expect(selectCompletedSteps(state)).toEqual(["validate-vocabulary", "validate-grammar"]);
      expect(selectRunningStep(state)).toBe("tokenize");
      expect(selectFailedSteps(state)).toEqual(["generate-english"]);

      const progress = selectPipelineProgress(state);
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(8);
      expect(progress.percentage).toBe(25); // Math.round((2 / 8) * 100)

      expect(selectIsPipelineRunning(state)).toBe(false);
      expect(selectIsPipelinePaused(state)).toBe(false);
      expect(selectIsPipelineCompleted(state)).toBe(false);

      expect(selectHasErrors(state)).toBe(true);
      expect(selectCanPublish(state)).toBe(false);
      expect(selectCanResume(state)).toBe(true);
      expect(selectCanRetry(state)).toBe(true);
    });

    it("should compute positive publish state if pipeline is completed", () => {
      const draft = createMockDraft("d-done", PipelineState.COMPLETED);
      const state: StoreState = {
        currentDraft: draft,
        drafts: [draft],
        selectedDraftId: "d-done",
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

      expect(selectCanPublish(state)).toBe(true);
      expect(selectIsPipelineCompleted(state)).toBe(true);
    });
  });

  describe("Error Recovery", () => {
    it("should clear errors on clearError action", () => {
      store["updateState"]({ error: new Error("Test error") });
      expect(store.getState().error).not.toBeNull();

      store.clearError();
      expect(store.getState().error).toBeNull();
    });
  });
});
