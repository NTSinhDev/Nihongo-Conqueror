import React, { createContext, useContext, useSyncExternalStore, useMemo } from "react";
import { LessonBuilderStore, StoreState } from "./lessonBuilderStore";
import { LessonDraft, PipelineState, StepState } from "../domain/types";
import { CreateDraftInput } from "../application/lessonBuilderService";

// Selectors
export const selectCurrentDraft = (state: StoreState): LessonDraft | null => state.currentDraft;
export const selectDrafts = (state: StoreState): LessonDraft[] => state.drafts;

export const selectCompletedSteps = (state: StoreState): string[] => {
  const draft = state.currentDraft;
  if (!draft || !draft.steps) return [];
  return Object.entries(draft.steps)
    .filter(([_, step]) => step.status === StepState.SUCCESS)
    .map(([id]) => id);
};

export const selectRunningStep = (state: StoreState): string | null => {
  const draft = state.currentDraft;
  if (!draft) return null;
  if (draft.currentStepId) {
    const step = draft.steps[draft.currentStepId];
    if (step && step.status === StepState.RUNNING) {
      return draft.currentStepId;
    }
  }
  const running = Object.entries(draft.steps).find(([_, step]) => step.status === StepState.RUNNING);
  return running ? running[0] : null;
};

export const selectFailedSteps = (state: StoreState): string[] => {
  const draft = state.currentDraft;
  if (!draft || !draft.steps) return [];
  return Object.entries(draft.steps)
    .filter(([_, step]) => step.status === StepState.FAILED)
    .map(([id]) => id);
};

export const TOTAL_PIPELINE_STEPS = 8;

export const selectPipelineProgress = (state: StoreState): { completed: number; total: number; percentage: number } => {
  const draft = state.currentDraft;
  if (!draft) {
    return { completed: 0, total: TOTAL_PIPELINE_STEPS, percentage: 0 };
  }
  const completed = Object.values(draft.steps).filter((s) => s.status === StepState.SUCCESS).length;
  const percentage = Math.round((completed / TOTAL_PIPELINE_STEPS) * 100);
  return { completed, total: TOTAL_PIPELINE_STEPS, percentage };
};

export const selectIsPipelineRunning = (state: StoreState): boolean => {
  return state.currentDraft?.pipelineState === PipelineState.RUNNING;
};

export const selectIsPipelinePaused = (state: StoreState): boolean => {
  return state.currentDraft?.pipelineState === PipelineState.PAUSED;
};

export const selectIsPipelineCompleted = (state: StoreState): boolean => {
  return state.currentDraft?.pipelineState === PipelineState.COMPLETED;
};

export const selectHasErrors = (state: StoreState): boolean => {
  if (state.error) return true;
  const draft = state.currentDraft;
  if (!draft) return false;
  if (draft.pipelineState === PipelineState.FAILED) return true;
  return Object.values(draft.steps).some((s) => s.status === StepState.FAILED);
};

export const selectCanPublish = (state: StoreState): boolean => {
  const draft = state.currentDraft;
  if (!draft) return false;
  return draft.pipelineState === PipelineState.COMPLETED;
};

export const selectCanResume = (state: StoreState): boolean => {
  const draft = state.currentDraft;
  if (!draft) return false;
  return (
    draft.pipelineState === PipelineState.PAUSED ||
    draft.pipelineState === PipelineState.FAILED ||
    draft.pipelineState === PipelineState.CANCELLED
  );
};

export const selectCanRetry = (state: StoreState): boolean => {
  const draft = state.currentDraft;
  if (!draft) return false;
  return (
    draft.pipelineState === PipelineState.FAILED ||
    draft.pipelineState === PipelineState.CANCELLED ||
    Object.values(draft.steps).some((s) => s.status === StepState.FAILED)
  );
};

export interface LessonBuilderActions {
  loadDraft: (id: string) => Promise<void>;
  loadDrafts: () => Promise<void>;
  createDraft: (input: CreateDraftInput) => Promise<LessonDraft>;
  updateDraft: (id: string, updates: Partial<LessonDraft>) => Promise<LessonDraft>;
  deleteDraft: (id: string) => Promise<void>;
  duplicateDraft: (id: string) => Promise<LessonDraft>;
  archiveDraft: (id: string) => Promise<LessonDraft>;
  startPipeline: (id: string) => Promise<void>;
  pausePipeline: (id: string) => Promise<void>;
  resumePipeline: (id: string) => Promise<void>;
  cancelPipeline: (id: string) => Promise<void>;
  retryStep: (id: string, stepId: string) => Promise<void>;
  publishLesson: (id: string) => Promise<void>;
  watchDraft: (id: string) => () => void;
  clearError: () => void;
  reset: () => void;
}

const LessonBuilderContext = createContext<{
  store: LessonBuilderStore;
  actions: LessonBuilderActions;
} | null>(null);

interface ProviderProps {
  store: LessonBuilderStore;
  children: React.ReactNode;
}

export function LessonBuilderProvider({ store, children }: ProviderProps) {
  // Memoize stable actions bound to the store
  const actions = useMemo<LessonBuilderActions>(() => {
    return {
      loadDraft: (id: string) => store.loadDraft(id),
      loadDrafts: () => store.loadDrafts(),
      createDraft: (input: CreateDraftInput) => store.createDraft(input),
      updateDraft: (id: string, updates: Partial<LessonDraft>) => store.updateDraft(id, updates),
      deleteDraft: (id: string) => store.deleteDraft(id),
      duplicateDraft: (id: string) => store.duplicateDraft(id),
      archiveDraft: (id: string) => store.archiveDraft(id),
      startPipeline: (id: string) => store.startPipeline(id),
      pausePipeline: (id: string) => store.pausePipeline(id),
      resumePipeline: (id: string) => store.resumePipeline(id),
      cancelPipeline: (id: string) => store.cancelPipeline(id),
      retryStep: (id: string, stepId: string) => store.retryStep(id, stepId),
      publishLesson: (id: string) => store.publishLesson(id),
      watchDraft: (id: string) => store.watchDraft(id),
      clearError: () => store.clearError(),
      reset: () => store.reset(),
    };
  }, [store]);

  return (
    <LessonBuilderContext.Provider value={{ store, actions }}>
      {children}
    </LessonBuilderContext.Provider>
  );
}

export function useLessonBuilderContext() {
  const context = useContext(LessonBuilderContext);
  if (!context) {
    throw new Error("useLessonBuilderContext must be used within a LessonBuilderProvider");
  }
  return context;
}

// 1. useLessonBuilder(): Exposes the entire state and actions
export function useLessonBuilder() {
  const { store, actions } = useLessonBuilderContext();
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState()
  );
  return { state, actions };
}

// 2. useDraft(): Exposes currentDraft and draft-specific state/actions
export function useDraft() {
  const { store, actions } = useLessonBuilderContext();
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState()
  );
  return {
    currentDraft: selectCurrentDraft(state),
    isLoading: state.isLoadingDraft,
    isUpdating: state.isUpdatingDraft,
    isCreating: state.isCreatingDraft,
    error: state.error,
    loadDraft: actions.loadDraft,
    updateDraft: actions.updateDraft,
    createDraft: actions.createDraft,
  };
}

// 3. useDraftList(): Exposes draft list state and actions
export function useDraftList() {
  const { store, actions } = useLessonBuilderContext();
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState()
  );
  return {
    drafts: selectDrafts(state),
    isLoading: state.isLoadingDrafts,
    isDeleting: state.isDeletingDraft,
    isDuplicating: state.isDuplicatingDraft,
    isArchiving: state.isArchivingDraft,
    error: state.error,
    loadDrafts: actions.loadDrafts,
    deleteDraft: actions.deleteDraft,
    duplicateDraft: actions.duplicateDraft,
    archiveDraft: actions.archiveDraft,
  };
}

// 4. usePipeline(): Exposes pipeline status, run control states and actions
export function usePipeline() {
  const { store, actions } = useLessonBuilderContext();
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState()
  );

  return {
    status: state.currentDraft?.pipelineState || null,
    activeStepId: state.currentDraft?.currentStepId || null,
    isStarting: state.isStartingPipeline,
    isPausing: state.isPausingPipeline,
    isResuming: state.isResumingPipeline,
    isCanceling: state.isCancelingPipeline,
    isRetrying: state.isRetryingStep,
    isPublishing: state.isPublishingLesson,
    isPipelineRunning: selectIsPipelineRunning(state),
    isPipelinePaused: selectIsPipelinePaused(state),
    isPipelineCompleted: selectIsPipelineCompleted(state),
    canResume: selectCanResume(state),
    canRetry: selectCanRetry(state),
    canPublish: selectCanPublish(state),
    error: state.error,
    startPipeline: () => {
      const currentDraft = selectCurrentDraft(state);
      if (currentDraft) return actions.startPipeline(currentDraft.id);
      return Promise.reject(new Error("No active draft to start pipeline."));
    },
    pausePipeline: () => {
      const currentDraft = selectCurrentDraft(state);
      if (currentDraft) return actions.pausePipeline(currentDraft.id);
      return Promise.reject(new Error("No active draft to pause pipeline."));
    },
    resumePipeline: () => {
      const currentDraft = selectCurrentDraft(state);
      if (currentDraft) return actions.resumePipeline(currentDraft.id);
      return Promise.reject(new Error("No active draft to resume pipeline."));
    },
    cancelPipeline: () => {
      const currentDraft = selectCurrentDraft(state);
      if (currentDraft) return actions.cancelPipeline(currentDraft.id);
      return Promise.reject(new Error("No active draft to cancel pipeline."));
    },
    retryStep: (stepId: string) => {
      const currentDraft = selectCurrentDraft(state);
      if (currentDraft) return actions.retryStep(currentDraft.id, stepId);
      return Promise.reject(new Error("No active draft to retry step."));
    },
    publishLesson: () => {
      const currentDraft = selectCurrentDraft(state);
      if (currentDraft) return actions.publishLesson(currentDraft.id);
      return Promise.reject(new Error("No active draft to publish."));
    },
  };
}

// 5. usePipelineProgress(): Exposes progress counters and percentage
export function usePipelineProgress() {
  const { store } = useLessonBuilderContext();
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState()
  );
  return selectPipelineProgress(state);
}

// 6. useStepStatus(): Exposes selectors for step-specific state
export function useStepStatus() {
  const { store } = useLessonBuilderContext();
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState()
  );

  const completedSteps = selectCompletedSteps(state);
  const runningStep = selectRunningStep(state);
  const failedSteps = selectFailedSteps(state);

  const getStepStatus = (stepId: string) => {
    const draft = state.currentDraft;
    if (!draft || !draft.steps) return null;
    return draft.steps[stepId] || null;
  };

  return {
    completedSteps,
    runningStep,
    failedSteps,
    getStepStatus,
  };
}

// 7. useLessonActions(): Exposes action dispatchers
export function useLessonActions() {
  const { actions } = useLessonBuilderContext();
  return actions;
}
