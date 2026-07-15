import { IStepHandler } from "./step";
import { 
  StartPipelineCommand, 
  PausePipelineCommand, 
  ResumePipelineCommand, 
  CancelPipelineCommand, 
  RetryStepCommand, 
  SkipStepCommand, 
  ResetPipelineCommand, 
  UpdateContextCommand, 
  PublishLessonCommand 
} from "./commands";
import { IDomainEvent } from "../domain/events";

export interface IStepRegistry {
  register(step: IStepHandler): void;
  getStep(stepId: string): IStepHandler | null;
  getOrderedStepIds(): string[];
}

export interface IEventDispatcher {
  dispatch(event: IDomainEvent): void;
  subscribe(eventType: string, handler: (event: any) => void): () => void;
}

export interface ICommandDispatcher {
  dispatch(command: StartPipelineCommand): Promise<void>;
  dispatch(command: PausePipelineCommand): Promise<void>;
  dispatch(command: ResumePipelineCommand): Promise<void>;
  dispatch(command: CancelPipelineCommand): Promise<void>;
  dispatch(command: RetryStepCommand): Promise<void>;
  dispatch(command: SkipStepCommand): Promise<void>;
  dispatch(command: ResetPipelineCommand): Promise<void>;
  dispatch(command: UpdateContextCommand): Promise<void>;
  dispatch(command: PublishLessonCommand): Promise<void>;
}

export interface IPipelineRunner {
  /**
   * Run the pipeline starting from the current active/pending step.
   * Execution continues sequentially through the steps in stepRegistry.
   */
  run(draftId: string): Promise<void>;
}

export interface IWorkflowEngine {
  readonly stepRegistry: IStepRegistry;
  readonly commandDispatcher: ICommandDispatcher;
  readonly eventDispatcher: IEventDispatcher;
  readonly runner: IPipelineRunner;

  executePipeline(draftId: string): Promise<void>;
  executeStep(draftId: string, stepId: string): Promise<void>;
  resumePipeline(draftId: string): Promise<void>;
  pausePipeline(draftId: string): Promise<void>;
  cancelPipeline(draftId: string): Promise<void>;
}
