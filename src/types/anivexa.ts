export type AudioType = "sub" | "dub" | "raw";

export interface FranchiseEntry {
  relation: string;
  anilistId: number;
  title: string;
  type: string;
  format: string;
}

export interface Mapping {
  id: number;
  title: string;
  type: string;
  format: string;
  episodes: number;
  malId?: number | null;
  aniId?: number | null;
  anidbId?: number | null;
  kitsuId?: number | null;
  themoviedbId?: number | null;
  thetvdbId?: number | null;
  imdbId?: string | null;
  synonyms: string[];
  franchise: FranchiseEntry[];
}

export interface MappingResponse {
  mappings: Mapping;
}

/** Fully normalized episode used across the UI. */
export interface Episode {
  id: string;
  number: number;
  title: string | null;
  duration: number | null;
  audio: AudioType;
  filler: boolean;
  uncensored: boolean;
  description: string | null;
  image: string | null;
  airDate: string | null;
}

export interface ProviderMeta {
  [key: string]: unknown;
}

export interface EpisodesResponse {
  page: number;
  type: string;
  mappings: Mapping;
  [provider: string]: unknown;
}

export interface RawWatchSource {
  name: string;
  url: string;
  extractedUrl?: string | null;
  extractedType?: string | null;
  type: string;
  priority: number;
  headers?: Record<string, string>;
  downloads?: unknown;
}

export interface SubtitleTrack {
  url: string;
  label: string;
  srclang: string;
  default?: boolean;
}

export interface WatchResponse {
  anilistId: number;
  episode: number;
  /** Wire audio value; narrow to AudioType at the call site. */
  audio: string;
  sources: RawWatchSource[];
  subtitles?: SubtitleTrack[];
  intro?: unknown;
  outro?: unknown;
  [key: string]: unknown;
}

export type StreamType = "hls" | "mp4" | "iframe" | "unknown";

export interface StreamSource {
  id: string;
  name: string;
  url: string;
  type: StreamType;
  priority: number;
  headers?: Record<string, string>;
  subtitles?: SubtitleTrack[];
  provider: string;
}
