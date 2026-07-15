import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkflowEngine } from "../application/workflowEngine";
import { StepRegistry } from "../application/stepRegistry";
import { EventDispatcher } from "../application/eventDispatcher";
import { PipelineRunner } from "../application/pipelineRunner";
import { CommandDispatcher } from "../application/commandDispatcher";
import { 
  FakeDraftRepository, 
  FakeLessonRepository, 
  FakeAIService, 
  FakeLogger, 
  FakeClock, 
  FakeIdGenerator, 
  MockStepHandler 
} from "./fakes";
import { LessonDraft, PipelineState, StepState } from "../domain/types";

describe("Workflow Engine Core E2E Flows", () => {
  let draftRepository: FakeDraftRepository;
  let lessonRepository: FakeLessonRepository;
  let aiService: FakeAIService;
  let logger: FakeLogger;
  let clock: FakeClock;
  let idGenerator: FakeIdGenerator;
  let stepRegistry: StepRegistry;
  let eventDispatcher: EventDispatcher;
  let pipelineRunner: PipelineRunner;
  let commandDispatcher: CommandDispatcher;
  let engine: WorkflowEngine;

  beforeEach(() => {
    draftRepository = new FakeDraftRepository();
    lessonRepository = new FakeLessonRepository();
    aiService = new FakeAIService();
    logger = new FakeLogger();
    clock = new FakeClock();
    idGenerator = new FakeIdGenerator();
    stepRegistry = new StepRegistry();
    eventDispatcher = new EventDispatcher();

    pipelineRunner = new PipelineRunner(
      draftRepository,
      stepRegistry,
      eventDispatcher,
      aiService,
      logger,
      clock,
      idGenerator
    );

    commandDispatcher = new CommandDispatcher(
      draftRepository,
      lessonRepository,
      pipelineRunner,
      eventDispatcher,
      logger,
      clock,
      idGenerator
    );

    engine = new WorkflowEngine(
      stepRegistry,
      commandDispatcher,
      eventDispatcher,
      pipelineRunner,
      idGenerator,
      clock
    );
  });

  function createTestDraft(id: string): LessonDraft {
    return {
      id,
      schemaVersion: 1,
      aiModel: "gemini-3.5-flash",
      promptVersion: "1.0",
      pipelineState: PipelineState.DRAFT,
      currentStepId: null,
      steps: {},
      context: {
        metadata: {
          level: "N3",
          lessonId: 10,
          titleVi: "Bài 10",
        },
        input: { vocabulary: [], grammar: [] },
        validated: { vocabulary: [], grammar: [] },
        tokenized: { vocabularyTokens: {} },
        generated: {
          vocabularyWithMeanings: [],
          vocabularyWithExamples: [],
          grammarWithMeanings: [],
          grammarWithExamples: [],
          review: null,
        }
      },
      createdById: "user-1",
      createdAt: clock.now(),
      updatedAt: clock.now(),
    };
  }

  it("should run a full multi-step pipeline successfully and set COMPLETED state", async () => {
    const draft = createTestDraft("draft-1");
    await draftRepository.create(draft);

    const step1 = new MockStepHandler(
      "step-1", 
      "Validate Input", 
      StepState.SUCCESS, 
      { validated: { vocabulary: [{ id: "1", hiragana: "あ", romaji: "a", meaningVi: "A" }], grammar: [] } }
    );
    const step2 = new MockStepHandler(
      "step-2", 
      "Generate Meanings", 
      StepState.SUCCESS, 
      { generated: { vocabularyWithMeanings: [{ id: "1", hiragana: "あ", romaji: "a", meaningVi: "A - Done" }], vocabularyWithExamples: [], grammarWithMeanings: [], grammarWithExamples: [], review: null } }
    );

    stepRegistry.register(step1);
    stepRegistry.register(step2);

    await pipelineRunner.run("draft-1");

    const updated = await draftRepository.getById("draft-1");
    expect(updated).not.toBeNull();
    expect(updated!.pipelineState).toBe(PipelineState.COMPLETED);
    expect(updated!.steps["step-1"].status).toBe(StepState.SUCCESS);
    expect(updated!.steps["step-2"].status).toBe(StepState.SUCCESS);
    expect(updated!.context.validated.vocabulary.length).toBe(1);
    expect(updated!.context.generated.vocabularyWithMeanings.length).toBe(1);
  });

  it("should skip already completed steps when resuming", async () => {
    const draft = createTestDraft("draft-2");
    draft.steps["step-1"] = {
      status: StepState.SUCCESS,
      retryCount: 0,
      completedAt: clock.now(),
    };
    await draftRepository.create(draft);

    const step1 = new MockStepHandler("step-1", "Step 1");
    const step2 = new MockStepHandler("step-2", "Step 2");

    stepRegistry.register(step1);
    stepRegistry.register(step2);

    await pipelineRunner.run("draft-2");

    expect(step1.callCount).toBe(0);
    expect(step2.callCount).toBe(1);

    const updated = await draftRepository.getById("draft-2");
    expect(updated!.pipelineState).toBe(PipelineState.COMPLETED);
    expect(updated!.steps["step-2"].status).toBe(StepState.SUCCESS);
  });

  it("should fail the pipeline if a step fails", async () => {
    const draft = createTestDraft("draft-3");
    await draftRepository.create(draft);

    const step1 = new MockStepHandler("step-1", "Step 1");
    const step2 = new MockStepHandler("step-2", "Step 2 failing", StepState.FAILED, undefined, "AI rate limit exceeded");

    stepRegistry.register(step1);
    stepRegistry.register(step2);

    await pipelineRunner.run("draft-3");

    const updated = await draftRepository.getById("draft-3");
    expect(updated!.pipelineState).toBe(PipelineState.FAILED);
    expect(updated!.steps["step-1"].status).toBe(StepState.SUCCESS);
    expect(updated!.steps["step-2"].status).toBe(StepState.FAILED);
    expect(updated!.steps["step-2"].errorMessage).toBe("AI rate limit exceeded");
  });

  it("should pause the pipeline at step boundaries if PAUSED state is requested", async () => {
    const draft = createTestDraft("draft-4");
    await draftRepository.create(draft);

    const step1 = new MockStepHandler("step-1", "Step 1");
    const step2 = new MockStepHandler("step-2", "Step 2");

    stepRegistry.register(step1);
    stepRegistry.register(step2);

    step1.onExecute = async () => {
      const freshDraft = await draftRepository.getById("draft-4");
      freshDraft!.pipelineState = PipelineState.PAUSED;
      await draftRepository.save(freshDraft!);
    };

    await pipelineRunner.run("draft-4");

    const updated = await draftRepository.getById("draft-4");
    expect(updated!.pipelineState).toBe(PipelineState.PAUSED);
    expect(updated!.steps["step-1"].status).toBe(StepState.SUCCESS);
    expect(updated!.steps["step-2"]).toBeUndefined();
    expect(step2.callCount).toBe(0);
  });

  it("should support retrying a failed step via retry command", async () => {
    const draft = createTestDraft("draft-5");
    draft.pipelineState = PipelineState.FAILED;
    draft.steps["step-1"] = {
      status: StepState.FAILED,
      retryCount: 0,
      errorMessage: "Original error",
    };
    await draftRepository.create(draft);

    const step1 = new MockStepHandler("step-1", "Step 1");
    stepRegistry.register(step1);

    const runnerSpy = vi.spyOn(pipelineRunner, "run").mockImplementation(async () => {});

    await commandDispatcher.dispatch({
      commandId: "cmd-retry",
      timestamp: clock.now(),
      type: "RetryStep",
      draftId: "draft-5",
      stepId: "step-1",
    } as any);

    const updated = await draftRepository.getById("draft-5");
    expect(updated!.steps["step-1"].status).toBe(StepState.PENDING);
    expect(updated!.steps["step-1"].retryCount).toBe(1);
    expect(updated!.pipelineState).toBe(PipelineState.RUNNING);
    expect(runnerSpy).toHaveBeenCalledWith("draft-5");
  });

  it("should support resetting the pipeline", async () => {
    const draft = createTestDraft("draft-6");
    draft.pipelineState = PipelineState.COMPLETED;
    draft.steps["step-1"] = { status: StepState.SUCCESS, retryCount: 0 };
    draft.context.validated.vocabulary = [{ id: "1", hiragana: "あ", romaji: "a", meaningVi: "A" }];
    await draftRepository.create(draft);

    await commandDispatcher.dispatch({
      commandId: "cmd-reset",
      timestamp: clock.now(),
      type: "ResetPipeline",
      draftId: "draft-6",
    } as any);

    const updated = await draftRepository.getById("draft-6");
    expect(updated!.pipelineState).toBe(PipelineState.DRAFT);
    expect(updated!.steps).toEqual({});
    expect(updated!.context.validated.vocabulary).toEqual([]);
  });

  it("should publish a completed lesson successfully", async () => {
    const draft = createTestDraft("draft-7");
    draft.pipelineState = PipelineState.COMPLETED;
    await draftRepository.create(draft);

    const publishEventSpy = vi.fn();
    eventDispatcher.subscribe("LessonPublished", publishEventSpy);

    await commandDispatcher.dispatch({
      commandId: "cmd-publish",
      timestamp: clock.now(),
      type: "PublishLesson",
      draftId: "draft-7",
    } as any);

    const isPublished = await lessonRepository.lessonExists(10, "N3");
    expect(isPublished).toBe(true);
    expect(publishEventSpy).toHaveBeenCalledTimes(1);
  });
});
