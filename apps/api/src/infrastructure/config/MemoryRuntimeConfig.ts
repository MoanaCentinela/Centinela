import { ConfigurationProvider } from "../../shared/config/ConfigurationProvider.js";

const DEFAULT_THRESHOLD = 60;

export class MemoryRuntimeConfig implements ConfigurationProvider {
  private threshold: number;

  constructor(private readonly fallback: ConfigurationProvider) {
    const configuredValue = fallback.get("SCORE_THRESHOLD");
    this.threshold = typeof configuredValue === "number" && configuredValue > 0 ? configuredValue : DEFAULT_THRESHOLD;
  }

  get(name: string): string | number | undefined {
    if (name === "SCORE_THRESHOLD") {
      return this.threshold;
    }
    return this.fallback.get(name);
  }

  getThreshold(): number {
    return this.threshold;
  }

  setThreshold(value: number): void {
    this.threshold = value;
  }
}
