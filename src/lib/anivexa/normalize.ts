import type {
  AudioType,
  Episode,
  EpisodesResponse,
  ProviderMeta,
  RawWatchSource,
  StreamSource,
  StreamType,
  SubtitleTrack,
} from "@/types/anivexa";
import { isProviderError, isProviderEpisodes } from "./schemas";

const KNOWN_PROVIDERS = [
  "mkissa",
  "reanime",
  "anikoto",
  "animegg",
  "anineko",
  "anizone",
  "2dhive",
  "anibd",
  "kickassanime",
  "kaa",
  "animedunya",
  "senshi",
];

export interface ParsedProvider {
  name: string;
  meta: ProviderMeta;
  sub: Episode[];
  dub: Episode[];
  raw: Episode[];
}

export interface ParsedEpisodes {
  providers: ParsedProvider[];
  /** Provider keys that returned an error object (e.g. 403, match not found). */
  failedProviders: { provider: string; reason: string }[];
}

export function parseProviders(response: EpisodesResponse): ParsedEpisodes {
  const providers: ParsedProvider[] = [];
  const failedProviders: { provider: string; reason: string }[] = [];

  for (const key of Object.keys(response)) {
    if (key === "page" || key === "type" || key === "mappings") continue;
    if (!KNOWN_PROVIDERS.includes(key)) continue;

    const value: unknown = response[key];

    if (isProviderError(value)) {
      failedProviders.push({ provider: key, reason: value.error });
      continue;
    }

    if (!isProviderEpisodes(value)) {
      failedProviders.push({ provider: key, reason: "Unexpected response shape" });
      continue;
    }

    const epMap = value.episodes;
    providers.push({
      name: key,
      meta: value.meta as ProviderMeta,
      sub: (epMap.sub ?? []).map((e) => normalizeEpisode(e, key, "sub")),
      dub: (epMap.dub ?? []).map((e) => normalizeEpisode(e, key, "dub")),
      raw: (epMap.raw ?? []).map((e) => normalizeEpisode(e, key, "raw")),
    });
  }

  return { providers, failedProviders };
}

function normalizeEpisode(
  raw: Record<string, unknown>,
  provider: string,
  audio: AudioType,
): Episode {
  const number = typeof raw.number === "number" ? raw.number : 0;
  const id =
    typeof raw.id === "string" && raw.id
      ? raw.id
      : `watch/${provider}/${audio}/${provider}-${number}`;

  return {
    id,
    number,
    title: typeof raw.title === "string" ? raw.title : null,
    duration: typeof raw.duration === "number" ? raw.duration : null,
    audio,
    filler: raw.filler === true,
    uncensored: raw.uncensored === true,
    description: typeof raw.description === "string" ? raw.description : null,
    image: typeof raw.image === "string" ? raw.image : null,
    airDate: typeof raw.airDate === "string" ? raw.airDate : null,
  };
}

export function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url);
}

export function isMp4Url(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

export function classifyStreamType(
  extractedType: string | null | undefined,
  url: string,
): StreamType {
  if (extractedType === "hls" || isHlsUrl(url)) return "hls";
  if (extractedType === "direct") return "mp4";
  if (isMp4Url(url)) return "mp4";
  return "unknown";
}

/**
 * Normalize raw API sources into StreamSource[]:
 * 1. Prefer extractedUrl, fall back to url.
 * 2. Classify via extractedType + URL heuristics.
 * 3. Keep iframe-only sources (type "iframe") for explicit user selection.
 * 4. Drop unusable ones, sort by priority descending.
 */
export function normalizeSources(
  rawSources: RawWatchSource[],
  provider: string,
  subtitles?: SubtitleTrack[],
): StreamSource[] {
  const sources: StreamSource[] = [];

  for (const raw of rawSources) {
    const extracted = raw.extractedUrl;
    const type = classifyStreamType(raw.extractedType, extracted ?? raw.url);

    if (type === "hls" || type === "mp4") {
      if (!extracted) continue;
      sources.push({
        id: `${provider}-${raw.name}`,
        name: raw.name,
        url: extracted,
        type,
        priority: raw.priority,
        headers: raw.headers,
        subtitles: subtitles && subtitles.length > 0 ? subtitles : undefined,
        provider,
      });
      continue;
    }

    if (raw.type === "iframe" && raw.url) {
      sources.push({
        id: `${provider}-${raw.name}`,
        name: raw.name,
        url: raw.url,
        type: "iframe",
        priority: raw.priority,
        headers: raw.headers,
        provider,
      });
    }
  }

  return sources.sort((a, b) => b.priority - a.priority);
}
