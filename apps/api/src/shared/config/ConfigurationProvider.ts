export interface ConfigurationProvider {
  get(name: string): string | number | undefined;
}
