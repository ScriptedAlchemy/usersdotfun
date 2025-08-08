import {
  createConfigSchema,
  createInputSchema,
  createOutputSchema,
} from '@usersdotfun/core-sdk';
import { z } from 'zod';

// Supported Notion property types
const NotionPropertyTypeSchema = z.enum([
  'title',
  'rich_text',
  'date',
  'number',
  'checkbox',
  'multi_select',
  'select',
  'url',
  'email',
  'phone',
]);

export const NotionDistributorConfigSchema = createConfigSchema(
  z.object({
    token: z.string().min(1, 'Notion token is required'),
  }),
  z.object({
    databaseId: z.string().min(1, 'Database ID is required'),
    fields: z.record(z.string(), NotionPropertyTypeSchema).optional(),
  })
);

export const NotionDistributorInputSchema = createInputSchema(
  z.record(z.string(), z.unknown())
);

export const NotionDistributorOutputSchema = createOutputSchema(
  z.object({
    pageId: z.string(),
  })
);

// Inferred types
export type NotionDistributorConfig = z.infer<typeof NotionDistributorConfigSchema>;
export type NotionDistributorInput = z.infer<typeof NotionDistributorInputSchema>;
export type NotionDistributorOutput = z.infer<typeof NotionDistributorOutputSchema>;
export type NotionPropertyType = z.infer<typeof NotionPropertyTypeSchema>;
