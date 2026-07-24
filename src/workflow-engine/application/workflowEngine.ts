import { IWorkflowEngine, IStepRegistry, ICommandDispatcher, IEventDispatcher, IPipelineRunner } from "./engine";
import { IIdGenerator, IClock } from "./ports";
import { 
  StartPipelineCommand, 
  PausePipelineCommand, 
  ResumePipelineCommand, 
  CancelPipelineCommand, 
  RetryStepCommand 
} from "./commands";

export class WorkflowEngine implements IWorkflowEngine {
  constructor(
    public readonly stepRegistry: IStepRegistry,
    public readonly commandDispatcher: ICommandDispatcher,
    public readonly eventDispatcher: IEventDispatcher,
    public readonly runner: IPipelineRunner,
    private readonly idGenerator: IIdGenerator,
    private readonly clock: IClock
  ) {}

  async executePipeline(draftId: string): Promise<void> {
    const command: StartPipelineCommand = {
      commandId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      type: "StartPipeline",
      draftId,
    };
    await this.commandDispatcher.dispatch(command);
  }

  async executeStep(draftId: string, stepId: string): Promise<void> {
    const command: RetryStepCommand = {
      commandId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      type: "RetryStep",
      draftId,
      stepId,
    };
    await this.commandDispatcher.dispatch(command);
  }

  async resumePipeline(draftId: string): Promise<void> {
    const command: ResumePipelineCommand = {
      commandId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      type: "ResumePipeline",
      draftId,
    };
    await this.commandDispatcher.dispatch(command);
  }

  async pausePipeline(draftId: string): Promise<void> {
    const command: PausePipelineCommand = {
      commandId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      type: "PausePipeline",
      draftId,
    };
    await this.commandDispatcher.dispatch(command);
  }

  async cancelPipeline(draftId: string): Promise<void> {
    const command: CancelPipelineCommand = {
      commandId: this.idGenerator.generateId(),
      timestamp: this.clock.now(),
      type: "CancelPipeline",
      draftId,
    };
    await this.commandDispatcher.dispatch(command);
  }
}
