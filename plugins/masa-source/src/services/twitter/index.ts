import { MasaClient } from '../../masa-client';
import { TwitterSearchService } from './service';
import { twitterServiceConfig } from './config';

export { twitterServiceConfig };

export { TwitterSearchService };

export const createTwitterService = (masaClient: MasaClient) => new TwitterSearchService(masaClient);
