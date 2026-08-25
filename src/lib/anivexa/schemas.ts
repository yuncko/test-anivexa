import { z } from "zod";

const subtitleTrackSchema = z.object({
  url: z.string().url(),
  label: z.string(),
  srclang: z.string(),
  "default": z.boolean().optional().default(false),
});

export type SubtitleTrackSchema = z.infer<typeof subtitleTrackSchema>;

const rawSourceSchema = z.object({
  name: z.string(),
  url: z.string(),
  extractedUrl: z.string().nullable().optional(),
  extractedType: z.string().nullable().optional(),
  type: z.string(),
  priority: z.number(),
  headers: z.record(z.string(), z.string()).optional(),
  downloads: z.unknown().optional(),
});

const franchiseEntrySchema = z.object({
  relation: z.string(),
  anilistId: z.number(),
  title: z.string(),
  type: z.string(),
  format: z.string(),
});

const mappingSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.string(),
  format: z.string(),
  episodes: z.number(),
  malId: z.number().nullable().optional(),
  aniId: z.number().nullable().optional(),
  anidbId: z.number().nullable().optional(),
  kitsuId: z.number().nullable().optional(),
  themoviedbId: z.number().nullable().optional(),
  thetvdbId: z.number().nullable().optional(),
  imdbId: z.string().nullable().optional(),
  synonyms: z.array(z.string()).optional().default([]),
  franchise: z.array(franchiseEntrySchema).optional().default([]),
});

export const mappingResponseSchema = z.object({
  mappings: mappingSchema,
});

const episodeSchema = z.object({
  id: z.string().optional(),
  number: z.number(),
  title: z.string().nullable().optional(),
  duration: z.number().nullable().optional(),
  audio: z.string().optional().default("sub"),
  filler: z.boolean().optional().default(false),
  uncensored: z.boolean().optional().default(false),
  description: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
  airDate: z.string().nullable().optional(),
  sourceNumber: z.number().optional(),
});

export type EpisodeSchema = z.infer<typeof episodeSchema>;

const providerErrorSchema = z.object({
  error: z.string(),
  stack: z.string().optional(),
});

const providerEpisodesSchema = z.object({
  meta: z.record(z.string(), z.unknown()),
  episodes: z.record(z.string(), z.array(episodeSchema)),
});

export const episodesResponseSchema = z.object({
  page: z.number(),
  type: z.string(),
  mappings: mappingSchema,
}).passthrough();

export const watchResponseSchema = z.object({
  anilistId: z.number(),
  episode: z.number(),
  audio: z.string(),
  sources: z.array(rawSourceSchema),
  subtitles: z.array(subtitleTrackSchema).optional(),
  intro: z.unknown().optional(),
  outro: z.unknown().optional(),
});

export function isProviderError(
  value: unknown,
): value is { error: string; stack?: string } {
  return providerErrorSchema.safeParse(value).success;
}

export function isProviderEpisodes(
  value: unknown,
): value is { meta: Record<string, unknown>; episodes: Record<string, EpisodeSchema[]> } {
  return providerEpisodesSchema.safeParse(value).success;
}
