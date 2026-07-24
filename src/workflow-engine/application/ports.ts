import { LessonDraft, PipelineContext } from "../domain/types";

export interface IDraftRepository {
  getById(id: string): Promise<LessonDraft | null>;
  save(draft: LessonDraft): Promise<void>;
  create(draft: LessonDraft): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<LessonDraft[]>;
  watch(id: string, callback: (draft: LessonDraft | null) => void): () => void;
}

export interface ILessonRepository {
  publish(lessonId: number, level: string, context: PipelineContext): Promise<void>;
  lessonExists(lessonId: number, level: string): Promise<boolean>;
}

export interface IAIService {
  generate(
    userPrompt: string,
    systemPrompt?: string,
    responseSchema?: any,
    options?: { temperature?: number; model?: string }
  ): Promise<string>;
}

export interface ILogger {
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, error?: any, context?: any): void;
  debug(message: string, context?: any): void;
}

export interface IClock {
  now(): string;
}

export interface IIdGenerator {
  generateId(): string;
}
