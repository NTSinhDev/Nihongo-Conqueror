import { PipelineContext } from "../domain/types";

export interface ICommand {
  readonly commandId: string;
  readonly timestamp: string;
  readonly type: string;
}

export interface StartPipelineCommand extends ICommand {
  readonly type: "StartPipeline";
  readonly draftId: string;
}

export interface PausePipelineCommand extends ICommand {
  readonly type: "PausePipeline";
  readonly draftId: string;
}

export interface ResumePipelineCommand extends ICommand {
  readonly type: "ResumePipeline";
  readonly draftId: string;
}

export interface CancelPipelineCommand extends ICommand {
  readonly type: "CancelPipeline";
  readonly draftId: string;
}

export interface RetryStepCommand extends ICommand {
  readonly type: "RetryStep";
  readonly draftId: string;
  readonly stepId: string;
}

export interface SkipStepCommand extends ICommand {
  readonly type: "SkipStep";
  readonly draftId: string;
  readonly stepId: string;
}

export interface ResetPipelineCommand extends ICommand {
  readonly type: "ResetPipeline";
  readonly draftId: string;
}

export interface UpdateContextCommand extends ICommand {
  readonly type: "UpdateContext";
  readonly draftId: string;
  readonly updatedContext: Partial<PipelineContext>;
}

export interface PublishLessonCommand extends ICommand {
  readonly type: "PublishLesson";
  readonly draftId: string;
}
