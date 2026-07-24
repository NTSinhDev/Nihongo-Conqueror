import { ICommandDispatcher, IPipelineRunner, IEventDispatcher } from "./engine";
import { 
  ICommand,
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
import { IDraftRepository, ILessonRepository, ILogger, IClock, IIdGenerator } from "./ports";
import { PipelineState, StepState } from "../domain/types";
import { BusinessError, ValidationError, FatalError } from "../domain/errors";
import { LessonPublishedEvent } from "../domain/events";

export class CommandDispatcher implements ICommandDispatcher {
  constructor(
    private readonly draftRepository: IDraftRepository,
    private readonly lessonRepository: ILessonRepository,
    private readonly pipelineRunner: IPipelineRunner,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly logger: ILogger,
    private readonly clock: IClock,
    private readonly idGenerator: IIdGenerator
  ) {}

  async dispatch(command: ICommand): Promise<void> {
    this.logger.debug(`Dispatching command: ${command.type}`, { command });

    switch (command.type) {
      case "StartPipeline":
        await this.handleStartPipeline(command as StartPipelineCommand);
        break;
      case "PausePipeline":
        await this.handlePausePipeline(command as PausePipelineCommand);
        break;
      case "ResumePipeline":
        await this.handleResumePipeline(command as ResumePipelineCommand);
        break;
      case "CancelPipeline":
        await this.handleCancelPipeline(command as CancelPipelineCommand);
        break;
      case "RetryStep":
        await this.handleRetryStep(command as RetryStepCommand);
        break;
      case "SkipStep":
        await this.handleSkipStep(command as SkipStepCommand);
        break;
      case "ResetPipeline":
        await this.handleResetPipeline(command as ResetPipelineCommand);
        break;
      case "UpdateContext":
        await this.handleUpdateContext(command as UpdateContextCommand);
        break;
      case "PublishLesson":
        await this.handlePublishLesson(command as PublishLessonCommand);
        break;
      default:
        throw new ValidationError(`Unknown command type: ${command.type}`);
    }
  }

  private async handleStartPipeline(command: StartPipelineCommand): Promise<void> {
    const draft = await this.getDraftOrThrow(command.draftId);
    
    if (draft.pipelineState === PipelineState.COMPLETED) {
      this.logger.info(`Pipeline is already completed. Ignoring start command.`);
      return;
    }

    if (draft.pipelineState === PipelineState.RUNNING) {
      this.logger.info(`Pipeline is already running. Ensuring execution runner is active.`);
      this.pipelineRunner.run(command.draftId).catch((err) => {
        this.logger.error(`Asynchronous PipelineRunner execution failed:`, err);
      });
      return;
    }

    draft.pipelineState = PipelineState.RUNNING;
    draft.updatedAt = this.clock.now();
    await this.draftRepository.save(draft);

    // Start pipeline execution (runs asynchronously in the background)
    this.pipelineRunner.run(command.draftId).catch((err) => {
      this.logger.error(`Asynchronous PipelineRunner execution failed:`, err);
    });
  }

  private async handlePausePipeline(command: PausePipelineCommand): Promise<void> {
    const draft = await this.getDraftOrThrow(command.draftId);

    if (draft.pipelineState !== PipelineState.RUNNING) {
      throw new BusinessError(
        `Cannot pause pipeline when state is ${draft.pipelineState}. Only running pipelines can be paused.`
      );
    }

    draft.pipelineState = PipelineState.PAUSED;
    draft.updatedAt = this.clock.now();
    await this.draftRepository.save(draft);
    
    this.logger.info(`Pipeline ${command.draftId} marked as PAUSED. It will pause on the next step boundary.`);
  }

  private async handleResumePipeline(command: ResumePipelineCommand): Promise<void> {
    const draft = await this.getDraftOrThrow(command.draftId);

    if (draft.pipelineState === PipelineState.RUNNING) {
      this.logger.info(`Pipeline is already running. Ensuring execution runner is active.`);
      this.pipelineRunner.run(command.draftId).catch((err) => {
        this.logger.error(`Asynchronous PipelineRunner execution failed:`, err);
      });
      return;
    }

    if (
      draft.pipelineState !== PipelineState.PAUSED && 
      draft.pipelineState !== PipelineState.FAILED &&
      draft.pipelineState !== PipelineState.CANCELLED
    ) {
      this.logger.warn(`Ignoring resume command as state is ${draft.pipelineState}`);
      return;
    }

    draft.pipelineState = PipelineState.RUNNING;
    draft.updatedAt = this.clock.now();
    await this.draftRepository.save(draft);

    this.pipelineRunner.run(command.draftId).catch((err) => {
      this.logger.error(`Asynchronous PipelineRunner execution failed:`, err);
    });
  }

  private async handleCancelPipeline(command: CancelPipelineCommand): Promise<void> {
    const draft = await this.getDraftOrThrow(command.draftId);

    if (
      draft.pipelineState === PipelineState.COMPLETED || 
      draft.pipelineState === PipelineState.CANCELLED
    ) {
      throw new BusinessError(
        `Cannot cancel pipeline when state is ${draft.pipelineState}.`
      );
    }

    draft.pipelineState = PipelineState.CANCELLED;
    draft.updatedAt = this.clock.now();
    await this.draftRepository.save(draft);

    this.logger.info(`Pipeline ${command.draftId} marked as CANCELLED.`);
  }

  private async handleRetryStep(command: RetryStepCommand): Promise<void> {
    const draft = await this.getDraftOrThrow(command.draftId);
    const stepId = command.stepId;

    if (!draft.steps[stepId]) {
      throw new ValidationError(`Step ${stepId} does not exist in draft ${command.draftId}.`);
    }

    const stepStatus = draft.steps[stepId];
    // Any step that exists can be retried (re-run/regenerated), including SUCCESS or SKIPPED steps
    stepStatus.status = StepState.PENDING;
    stepStatus.retryCount += 1;
    stepStatus.errorMessage = undefined;

    draft.pipelineState = PipelineState.RUNNING;
    draft.updatedAt = this.clock.now();
    await this.draftRepository.save(draft);

    this.pipelineRunner.run(command.draftId).catch((err) => {
      this.logger.error(`Asynchronous PipelineRunner execution failed:`, err);
    });
  }

  private async handleSkipStep(command: SkipStepCommand): Promise<void> {
    const draft = await this.getDraftOrThrow(command.draftId);
    const stepId = command.stepId;

    if (!draft.steps[stepId]) {
      draft.steps[stepId] = {
        status: StepState.PENDING,
        retryCount: 0,
      };
    }

    const stepStatus = draft.steps[stepId];
    if (stepStatus.status === StepState.SUCCESS) {
      throw new BusinessError(`Cannot skip step ${stepId} because it is already successful.`);
    }

    stepStatus.status = StepState.SKIPPED;
    stepStatus.completedAt = this.clock.now();

    if (draft.pipelineState === PipelineState.FAILED && draft.currentStepId === stepId) {
      draft.pipelineState = PipelineState.RUNNING;
    }

    draft.updatedAt = this.clock.now();
    await this.draftRepository.save(draft);

    this.logger.info(`Step ${stepId} skipped by user request.`);

    if (draft.pipelineState === PipelineState.RUNNING) {
      this.pipelineRunner.run(command.draftId).catch((err) => {
        this.logger.error(`Asynchronous PipelineRunner execution failed:`, err);
      });
    }
  }

  private async handleResetPipeline(command: ResetPipelineCommand): Promise<void> {
    const draft = await this.getDraftOrThrow(command.draftId);

    draft.steps = {};
    draft.currentStepId = null;
    draft.pipelineState = PipelineState.DRAFT;
    
    draft.context.validated = { vocabulary: [], grammar: [] };
    draft.context.tokenized = { vocabularyTokens: {} };
    draft.context.generated = {
      vocabularyWithMeanings: [],
      vocabularyWithExamples: [],
      grammarWithMeanings: [],
      grammarWithExamples: [],
      review: null,
    };

    draft.updatedAt = this.clock.now();
    await this.draftRepository.save(draft);

    this.logger.info(`Pipeline for draft ${command.draftId} has been reset to draft.`);
  }

  private async handleUpdateContext(command: UpdateContextCommand): Promise<void> {
    const draft = await this.getDraftOrThrow(command.draftId);

    draft.context = this.deepMergeContext(draft.context, command.updatedContext);
    draft.updatedAt = this.clock.now();
    await this.draftRepository.save(draft);

    this.logger.info(`Context of draft ${command.draftId} updated directly.`);
  }

  private async handlePublishLesson(command: PublishLessonCommand): Promise<void> {
    const draft = await this.getDraftOrThrow(command.draftId);

    if (draft.pipelineState !== PipelineState.COMPLETED) {
      throw new BusinessError(
        `Cannot publish lesson because the pipeline is in ${draft.pipelineState} state. It must be COMPLETED.`
      );
    }

    const { lessonId, level } = draft.context.metadata;
    await this.lessonRepository.publish(lessonId, level, draft.context);

    this.eventDispatcher.dispatch({
      eventId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      eventType: "LessonPublished",
      aggregateId: draft.id,
      lessonId,
      level,
    } as LessonPublishedEvent);

    this.logger.info(`Lesson ${level} Lesson ${lessonId} published successfully.`);
  }

  private async getDraftOrThrow(draftId: string) {
    const draft = await this.draftRepository.getById(draftId);
    if (!draft) {
      throw new FatalError(`Draft with ID ${draftId} not found.`);
    }
    return draft;
  }

  private deepMergeContext(target: any, source: any): any {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMergeContext(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === "object" && !Array.isArray(item);
  }
}
