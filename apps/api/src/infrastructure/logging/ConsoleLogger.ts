import { AppLogger } from "./AppLogger.js";
import { RuleLogger } from "../../shared/ports/RuleLogger.js";

export class ConsoleLogger implements AppLogger, RuleLogger {
  info(message: string, meta?: Record<string, unknown>): void {
    console.info(message, meta ?? {});
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(message, meta ?? {});
  }

  log(entry: unknown): void {
    console.info("Rule evaluation", entry);
  }
}
