import { PipelineState, StepState, LessonDraft } from "./types";

export interface IDomainEvent {
  eventId: string;
  timestamp: string;
  eventType: string;
  aggregateId: string;
}

export interface PipelineStartedEvent extends IDomainEvent {
  eventType: "PipelineStarted";
  level: string;
  lessonId: number;
}

export interface PipelineCompletedEvent extends IDomainEvent {
  eventType: "PipelineCompleted";
  draft: LessonDraft;
}

export interface PipelineFailedEvent extends IDomainEvent {
  eventType: "PipelineFailed";
  error: string;
  failedStepId: string;
}

export interface PipelinePausedEvent extends IDomainEvent {
  eventType: "PipelinePaused";
  pausedStepId: string;
}

export interface PipelineCancelledEvent extends IDomainEvent {
  eventType: "PipelineCancelled";
  cancelledStepId: string;
}

export interface StepStartedEvent extends IDomainEvent {
  eventType: "StepStarted";
  stepId: string;
}

export interface StepSucceededEvent extends IDomainEvent {
  eventType: "StepSucceeded";
  stepId: string;
  durationMs: number;
}

export interface StepFailedEvent extends IDomainEvent {
  eventType: "StepFailed";
  stepId: string;
  error: string;
  retryCount: number;
  isRetryable: boolean;
}

export interface StepSkippedEvent extends IDomainEvent {
  eventType: "StepSkipped";
  stepId: string;
}

export interface LessonPublishedEvent extends IDomainEvent {
  eventType: "LessonPublished";
  lessonId: number;
  level: string;
}
