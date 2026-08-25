export type PlayerState =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "buffering"
  | "switching-source"
  | "error"
  | "ended";

export interface PlayerQuality {
  level: number;
  height: number;
  width: number;
  bitrate: number;
  label: string;
}

export interface WatchProgressEntry {
  episode: number;
  position: number;
  duration: number;
  updatedAt: number;
}

export type WatchProgressMap = Record<string, WatchProgressEntry>;

export const AUTOPLAY_KEY = "anivexa-autoplay";
export const WATCH_PROGRESS_KEY = "anivexa-watch-progress";
