export interface EventPublisher {
  publish(event: unknown): Promise<void>;
}
