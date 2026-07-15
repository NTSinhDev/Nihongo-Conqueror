import { describe, it, expect, vi } from "vitest";
import { EventDispatcher } from "../application/eventDispatcher";
import { IDomainEvent } from "../domain/events";

describe("EventDispatcher", () => {
  it("should dispatch events to specific subscribers", () => {
    const dispatcher = new EventDispatcher();
    const handler = vi.fn();

    dispatcher.subscribe("PipelineStarted", handler);

    const event: IDomainEvent = {
      eventId: "ev-1",
      timestamp: "2026-07-12T00:00:00Z",
      eventType: "PipelineStarted",
      aggregateId: "draft-1",
    };

    dispatcher.dispatch(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("should support unsubscribing from events", () => {
    const dispatcher = new EventDispatcher();
    const handler = vi.fn();

    const unsubscribe = dispatcher.subscribe("PipelineStarted", handler);
    unsubscribe();

    const event: IDomainEvent = {
      eventId: "ev-1",
      timestamp: "2026-07-12T00:00:00Z",
      eventType: "PipelineStarted",
      aggregateId: "draft-1",
    };

    dispatcher.dispatch(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should support wildcard subscriptions", () => {
    const dispatcher = new EventDispatcher();
    const handler = vi.fn();

    dispatcher.subscribe("*", handler);

    const event1: IDomainEvent = {
      eventId: "ev-1",
      timestamp: "2026-07-12T00:00:00Z",
      eventType: "PipelineStarted",
      aggregateId: "draft-1",
    };

    const event2: IDomainEvent = {
      eventId: "ev-2",
      timestamp: "2026-07-12T00:00:00Z",
      eventType: "StepStarted",
      aggregateId: "draft-1",
    };

    dispatcher.dispatch(event1);
    dispatcher.dispatch(event2);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, event1);
    expect(handler).toHaveBeenNthCalledWith(2, event2);
  });

  it("should isolate handlers so a failing handler does not block other handlers", () => {
    const dispatcher = new EventDispatcher();
    const failingHandler = vi.fn().mockImplementation(() => {
      throw new Error("Simulated failure in handler");
    });
    const succeedingHandler = vi.fn();

    dispatcher.subscribe("PipelineStarted", failingHandler);
    dispatcher.subscribe("PipelineStarted", succeedingHandler);

    const event: IDomainEvent = {
      eventId: "ev-1",
      timestamp: "2026-07-12T00:00:00Z",
      eventType: "PipelineStarted",
      aggregateId: "draft-1",
    };

    expect(() => dispatcher.dispatch(event)).not.toThrow();

    expect(failingHandler).toHaveBeenCalledTimes(1);
    expect(succeedingHandler).toHaveBeenCalledTimes(1);
  });
});
