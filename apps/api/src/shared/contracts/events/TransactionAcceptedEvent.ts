export interface TransactionAcceptedEvent {
  eventType: "TransactionAccepted";
  transactionId: string;
  accountId: string;
  occurredAt: string;
}
