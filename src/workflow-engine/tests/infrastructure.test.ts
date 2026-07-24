import { vi, describe, it, expect, beforeEach } from "vitest";
import { ConsoleLogger, SystemClock, UuidGenerator } from "../infrastructure/utilityAdapters";
import { GeminiAIService } from "../infrastructure/geminiAdapter";
import { FirestoreDraftRepository, FirestoreLessonRepository } from "../infrastructure/firestoreAdapter";
import { BusinessError, AIError, InfrastructureError } from "../domain/errors";
import { LessonDraft, PipelineState, StepState, PipelineContext } from "../domain/types";

// --- Mocks ---

// Declare hoisted mock functions to avoid ReferenceError on hoisting
const { 
  mockGetDoc, 
  mockSetDoc, 
  mockDeleteDoc, 
  mockRunTransaction, 
  mockOnSnapshot,
  mockGenerateContent 
} = vi.hoisted(() => ({
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockRunTransaction: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockGenerateContent: vi.fn(),
}));

// Mock Firebase App and Firestore SDK
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({ currentUser: { uid: "mock-user-123" } })),
  signInAnonymously: vi.fn(() => Promise.resolve({ user: { uid: "mock-user-123" } })),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db: any, col: string, id: string) => ({ path: `${col}/${id}`, id })),
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  runTransaction: mockRunTransaction,
  onSnapshot: mockOnSnapshot,
}));

// Mock GoogleGenAI SDK
vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

// Mock environment variables
process.env.GEMINI_API_KEY = "test-api-key-12345";

// --- Tests ---

describe("Utility Adapters", () => {
  describe("ConsoleLogger", () => {
    it("should route logging messages to console", () => {
      const logger = new ConsoleLogger();
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      logger.info("info msg", { foo: "bar" });
      logger.warn("warn msg");
      logger.error("error msg", new Error("test err"));
      logger.debug("debug msg");

      expect(logSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      expect(debugSpy).toHaveBeenCalled();

      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
      debugSpy.mockRestore();
    });
  });

  describe("SystemClock", () => {
    it("should return a valid ISO string", () => {
      const clock = new SystemClock();
      const timeStr = clock.now();
      expect(timeStr).toBeDefined();
      expect(isNaN(Date.parse(timeStr))).toBe(false);
    });
  });

  describe("UuidGenerator", () => {
    it("should generate a random non-empty ID string", () => {
      const generator = new UuidGenerator();
      const id1 = generator.generateId();
      const id2 = generator.generateId();
      expect(id1).toBeDefined();
      expect(id1.length).toBeGreaterThan(5);
      expect(id1).not.toEqual(id2);
    });
  });
});

describe("GeminiAIService Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize and successfully generate text content on a successful call", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: "Successful response text",
    });

    const aiService = new GeminiAIService({ maxRetries: 1 });
    const result = await aiService.generate("Say hello", "You are a friendly bot");

    expect(result).toBe("Successful response text");
    expect(mockGenerateContent).toHaveBeenCalledWith({
      model: "gemini-3.5-flash",
      contents: "Say hello",
      config: {
        systemInstruction: "You are a friendly bot",
        temperature: 1.0,
        responseMimeType: undefined,
        responseSchema: undefined,
      },
    });
  });

  it("should retry on transient quota errors and eventually succeed", async () => {
    // Attempt 1: Fail with transient 429 Resource Exhausted
    mockGenerateContent.mockRejectedValueOnce(new Error("429 Resource Exhausted: Quota exceeded"));
    // Attempt 2: Succeed
    mockGenerateContent.mockResolvedValueOnce({
      text: "Success after retry",
    });

    const aiService = new GeminiAIService({ maxRetries: 3 });
    const result = await aiService.generate("Retry please");

    expect(result).toBe("Success after retry");
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it("should fail immediately without retrying on non-retryable errors", async () => {
    // Fail with 400 Bad Request (not retryable)
    mockGenerateContent.mockRejectedValueOnce(new Error("400 Bad Request: Invalid arguments"));

    const aiService = new GeminiAIService({ maxRetries: 3 });
    await expect(aiService.generate("Invalid prompt")).rejects.toThrow(AIError);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it("should fail on a timeout", async () => {
    // Mock generateContent to resolve after 100ms
    mockGenerateContent.mockImplementation(() => {
      return new Promise((resolve) => setTimeout(() => resolve({ text: "Late text" }), 100));
    });

    // Configure a short timeout of 10ms
    const aiService = new GeminiAIService({ timeoutMs: 10, maxRetries: 1 });
    await expect(aiService.generate("Timeout test")).rejects.toThrow(AIError);
  });
});

describe("FirestoreDraftRepository Adapter", () => {
  const mockDraftId = "draft-xyz";
  const mockDraft: LessonDraft = {
    id: mockDraftId,
    schemaVersion: 1,
    aiModel: "gemini-3.5-flash",
    promptVersion: "1.0",
    pipelineState: PipelineState.DRAFT,
    currentStepId: null,
    steps: {},
    context: {
      metadata: { level: "N5", lessonId: 1, titleVi: "Chào hỏi" },
      input: { vocabulary: [], grammar: [] },
      validated: { vocabulary: [], grammar: [] },
      tokenized: { vocabularyTokens: {} },
      generated: {
        vocabularyWithMeanings: [],
        vocabularyWithExamples: [],
        grammarWithMeanings: [],
        grammarWithExamples: [],
        review: null,
      },
    },
    createdById: "user-1",
    createdAt: "2026-07-12T00:00:00Z",
    updatedAt: "2026-07-12T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a draft document in Firestore", async () => {
    const repository = new FirestoreDraftRepository();
    await repository.create(mockDraft);

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: "lesson_drafts/draft-xyz" }),
      mockDraft
    );
  });

  it("should fetch a draft by ID and track its updatedAt timestamp", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockDraft,
    });

    const repository = new FirestoreDraftRepository();
    const draft = await repository.getById(mockDraftId);

    expect(draft).toEqual(mockDraft);
    expect(mockGetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: "lesson_drafts/draft-xyz" })
    );
  });

  it("should execute standard save successfully if the optimistic timestamp matches", async () => {
    // 1. Fetch document (tracks current updatedAt in repository)
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockDraft,
    });

    const repository = new FirestoreDraftRepository();
    await repository.getById(mockDraftId);

    // 2. Mock a successful transaction execution where database updatedAt matches
    mockRunTransaction.mockImplementationOnce(async (_db, updateFn) => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockDraft, // returns matching updatedAt
        }),
        set: vi.fn(),
      };
      await updateFn(mockTransaction);
    });

    const draftToSave = { ...mockDraft, updatedAt: "2026-07-12T01:00:00Z" };
    await repository.save(draftToSave);

    expect(mockRunTransaction).toHaveBeenCalled();
  });

  it("should throw a BusinessError during save if database has been updated by another transaction", async () => {
    // 1. Fetch document (tracks older timestamp "2026-07-12T00:00:00Z")
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => mockDraft,
    });

    const repository = new FirestoreDraftRepository();
    await repository.getById(mockDraftId);

    // 2. Mock transaction where database already contains a newer updatedAt timestamp
    mockRunTransaction.mockImplementationOnce(async (_db, updateFn) => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({
            ...mockDraft,
            updatedAt: "2026-07-12T00:05:00Z", // Modified by another client
          }),
        }),
        set: vi.fn(),
      };
      await updateFn(mockTransaction);
    });

    const draftToSave = { ...mockDraft, updatedAt: "2026-07-12T01:00:00Z" };
    
    await expect(repository.save(draftToSave)).rejects.toThrow(BusinessError);
  });

  it("should register snapshot watcher and unsubscribe correctly", () => {
    const unsubscribeMock = vi.fn();
    mockOnSnapshot.mockReturnValueOnce(unsubscribeMock);

    const repository = new FirestoreDraftRepository();
    const callback = vi.fn();
    const unsubscribe = repository.watchDraft(mockDraftId, callback);

    expect(mockOnSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ path: "lesson_drafts/draft-xyz" }),
      expect.any(Function),
      expect.any(Function)
    );

    unsubscribe();
    expect(unsubscribeMock).toHaveBeenCalled();
  });
});

describe("FirestoreLessonRepository Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should compile a published lesson and save to static lessons path", async () => {
    const repository = new FirestoreLessonRepository();
    const mockContext: PipelineContext = {
      metadata: { level: "N4", lessonId: 12, titleVi: "Bài Học N4" },
      input: { vocabulary: [], grammar: [] },
      validated: { vocabulary: [], grammar: [] },
      tokenized: { vocabularyTokens: {} },
      generated: {
        vocabularyWithMeanings: [],
        vocabularyWithExamples: [],
        grammarWithMeanings: [],
        grammarWithExamples: [],
        review: null,
      },
    };

    await repository.publish(12, "N4", mockContext);

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: "japanese_lessons/N4-L12" }),
      expect.objectContaining({
        id: 12,
        title: "Bài Học N4",
        level: "N4",
        category: "N4",
      })
    );
  });

  it("should check if a static lesson already exists", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
    });

    const repository = new FirestoreLessonRepository();
    const exists = await repository.lessonExists(5, "N5");

    expect(exists).toBe(true);
    expect(mockGetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: "japanese_lessons/N5-L5" })
    );
  });
});
