import { createConfigSchema, createInputSchema, createOutputSchema } from '@usersdotfun/core-sdk';
import { z } from 'zod';

// Feed configuration schema (matches the Feed type from "feed" package)
export const RssFeedConfigSchema = z.object({
  title: z.string(),
  description: z.string(),
  siteUrl: z.string().url(),
  image: z.string().url().optional(),
  favicon: z.string().url().optional(),
  author: z
    .object({
      name: z.string(),
      email: z.string().email().optional(),
      link: z.string().url().optional(),
    })
    .optional(),
  maxItems: z.number().optional(),
});

// Config schema with variables and secrets
export const RssConfigSchema = createConfigSchema(
  // Variables (non-sensitive config)
  z.object({
    serviceUrl: z.string().url(),
    feedId: z.string(),
    feedConfig: RssFeedConfigSchema, // Required, not optional
  }),
  // Secrets (sensitive config, hydrated at runtime)
  z.object({
    apiSecret: z.string().min(1, "API secret is required"),
  })
);

// Input schema for RSS items
export const RssInputSchema = createInputSchema(
  z.object({
    title: z.string().optional(),
    content: z.string().optional(),
    description: z.string().optional(),
    link: z.string().url().optional(),
    publishedAt: z.string().datetime().optional(),
    guid: z.string().optional(),
    author: z
      .union([
        z.object({
          name: z.string(),
          email: z.string().email().optional(),
          link: z.string().url().optional(),
        }),
        z.array(
          z.object({
            name: z.string(),
            email: z.string().email().optional(),
            link: z.string().url().optional(),
          }),
        ),
      ])
      .optional(),
    image: z
      .union([
        z.string(),
        z.object({
          url: z.string(),
          type: z.string().optional(),
          length: z.number().optional(),
        }),
      ])
      .optional(),
    audio: z
      .union([
        z.string(),
        z.object({
          url: z.string(),
          type: z.string().optional(),
          length: z.number().optional(),
        }),
      ])
      .optional(),
    video: z
      .union([
        z.string(),
        z.object({
          url: z.string(),
          type: z.string().optional(),
          length: z.number().optional(),
        }),
      ])
      .optional(),
    enclosure: z
      .object({
        url: z.string(),
        type: z.string().optional(),
        length: z.number().optional(),
      })
      .optional(),
    categories: z
      .union([
        z.array(z.string()),
        z.array(
          z.object({
            name: z.string(),
            domain: z.string().optional(),
          }),
        ),
      ])
      .optional(),
    copyright: z.string().optional(),
    source: z
      .object({
        url: z.string(),
        title: z.string(),
      })
      .optional(),
    isPermaLink: z.boolean().optional(),
  })
);

// Output schema
export const RssOutputSchema = createOutputSchema(
  z.object({
    itemId: z.string(),
    feedId: z.string(),
    message: z.string(),
  })
);

// Derived types
export type RssFeedConfig = z.infer<typeof RssFeedConfigSchema>;
export type RssConfig = z.infer<typeof RssConfigSchema>;
export type RssInput = z.infer<typeof RssInputSchema>;
export type RssOutput = z.infer<typeof RssOutputSchema>;
