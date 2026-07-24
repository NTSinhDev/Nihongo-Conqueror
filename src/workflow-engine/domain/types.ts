export enum PipelineState {
  DRAFT = "draft",
  RUNNING = "running",
  PAUSED = "paused",
  FAILED = "failed",
  CANCELLED = "cancelled",
  COMPLETED = "completed"
}

export enum StepState {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  SKIPPED = "skipped",
  CANCELLED = "cancelled"
}

export interface VocabularyItem {
  id: string;
  kanji?: string;
  hiragana: string;
  romaji: string;
  meaningVi: string;
  meaningEn?: string;
  category?: string;
  examples?: VocabularyExample[];
}

export interface VocabularyExample {
  japanese: string;
  hiragana: string;
  meaningVi: string;
  meaningEn?: string;
}

export interface GrammarItem {
  id: string;
  pattern: string;
  meaningVi: string;
  meaningEn?: string;
  explanationVi: string;
  explanationEn?: string;
  examples: GrammarExample[];
}

export interface GrammarExample {
  japanese: string;
  hiragana: string;
  meaningVi: string;
  meaningEn?: string;
}

export interface LessonReview {
  summaryVi: string;
  summaryEn?: string;
  quickQuiz: {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }[];
}

export interface PipelineContext {
  metadata: {
    level: string; // N5, N4, N3, N2, N1
    lessonId: number; // Lesson index (e.g. 1 to 25)
    titleVi: string;
    titleEn?: string;
  };
  input: {
    vocabulary: VocabularyItem[];
    grammar: GrammarItem[];
  };
  validated: {
    vocabulary: VocabularyItem[];
    grammar: GrammarItem[];
  };
  tokenized: {
    vocabularyTokens: Record<string, string[]>; // mapping words to token info
  };
  generated: {
    vocabularyWithMeanings: VocabularyItem[];
    vocabularyWithExamples: VocabularyItem[];
    grammarWithMeanings: GrammarItem[];
    grammarWithExamples: GrammarItem[];
    review: LessonReview | null;
  };
}

export interface StepStatus {
  status: StepState;
  retryCount: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface LessonDraft {
  id: string;
  schemaVersion: number;
  aiModel: string;
  promptVersion: string;
  currentMessage?: string;
  pipelineState: PipelineState;
  currentStepId: string | null;
  steps: Record<string, StepStatus>; // map of stepId -> StepStatus
  context: PipelineContext;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}
