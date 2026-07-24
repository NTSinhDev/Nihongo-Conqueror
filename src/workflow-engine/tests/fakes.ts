import { IDraftRepository, ILessonRepository, IAIService, ILogger, IClock, IIdGenerator } from "../application/ports";
import { IStepHandler, StepExecutionContext, StepResult } from "../application/step";
import { LessonDraft, PipelineContext, StepState } from "../domain/types";

export class FakeDraftRepository implements IDraftRepository {
  public drafts = new Map<string, LessonDraft>();

  async getById(id: string): Promise<LessonDraft | null> {
    const draft = this.drafts.get(id);
    return draft ? JSON.parse(JSON.stringify(draft)) : null; // return deep copy
  }

  async save(draft: LessonDraft): Promise<void> {
    this.drafts.set(draft.id, JSON.parse(JSON.stringify(draft)));
  }

  async create(draft: LessonDraft): Promise<void> {
    this.drafts.set(draft.id, JSON.parse(JSON.stringify(draft)));
  }

  async delete(id: string): Promise<void> {
    this.drafts.delete(id);
  }

  async list(): Promise<LessonDraft[]> {
    return Array.from(this.drafts.values()).map(d => JSON.parse(JSON.stringify(d)));
  }

  watch(id: string, callback: (draft: LessonDraft | null) => void): () => void {
    const draft = this.drafts.get(id);
    callback(draft ? JSON.parse(JSON.stringify(draft)) : null);
    return () => {};
  }
}

export class FakeLessonRepository implements ILessonRepository {
  public published = new Map<string, PipelineContext>();

  async publish(lessonId: number, level: string, context: PipelineContext): Promise<void> {
    const key = `${level}-L${lessonId}`;
    this.published.set(key, JSON.parse(JSON.stringify(context)));
  }

  async lessonExists(lessonId: number, level: string): Promise<boolean> {
    const key = `${level}-L${lessonId}`;
    return this.published.has(key);
  }
}

export class FakeAIService implements IAIService {
  public generateResult = "Fake AI response";
  public calls: { prompt: string; systemInstruction?: string }[] = [];

  async generate(
    prompt: string,
    systemInstruction?: string,
    responseSchema?: any,
    options?: { temperature?: number; model?: string }
  ): Promise<string> {
    this.calls.push({ prompt, systemInstruction });
    return this.generateResult;
  }
}

export class FakeLogger implements ILogger {
  public logs: { level: string; message: string; context?: any }[] = [];

  info(message: string, context?: any): void {
    this.logs.push({ level: "info", message, context });
  }
  warn(message: string, context?: any): void {
    this.logs.push({ level: "warn", message, context });
  }
  error(message: string, error?: any, context?: any): void {
    this.logs.push({ level: "error", message: `${message} : ${error}`, context });
  }
  debug(message: string, context?: any): void {
    this.logs.push({ level: "debug", message, context });
  }
}

export class FakeClock implements IClock {
  public currentTime = "2026-07-12T00:00:00Z";

  now(): string {
    return this.currentTime;
  }
}

export class FakeIdGenerator implements IIdGenerator {
  private counter = 0;

  generateId(): string {
    this.counter++;
    return `id-${this.counter}`;
  }
}

export class MockStepHandler implements IStepHandler {
  public callCount = 0;
  public executionDelay = 0;
  public onExecute?: (context: PipelineContext) => void;

  constructor(
    public readonly stepId: string,
    public readonly description: string,
    public readonly outcome: StepState.SUCCESS | StepState.FAILED | StepState.SKIPPED = StepState.SUCCESS,
    public readonly partialContextUpdate?: Partial<PipelineContext>,
    public readonly errorMessage?: string
  ) {}

  async execute(
    context: PipelineContext,
    execContext: StepExecutionContext
  ): Promise<StepResult> {
    this.callCount++;
    if (this.onExecute) {
      this.onExecute(context);
    }
    if (this.executionDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.executionDelay));
    }

    if (this.outcome === StepState.FAILED) {
      return {
        status: StepState.FAILED,
        errorMessage: this.errorMessage || "Mock step failed.",
      };
    }

    if (this.outcome === StepState.SKIPPED) {
      return {
        status: StepState.SKIPPED,
        errorMessage: this.errorMessage || "Mock step skipped.",
      };
    }

    return {
      status: StepState.SUCCESS,
      updatedContext: this.partialContextUpdate,
    };
  }
}
