export interface CasePublisher {
  publish(message: unknown): Promise<void>;
}
