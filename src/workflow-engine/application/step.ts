import { PipelineContext, StepState } from "../domain/types";
import { IAIService, ILogger } from "./ports";

export interface StepExecutionContext {
  draftId: string;
  stepId: string;
  aiService: IAIService;
  logger: ILogger;
  retryCount: number;
  promptVersion: string;
  aiModel: string;
}

export interface StepResult {
  status: StepState.SUCCESS | StepState.FAILED | StepState.SKIPPED;
  updatedContext?: Partial<PipelineContext>;
  errorMessage?: string;
}

export interface IStepHandler {
  readonly stepId: string;
  readonly description: string;
  
  execute(
    context: PipelineContext,
    execContext: StepExecutionContext
  ): Promise<StepResult>;
}
