import { IPipelineRunner, IStepRegistry, IEventDispatcher } from "./engine";
import { 
  IDraftRepository, 
  IAIService, 
  ILogger, 
  IClock, 
  IIdGenerator 
} from "./ports";
import { PipelineState, StepState, LessonDraft } from "../domain/types";
import { FatalError, AIError } from "../domain/errors";
import { 
  PipelineStartedEvent, 
  PipelineCompletedEvent, 
  PipelineFailedEvent, 
  PipelinePausedEvent, 
  PipelineCancelledEvent, 
  StepStartedEvent, 
  StepSucceededEvent, 
  StepFailedEvent, 
  StepSkippedEvent 
} from "../domain/events";

export class PipelineRunner implements IPipelineRunner {
  constructor(
    private readonly draftRepository: IDraftRepository,
    private readonly stepRegistry: IStepRegistry,
    private readonly eventDispatcher: IEventDispatcher,
    private readonly aiService: IAIService,
    private readonly logger: ILogger,
    private readonly clock: IClock,
    private readonly idGenerator: IIdGenerator
  ) {}

  async run(draftId: string): Promise<void> {
    const pipelineStartTime = Date.now();
    this.logger.info(`Starting PipelineRunner for draft: ${draftId}`);
    
    // 1. Fetch latest draft state
    let draft = await this.draftRepository.getById(draftId);
    if (!draft) {
      throw new FatalError(`Draft with ID ${draftId} not found.`);
    }

    // 2. Preconditions check
    if (draft.pipelineState === PipelineState.COMPLETED) {
      this.logger.info(`Pipeline ${draftId} is already completed.`);
      return;
    }

    // Update state to running if not already
    if (draft.pipelineState !== PipelineState.RUNNING) {
      draft.pipelineState = PipelineState.RUNNING;
      draft.updatedAt = this.clock.now();
      await this.draftRepository.save(draft);
    }

    // Dispatch PipelineStarted event
    this.eventDispatcher.dispatch({
      eventId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      eventType: "PipelineStarted",
      aggregateId: draftId,
      level: draft.context.metadata.level,
      lessonId: draft.context.metadata.lessonId,
    } as PipelineStartedEvent);

    // 3. Execution loop
    const stepIds = this.stepRegistry.getOrderedStepIds();
    
    for (const stepId of stepIds) {
      // Re-fetch draft at the start of each step to check for external cancellation/pausing commands
      draft = await this.draftRepository.getById(draftId);
      if (!draft) {
        throw new FatalError(`Draft with ID ${draftId} not found during pipeline run.`);
      }

      // Check external signals
      if (draft.pipelineState === PipelineState.CANCELLED) {
        this.logger.info(`Pipeline ${draftId} execution cancelled before running step: ${stepId}`);
        await this.handleCancelledStep(draft, stepId);
        return;
      }

      if (draft.pipelineState === PipelineState.PAUSED) {
        this.logger.info(`Pipeline ${draftId} execution paused before running step: ${stepId}`);
        this.eventDispatcher.dispatch({
          eventId: this.idGenerator.generateId(),
          timestamp: this.clock.now(),
          eventType: "PipelinePaused",
          aggregateId: draftId,
          pausedStepId: stepId
        } as PipelinePausedEvent);
        return;
      }

      // Initialize step status if it does not exist
      if (!draft.steps[stepId]) {
        draft.steps[stepId] = {
          status: StepState.PENDING,
          retryCount: 0,
        };
      }

      const stepStatus = draft.steps[stepId];

      // Skip already successful or skipped steps (crucial for resume)
      if (stepStatus.status === StepState.SUCCESS) {
        let dataIsValid = true;
        const context = draft.context;
        if (stepId === "generate-review") {
          const review = context.generated?.review;
          if (!review || !review.quickQuiz || !Array.isArray(review.quickQuiz) || review.quickQuiz.length === 0) {
            dataIsValid = false;
          }
        } else if (stepId === "validate-vocabulary") {
          if (!context.validated?.vocabulary || context.validated.vocabulary.length === 0) {
            dataIsValid = false;
          }
        } else if (stepId === "validate-grammar") {
          if (!context.validated?.grammar || context.validated.grammar.length === 0) {
            dataIsValid = false;
          }
        } else if (stepId === "tokenize-vocabulary") {
          if (!context.tokenized?.vocabularyTokens || Object.keys(context.tokenized.vocabularyTokens).length === 0) {
            dataIsValid = false;
          }
        } else if (stepId === "generate-english") {
          if (!context.generated?.vocabularyWithMeanings || context.generated.vocabularyWithMeanings.length === 0) {
            dataIsValid = false;
          }
        } else if (stepId === "generate-vocabulary-examples") {
          if (!context.generated?.vocabularyWithExamples || context.generated.vocabularyWithExamples.length === 0) {
            dataIsValid = false;
          }
        } else if (stepId === "generate-grammar-examples") {
          if (!context.generated?.grammarWithExamples || context.generated.grammarWithExamples.length === 0) {
            dataIsValid = false;
          }
        }

        if (dataIsValid) {
          this.logger.info(`Skipping step ${stepId} as it is already marked SUCCESS.`);
          continue;
        } else {
          this.logger.warn(`Step ${stepId} was marked SUCCESS but its expected output data is missing/invalid. Resetting to PENDING to regenerate.`);
          stepStatus.status = StepState.PENDING;
        }
      }

      if (stepStatus.status === StepState.SKIPPED) {
        this.logger.info(`Skipping step ${stepId} as it is already marked SKIPPED.`);
        continue;
      }

      // 4. Run step
      const success = await this.executeSingleStep(draft, stepId);
      if (!success) {
        // Step failed, run terminates
        this.logger.error(`Pipeline execution stopped due to failure at step: ${stepId}`);
        return;
      }
    }

    // 5. If all steps completed successfully
    draft = await this.draftRepository.getById(draftId);
    if (draft && draft.pipelineState === PipelineState.RUNNING) {
      draft.pipelineState = PipelineState.COMPLETED;
      draft.currentStepId = null;
      draft.updatedAt = this.clock.now();
      await this.draftRepository.save(draft);

      this.eventDispatcher.dispatch({
        eventId: this.idGenerator.generateId(),
        timestamp: this.clock.now(),
        eventType: "PipelineCompleted",
        aggregateId: draftId,
        draft
      } as PipelineCompletedEvent);

      console.log(`[TELEMETRY] [PIPELINE_RUNNER] PipelineCompleted`, {
        draftId,
        level: draft.context.metadata.level,
        lessonId: draft.context.metadata.lessonId,
        totalDurationMs: Date.now() - pipelineStartTime,
      });

      this.logger.info(`Pipeline completed successfully for draft: ${draftId}`);
    }
  }

  private async executeSingleStep(draft: LessonDraft, stepId: string): Promise<boolean> {
    const handler = this.stepRegistry.getStep(stepId);
    if (!handler) {
      const errorMsg = `No step handler registered for step ID: ${stepId}`;
      this.logger.error(errorMsg);
      await this.markStepAsFailed(draft, stepId, errorMsg, false);
      return false;
    }

    const stepStatus = draft.steps[stepId];
    
    // Transition step status to RUNNING
    stepStatus.status = StepState.RUNNING;
    stepStatus.startedAt = this.clock.now();
    stepStatus.errorMessage = undefined;
    draft.currentStepId = stepId;
    draft.updatedAt = this.clock.now();
    
    await this.draftRepository.save(draft);

    this.eventDispatcher.dispatch({
      eventId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      eventType: "StepStarted",
      aggregateId: draft.id,
      stepId,
    } as StepStartedEvent);

    const startTime = Date.now();

    try {
      this.logger.info(`Executing step: ${stepId} (${handler.description})`);
      
      const execContext = {
        draftId: draft.id,
        stepId,
        aiService: this.aiService,
        logger: this.logger,
        retryCount: stepStatus.retryCount,
        promptVersion: draft.promptVersion,
        aiModel: draft.aiModel,
      };

      const result = await handler.execute(draft.context, execContext);
      const durationMs = Date.now() - startTime;

      // Re-fetch latest draft status to make sure the user did not cancel while the step was executing
      const freshDraft = await this.draftRepository.getById(draft.id);
      if (!freshDraft) {
        throw new FatalError(`Draft with ID ${draft.id} disappeared during step execution.`);
      }

      if (freshDraft.pipelineState === PipelineState.CANCELLED) {
        this.logger.info(`Step ${stepId} completed but pipeline was CANCELLED in the meantime. Discarding results.`);
        await this.handleCancelledStep(freshDraft, stepId);
        return false;
      }

      if (result.status === StepState.SUCCESS) {
        // Merge partial context updates
        if (result.updatedContext) {
          freshDraft.context = this.deepMergeContext(freshDraft.context, result.updatedContext);
        }

        freshDraft.steps[stepId] = {
          status: StepState.SUCCESS,
          retryCount: stepStatus.retryCount,
          startedAt: stepStatus.startedAt,
          completedAt: this.clock.now(),
        };

        freshDraft.updatedAt = this.clock.now();
        await this.draftRepository.save(freshDraft);

        this.eventDispatcher.dispatch({
          eventId: this.idGenerator.generateId(),
          timestamp: this.clock.now(),
          eventType: "StepSucceeded",
          aggregateId: freshDraft.id,
          stepId,
          durationMs,
        } as StepSucceededEvent);

        console.log(`[TELEMETRY] [PIPELINE_RUNNER] StepSucceeded`, {
          draftId: freshDraft.id,
          stepId,
          retryCount: stepStatus.retryCount,
          durationMs,
        });

        return true;
      } else if (result.status === StepState.SKIPPED) {
        freshDraft.steps[stepId] = {
          status: StepState.SKIPPED,
          retryCount: stepStatus.retryCount,
          startedAt: stepStatus.startedAt,
          completedAt: this.clock.now(),
          errorMessage: result.errorMessage,
        };

        freshDraft.updatedAt = this.clock.now();
        await this.draftRepository.save(freshDraft);

        this.eventDispatcher.dispatch({
          eventId: this.idGenerator.generateId(),
          timestamp: this.clock.now(),
          eventType: "StepSkipped",
          aggregateId: freshDraft.id,
          stepId,
        } as StepSkippedEvent);

        console.log(`[TELEMETRY] [PIPELINE_RUNNER] StepSkipped`, {
          draftId: freshDraft.id,
          stepId,
          durationMs,
        });

        return true;
      } else {
        const errorMsg = result.errorMessage || `Step execution returned failed status.`;
        await this.markStepAsFailed(freshDraft, stepId, errorMsg, true);
        return false;
      }
    } catch (err: any) {
      this.logger.error(`Error during execution of step ${stepId}:`, err);
      
      const isRetryable = err instanceof AIError ? err.isRetryable : true;
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      const freshDraft = await this.draftRepository.getById(draft.id);
      if (freshDraft) {
        await this.markStepAsFailed(freshDraft, stepId, errorMsg, isRetryable);
      }
      return false;
    }
  }

  private async markStepAsFailed(
    draft: LessonDraft,
    stepId: string,
    errorMessage: string,
    isRetryable: boolean
  ): Promise<void> {
    const stepStatus = draft.steps[stepId] || { retryCount: 0, status: StepState.PENDING };
    
    stepStatus.status = StepState.FAILED;
    stepStatus.errorMessage = errorMessage;
    stepStatus.completedAt = this.clock.now();

    draft.pipelineState = PipelineState.FAILED;
    draft.updatedAt = this.clock.now();

    await this.draftRepository.save(draft);

    this.eventDispatcher.dispatch({
      eventId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      eventType: "StepFailed",
      aggregateId: draft.id,
      stepId,
      error: errorMessage,
      retryCount: stepStatus.retryCount,
      isRetryable,
    } as StepFailedEvent);

    this.eventDispatcher.dispatch({
      eventId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      eventType: "PipelineFailed",
      aggregateId: draft.id,
      error: errorMessage,
      failedStepId: stepId,
    } as PipelineFailedEvent);

    console.log(`[TELEMETRY] [PIPELINE_RUNNER] StepFailed`, {
      draftId: draft.id,
      stepId,
      retryCount: stepStatus.retryCount,
      durationMs: stepStatus.startedAt ? (Date.now() - new Date(stepStatus.startedAt).getTime()) : 0,
      errorMessage,
      isRetryable,
    });
  }

  private async handleCancelledStep(draft: LessonDraft, stepId: string): Promise<void> {
    draft.steps[stepId] = {
      status: StepState.CANCELLED,
      retryCount: draft.steps[stepId]?.retryCount || 0,
      completedAt: this.clock.now(),
      errorMessage: "Pipeline was cancelled.",
    };
    draft.updatedAt = this.clock.now();
    await this.draftRepository.save(draft);

    this.eventDispatcher.dispatch({
      eventId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      eventType: "PipelineCancelled",
      aggregateId: draft.id,
      cancelledStepId: stepId,
    } as PipelineCancelledEvent);
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
