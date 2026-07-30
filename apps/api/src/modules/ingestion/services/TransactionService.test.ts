import { describe, expect, it } from "vitest";
import { TransactionService } from "./TransactionService.js";
import { TransactionValidator } from "../../validation/services/TransactionValidator.js";
import { MemoryTransactionRepository } from "../repositories/MemoryTransactionRepository.js";
import type { EventPublisher } from "../../../shared/ports/EventPublisher.js";
import type { RuleLogger } from "../../../shared/ports/RuleLogger.js";
import type { ConfigurationProvider } from "../../../shared/config/ConfigurationProvider.js";
import type { TransactionRequest } from "../../../shared/contracts/index.js";

class StubPublisher implements EventPublisher {
  public published: unknown[] = [];

  async publish(event: unknown): Promise<void> {
    this.published.push(event);
  }
}

class StubLogger implements RuleLogger {
  public logs: unknown[] = [];

  log(entry: unknown): void {
    this.logs.push(entry);
  }
}

class StubConfig implements ConfigurationProvider {
  get(name: string): string | number | undefined {
    if (name === "SCORE_THRESHOLD") {
      return 1000;
    }

    return undefined;
  }
}

describe("TransactionService", () => {
  it("persists the transaction, records rules and publishes an event", async () => {
    const publisher = new StubPublisher();
    const logger = new StubLogger();
    const config = new StubConfig();
    const service = new TransactionService({
      validator: new TransactionValidator(),
      repository: new MemoryTransactionRepository(),
      eventPublisher: publisher,
      ruleLogger: logger,
      configuration: config,
    });

    const transaction: TransactionRequest = {
      transactionId: "txn-001",
      accountId: "ACC-001",
      amount: 2500,
      currency: "USD",
      clientTimestamp: new Date().toISOString(),
      location: {
        latitude: 6.2442,
        longitude: -75.5812,
      },
      merchant: {
        id: "MERCH-001",
        category: "ELECTRONICS",
      },
    };

    const result = await service.processTransaction(transaction);

    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(false);
    expect(publisher.published).toHaveLength(1);
    expect(logger.logs).toHaveLength(1);
  });
});
