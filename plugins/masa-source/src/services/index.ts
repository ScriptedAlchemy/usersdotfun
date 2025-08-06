import { MasaClient } from '../masa-client';
import type { IPlatformSearchService, PlatformConfig } from '../types';
import { TwitterSearchService, twitterServiceConfig } from './twitter';

export interface ServiceRegistryEntry<TService extends IPlatformSearchService = IPlatformSearchService> {
  platformType: string;
  factory: (masaClient: MasaClient) => TService;
  config: PlatformConfig;
}

const twitterEntry: ServiceRegistryEntry<TwitterSearchService> = {
  platformType: "twitter",
  factory: (masaClient) => new TwitterSearchService(masaClient),
  config: twitterServiceConfig,
};

export const serviceRegistry = [
  twitterEntry,
  // Add other services here
] as const;

// Type-safe service map
export type ServiceMap = {
  'twitter': TwitterSearchService;
  // Add other mappings here
};

// Create a typed service manager
export class ServiceManager {
  private services = new Map<string, IPlatformSearchService>();
  private configs = new Map<string, PlatformConfig>();

  constructor(masaClient: MasaClient) {
    for (const entry of serviceRegistry) {
      const service = entry.factory(masaClient);
      this.services.set(entry.platformType, service);
      this.configs.set(entry.platformType, entry.config);
    }
  }

  getService<K extends keyof ServiceMap>(platformType: K): ServiceMap[K] | undefined;
  getService(platformType: string): IPlatformSearchService | undefined;
  getService(platformType: string): IPlatformSearchService | undefined {
    return this.services.get(platformType);
  }

  getConfig(platformType: string): PlatformConfig | undefined {
    return this.configs.get(platformType);
  }

  hasService(platformType: string): boolean {
    return this.services.has(platformType);
  }
}
