import { IDomainEvent } from "../domain/events";
import { IEventDispatcher } from "./engine";

export class EventDispatcher implements IEventDispatcher {
  private handlers = new Map<string, Set<(event: any) => void>>();

  dispatch(event: IDomainEvent): void {
    const eventType = event.eventType;
    const typeHandlers = this.handlers.get(eventType);
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (err) {
          console.error(`Error in event handler for ${eventType}:`, err);
        }
      });
    }

    const wildcardHandlers = this.handlers.get("*");
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (err) {
          console.error(`Error in wildcard event handler:`, err);
        }
      });
    }
  }

  subscribe(eventType: string, handler: (event: any) => void): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    return () => {
      const typeHandlers = this.handlers.get(eventType);
      if (typeHandlers) {
        typeHandlers.delete(handler);
        if (typeHandlers.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }
}
