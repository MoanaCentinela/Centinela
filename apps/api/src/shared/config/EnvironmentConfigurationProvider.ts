import { ConfigurationProvider } from "./ConfigurationProvider.js";

export class EnvironmentConfigurationProvider implements ConfigurationProvider {
  get(name: string): string | number | undefined {
    const value = process.env[name];

    if (value === undefined) {
      return undefined;
    }

    if (/^\d+$/.test(value)) {
      return Number(value);
    }

    return value;
  }
}
