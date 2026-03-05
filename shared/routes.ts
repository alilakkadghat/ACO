import { z } from 'zod';
import { insertSimulationPresetSchema, simulation_presets } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  presets: {
    list: {
      method: 'GET' as const,
      path: '/api/presets',
      responses: {
        200: z.array(z.custom<typeof simulation_presets.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/presets',
      input: insertSimulationPresetSchema,
      responses: {
        201: z.custom<typeof simulation_presets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/presets/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
