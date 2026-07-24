import { describe, it, expect } from "vitest";
import { StepRegistry } from "../application/stepRegistry";
import { MockStepHandler } from "./fakes";

describe("StepRegistry", () => {
  it("should register and retrieve steps in correct order", () => {
    const registry = new StepRegistry();
    const step1 = new MockStepHandler("step-1", "First Step");
    const step2 = new MockStepHandler("step-2", "Second Step");

    registry.register(step1);
    registry.register(step2);

    expect(registry.getStep("step-1")).toBe(step1);
    expect(registry.getStep("step-2")).toBe(step2);
    expect(registry.getStep("non-existent")).toBeNull();

    expect(registry.getOrderedStepIds()).toEqual(["step-1", "step-2"]);
    expect(registry.getAll()).toEqual([step1, step2]);
  });

  it("should prevent duplicate registrations", () => {
    const registry = new StepRegistry();
    const step = new MockStepHandler("step-1", "Some step");

    registry.register(step);
    expect(() => registry.register(step)).toThrow("Step with ID step-1 is already registered.");
  });

  it("should support unregistering steps", () => {
    const registry = new StepRegistry();
    const step1 = new MockStepHandler("step-1", "Step 1");
    const step2 = new MockStepHandler("step-2", "Step 2");

    registry.register(step1);
    registry.register(step2);

    registry.unregister("step-1");

    expect(registry.getStep("step-1")).toBeNull();
    expect(registry.getOrderedStepIds()).toEqual(["step-2"]);
    expect(registry.getAll()).toEqual([step2]);
  });
});
