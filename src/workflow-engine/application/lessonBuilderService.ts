import { IWorkflowEngine, ICommandDispatcher } from "./engine";
import { IDraftRepository, IClock, IIdGenerator } from "./ports";
import { LessonDraft, VocabularyItem, GrammarItem, PipelineState } from "../domain/types";
import { PublishLessonCommand } from "./commands";
import { BaseWorkflowError, ValidationError, BusinessError, InfrastructureError } from "../domain/errors";

export interface CreateDraftInput {
  metadata: {
    level: string;
    lessonId: number;
    titleVi: string;
    titleEn?: string;
  };
  input: {
    vocabulary: VocabularyItem[];
    grammar: GrammarItem[];
  };
  aiModel?: string;
  promptVersion?: string;
  createdById?: string;
}

export class LessonBuilderService {
  constructor(
    private readonly workflowEngine: IWorkflowEngine,
    private readonly draftRepository: IDraftRepository,
    private readonly commandDispatcher: ICommandDispatcher,
    private readonly idGenerator: IIdGenerator,
    private readonly clock: IClock
  ) {}

  /**
   * Creates a new lesson plan draft.
   */
  async createDraft(input: CreateDraftInput): Promise<LessonDraft> {
    try {
      if (!input.metadata) {
        throw new ValidationError("Metadata is required to create a draft.");
      }
      if (!input.metadata.level) {
        throw new ValidationError("Metadata level is required.");
      }
      if (!input.metadata.lessonId) {
        throw new ValidationError("Metadata lessonId is required.");
      }
      if (!input.metadata.titleVi) {
        throw new ValidationError("Metadata titleVi is required.");
      }
      if (!input.input) {
        throw new ValidationError("Input is required to create a draft.");
      }
      if (!Array.isArray(input.input.vocabulary)) {
        throw new ValidationError("Vocabulary list must be an array.");
      }
      if (!Array.isArray(input.input.grammar)) {
        throw new ValidationError("Grammar list must be an array.");
      }

      const draftId = this.idGenerator.generateId();
      const now = this.clock.now();

      const newDraft: LessonDraft = {
        id: draftId,
        schemaVersion: 1,
        aiModel: input.aiModel || "gemini-3.5-flash",
        promptVersion: input.promptVersion || "1.0",
        pipelineState: PipelineState.DRAFT,
        currentStepId: null,
        steps: {},
        context: {
          metadata: {
            level: input.metadata.level,
            lessonId: input.metadata.lessonId,
            titleVi: input.metadata.titleVi,
            titleEn: input.metadata.titleEn,
          },
          input: {
            vocabulary: input.input.vocabulary,
            grammar: input.input.grammar,
          },
          validated: {
            vocabulary: [],
            grammar: [],
          },
          tokenized: {
            vocabularyTokens: {},
          },
          generated: {
            vocabularyWithMeanings: [],
            vocabularyWithExamples: [],
            grammarWithMeanings: [],
            grammarWithExamples: [],
            review: null,
          },
        },
        createdById: input.createdById || "system",
        createdAt: now,
        updatedAt: now,
      };

      await this.draftRepository.create(newDraft);
      return newDraft;
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Updates an existing lesson plan draft.
   */
  async updateDraft(draftId: string, updates: Partial<LessonDraft>): Promise<LessonDraft> {
    try {
      const existing = await this.draftRepository.getById(draftId);
      if (!existing) {
        throw new BusinessError(`Draft with ID ${draftId} not found for update.`);
      }

      const updatedDraft: LessonDraft = {
        ...existing,
        ...updates,
        id: existing.id, // preserve id
        createdAt: existing.createdAt, // preserve createdAt
        updatedAt: this.clock.now(),
      };

      await this.draftRepository.save(updatedDraft);
      return updatedDraft;
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Deletes a draft by ID.
   */
  async deleteDraft(draftId: string): Promise<void> {
    try {
      const existing = await this.draftRepository.getById(draftId);
      if (!existing) {
        throw new BusinessError(`Draft with ID ${draftId} not found for deletion.`);
      }
      await this.draftRepository.delete(draftId);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Retrieves a draft by ID.
   */
  async getDraft(draftId: string): Promise<LessonDraft> {
    try {
      const draft = await this.draftRepository.getById(draftId);
      if (!draft) {
        throw new BusinessError(`Draft with ID ${draftId} not found.`);
      }
      return draft;
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Lists all drafts.
   */
  async listDrafts(): Promise<LessonDraft[]> {
    try {
      return await this.draftRepository.list();
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Starts pipeline execution.
   */
  async startPipeline(draftId: string): Promise<void> {
    try {
      await this.workflowEngine.executePipeline(draftId);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Pauses the running pipeline.
   */
  async pausePipeline(draftId: string): Promise<void> {
    try {
      await this.workflowEngine.pausePipeline(draftId);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Resumes a paused or failed pipeline.
   */
  async resumePipeline(draftId: string): Promise<void> {
    try {
      await this.workflowEngine.resumePipeline(draftId);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Cancels execution of the pipeline.
   */
  async cancelPipeline(draftId: string): Promise<void> {
    try {
      await this.workflowEngine.cancelPipeline(draftId);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Retries a specific failed or cancelled step.
   */
  async retryStep(draftId: string, stepId: string): Promise<void> {
    try {
      await this.workflowEngine.executeStep(draftId, stepId);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Publishes the fully completed lesson to the lesson repository.
   */
  async publishLesson(draftId: string): Promise<void> {
    try {
      const command: PublishLessonCommand = {
        commandId: this.idGenerator.generateId(),
        timestamp: this.clock.now(),
        type: "PublishLesson",
        draftId,
      };
      await this.commandDispatcher.dispatch(command);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Subscribes to real-time draft changes.
   * Returns an unsubscribe callback function.
   */
  watchDraft(draftId: string, callback: (draft: LessonDraft | null) => void): () => void {
    return this.draftRepository.watch(draftId, callback);
  }

  /**
   * Duplicates an existing draft, producing a new draft in DRAFT state with fresh ID and timestamps.
   */
  async duplicateDraft(draftId: string): Promise<LessonDraft> {
    try {
      const existing = await this.draftRepository.getById(draftId);
      if (!existing) {
        throw new BusinessError(`Draft with ID ${draftId} not found for duplication.`);
      }

      const newId = this.idGenerator.generateId();
      const now = this.clock.now();
      const clonedContext = JSON.parse(JSON.stringify(existing.context));

      const duplicatedDraft: LessonDraft = {
        ...existing,
        id: newId,
        pipelineState: PipelineState.DRAFT,
        currentStepId: null,
        steps: {},
        context: clonedContext,
        createdAt: now,
        updatedAt: now,
      };

      await this.draftRepository.create(duplicatedDraft);
      return duplicatedDraft;
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Archives a draft by setting the archived flag to true.
   */
  async archiveDraft(draftId: string): Promise<LessonDraft> {
    try {
      const existing = await this.draftRepository.getById(draftId);
      if (!existing) {
        throw new BusinessError(`Draft with ID ${draftId} not found for archiving.`);
      }

      existing.archived = true;
      existing.updatedAt = this.clock.now();
      await this.draftRepository.save(existing);
      return existing;
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * Maps an error to a BaseWorkflowError while preserving context and stack trace.
   */
  private mapError(error: any): Error {
    if (error instanceof BaseWorkflowError) {
      return error;
    }
    return new InfrastructureError(error.message || "An unexpected error occurred", error);
  }
}
