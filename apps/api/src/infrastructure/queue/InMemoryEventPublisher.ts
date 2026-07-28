import { EventPublisher } from "../../shared/ports/EventPublisher.js";

export class InMemoryEventPublisher implements EventPublisher {
  private readonly events: unknown[] = [];

  async publish(event: unknown): Promise<void> {
    this.events.push(event);
  }

  getPublishedEvents(): unknown[] {
    return [...this.events];
  }
}
