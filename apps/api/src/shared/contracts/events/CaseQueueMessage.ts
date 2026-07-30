export interface CaseQueueMessage {
  messageType: "CaseCreated";
  transactionId: string;
  accountId: string;
  score: number;
  threshold: number;
  createdAt: string;
}
