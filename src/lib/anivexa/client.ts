import type { z } from "zod";
import type { AudioType, EpisodesResponse, MappingResponse, WatchResponse } from "@/types/anivexa";
import { mappingResponseSchema, episodesResponseSchema, watchResponseSchema } from "./schemas";
import { ProviderError } from "./errors";

const ANIVEXA_BASE_URL =
  process.env.NEXT_PUBLIC_ANIVEXA_URL ?? "https://anivexa-api.wasmer.app";

async function apiFetch<T>(url: string, schema: z.ZodType<T>, label: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  } catch {
    throw new ProviderError(
      `Failed to fetch ${label}`,
      "NETWORK_ERROR",
      label,
    );
  }

  if (!response.ok) {
    throw new ProviderError(
      `${label} returned ${response.status}`,
      response.status === 403
        ? "FORBIDDEN"
        : response.status === 404
          ? "NOT_FOUND"
          : "HTTP_ERROR",
      label,
      response.status,
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ProviderError(
      `Invalid JSON from ${label}`,
      "INVALID_RESPONSE",
      label,
    );
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[anivexa] schema validation failed for ${label}:`, result.error.message);
    }
    throw new ProviderError(
      `Invalid response shape from ${label}`,
      "INVALID_RESPONSE",
      label,
    );
  }

  return result.data;
}

export async function getMappings(anilistId: number): Promise<MappingResponse> {
  return apiFetch(
    `${ANIVEXA_BASE_URL}/map/${anilistId}`,
    mappingResponseSchema,
    `map/${anilistId}`,
  );
}

export async function getEpisodes(anilistId: number): Promise<EpisodesResponse> {
  return apiFetch(
    `${ANIVEXA_BASE_URL}/episodes/${anilistId}`,
    episodesResponseSchema,
    `episodes/${anilistId}`,
  );
}

export async function getWatchSources({
  provider,
  anilistId,
  audio,
  episode,
  episodeId,
}: {
  provider: string;
  anilistId: number;
  audio: AudioType;
  episode: number;
  /** Full watch path returned by the episodes API (e.g. "watch/mkissa/16498/sub/mkissa-1"). */
  episodeId?: string;
}): Promise<WatchResponse> {
  const path =
    episodeId ?? `watch/${provider}/${anilistId}/${audio}/${provider}-${episode}`;
  return apiFetch(
    `${ANIVEXA_BASE_URL}/${path}`,
    watchResponseSchema,
    `watch/${provider}/${anilistId}`,
  );
}
