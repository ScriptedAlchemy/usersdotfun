import { MasaClient } from '../masa-client';
import type { IPlatformSearchService, PlatformConfig } from '../types';
import { TwitterSearchService, twitterServiceConfig } from './twitter';

export interface ServiceRegistryEntry {
  platformType: string;
  factory: (masaClient: MasaClient) => IPlatformSearchService;
  config: PlatformConfig;
}

export const serviceRegistry: ServiceRegistryEntry[] = [
  {
    platformType: "twitter-scraper",
    factory: (masaClient) => new TwitterSearchService(masaClient),
    config: twitterServiceConfig,
  },
  // Add TikTok, Instagram, etc. here
];
