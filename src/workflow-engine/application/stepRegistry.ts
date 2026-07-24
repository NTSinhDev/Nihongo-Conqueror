import { IStepRegistry } from "./engine";
import { IStepHandler } from "./step";

export class StepRegistry implements IStepRegistry {
  private steps = new Map<string, IStepHandler>();
  private orderedStepIds: string[] = [];

  register(step: IStepHandler): void {
    if (this.steps.has(step.stepId)) {
      throw new Error(`Step with ID ${step.stepId} is already registered.`);
    }
    this.steps.set(step.stepId, step);
    this.orderedStepIds.push(step.stepId);
  }

  unregister(stepId: string): void {
    this.steps.delete(stepId);
    this.orderedStepIds = this.orderedStepIds.filter((id) => id !== stepId);
  }

  getStep(stepId: string): IStepHandler | null {
    return this.steps.get(stepId) || null;
  }

  getOrderedStepIds(): string[] {
    return [...this.orderedStepIds];
  }

  getAll(): IStepHandler[] {
    return this.orderedStepIds
      .map((id) => this.steps.get(id))
      .filter((step): step is IStepHandler => !!step);
  }
}
