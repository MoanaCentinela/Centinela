import { EventPublisher } from "../../shared/ports/EventPublisher.js";

type EventHandler = (event: any) => Promise<void> | void;

export class InMemoryEventPublisher implements EventPublisher {
  private readonly events: unknown[] = [];
  private readonly subscribers: Map<string, EventHandler[]> = new Map();

  subscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.subscribers.get(eventType) ?? [];
    handlers.push(handler);
    this.subscribers.set(eventType, handlers);
  }

  async publish(event: any): Promise<void> {
    this.events.push(event);

    const eventType = event?.eventType;
    if (eventType && this.subscribers.has(eventType)) {
      const handlers = this.subscribers.get(eventType)!;
      for (const handler of handlers) {
        await handler(event);
      }
    }
  }

  getPublishedEvents(): unknown[] {
    return [...this.events];
  }
}
