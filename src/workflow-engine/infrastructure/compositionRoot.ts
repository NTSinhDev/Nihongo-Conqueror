import { WorkflowEngine } from "../application/workflowEngine";
import { StepRegistry } from "../application/stepRegistry";
import { CommandDispatcher } from "../application/commandDispatcher";
import { EventDispatcher } from "../application/eventDispatcher";
import { PipelineRunner } from "../application/pipelineRunner";
import { LessonBuilderService } from "../application/lessonBuilderService";

// Infrastructure Adapters
import { FirestoreDraftRepository, FirestoreLessonRepository } from "./firestoreAdapter";
import { GeminiAIService } from "./geminiAdapter";
import { ConsoleLogger, SystemClock, UuidGenerator } from "./utilityAdapters";

// Step Handlers
import { ValidateVocabularyStep } from "../application/steps/validateVocabularyStep";
import { ValidateGrammarStep } from "../application/steps/validateGrammarStep";
import { TokenizeStep } from "../application/steps/tokenizeStep";
import { GenerateEnglishStep } from "../application/steps/generateEnglishStep";
import { GenerateVocabularyExamplesStep } from "../application/steps/generateVocabularyExamplesStep";
import { GenerateGrammarExamplesStep } from "../application/steps/generateGrammarExamplesStep";
import { GenerateReviewStep } from "../application/steps/generateReviewStep";
import { SaveLessonStep } from "../application/steps/saveLessonStep";

/**
 * Composition Root for the Lesson Plan Workflow Engine.
 * Wires together all infrastructure adapters, utilities, core orchestrators, and registers the step handlers.
 * All dependencies are cleanly injected to maintain SOLID compliance, modularity, and testability.
 */
export function createWorkflowEngine(options?: {
  apiKey?: string;
  defaultModel?: string;
  defaultTemperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
}): WorkflowEngine {
  // 1. Instantiate Utilities and Logging
  const logger = new ConsoleLogger();
  const clock = new SystemClock();
  const idGenerator = new UuidGenerator();

  // 2. Instantiate Persistence Repositories
  const draftRepository = new FirestoreDraftRepository();
  const lessonRepository = new FirestoreLessonRepository();

  // 3. Instantiate AI Service
  const aiService = new GeminiAIService({
    apiKey: options?.apiKey,
    defaultModel: options?.defaultModel,
    defaultTemperature: options?.defaultTemperature,
    timeoutMs: options?.timeoutMs,
    maxRetries: options?.maxRetries,
  });

  // 4. Instantiate Step Registry and register all 8 step handlers in execution sequence
  const stepRegistry = new StepRegistry();
  stepRegistry.register(new ValidateVocabularyStep());
  stepRegistry.register(new ValidateGrammarStep());
  stepRegistry.register(new TokenizeStep());
  stepRegistry.register(new GenerateEnglishStep());
  stepRegistry.register(new GenerateVocabularyExamplesStep());
  stepRegistry.register(new GenerateGrammarExamplesStep());
  stepRegistry.register(new GenerateReviewStep());
  stepRegistry.register(new SaveLessonStep());

  // 5. Instantiate Core Dispatchers
  const eventDispatcher = new EventDispatcher();

  // 6. Instantiate Pipeline Runner
  const pipelineRunner = new PipelineRunner(
    draftRepository,
    stepRegistry,
    eventDispatcher,
    aiService,
    logger,
    clock,
    idGenerator
  );

  // 7. Instantiate Command Dispatcher
  const commandDispatcher = new CommandDispatcher(
    draftRepository,
    lessonRepository,
    pipelineRunner,
    eventDispatcher,
    logger,
    clock,
    idGenerator
  );

  // 8. Instantiate and return the WorkflowEngine
  return new WorkflowEngine(
    stepRegistry,
    commandDispatcher,
    eventDispatcher,
    pipelineRunner,
    idGenerator,
    clock
  );
}

/**
 * Creates and returns a fully wired LessonBuilderService, along with its underlying WorkflowEngine.
 * Dependencies are explicitly instantiated and injected to maintain DI best practices.
 */
export function createLessonBuilderService(options?: {
  apiKey?: string;
  defaultModel?: string;
  defaultTemperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
}): LessonBuilderService {
  // 1. Instantiate Utilities and Logging
  const logger = new ConsoleLogger();
  const clock = new SystemClock();
  const idGenerator = new UuidGenerator();

  // 2. Instantiate Persistence Repositories
  const draftRepository = new FirestoreDraftRepository();
  const lessonRepository = new FirestoreLessonRepository();

  // 3. Instantiate AI Service
  const aiService = new GeminiAIService({
    apiKey: options?.apiKey,
    defaultModel: options?.defaultModel,
    defaultTemperature: options?.defaultTemperature,
    timeoutMs: options?.timeoutMs,
    maxRetries: options?.maxRetries,
  });

  // 4. Instantiate Step Registry and register all 8 step handlers in execution sequence
  const stepRegistry = new StepRegistry();
  stepRegistry.register(new ValidateVocabularyStep());
  stepRegistry.register(new ValidateGrammarStep());
  stepRegistry.register(new TokenizeStep());
  stepRegistry.register(new GenerateEnglishStep());
  stepRegistry.register(new GenerateVocabularyExamplesStep());
  stepRegistry.register(new GenerateGrammarExamplesStep());
  stepRegistry.register(new GenerateReviewStep());
  stepRegistry.register(new SaveLessonStep());

  // 5. Instantiate Core Dispatchers
  const eventDispatcher = new EventDispatcher();

  // 6. Instantiate Pipeline Runner
  const pipelineRunner = new PipelineRunner(
    draftRepository,
    stepRegistry,
    eventDispatcher,
    aiService,
    logger,
    clock,
    idGenerator
  );

  // 7. Instantiate Command Dispatcher
  const commandDispatcher = new CommandDispatcher(
    draftRepository,
    lessonRepository,
    pipelineRunner,
    eventDispatcher,
    logger,
    clock,
    idGenerator
  );

  // 8. Instantiate WorkflowEngine
  const workflowEngine = new WorkflowEngine(
    stepRegistry,
    commandDispatcher,
    eventDispatcher,
    pipelineRunner,
    idGenerator,
    clock
  );

  // 9. Instantiate and return LessonBuilderService
  return new LessonBuilderService(
    workflowEngine,
    draftRepository,
    commandDispatcher,
    idGenerator,
    clock
  );
}
