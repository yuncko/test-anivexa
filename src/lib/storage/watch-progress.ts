import { WATCH_PROGRESS_KEY } from "@/types/player";
import type { WatchProgressEntry, WatchProgressMap } from "@/types/player";

function load(): WatchProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(WATCH_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as WatchProgressMap) : {};
  } catch {
    return {};
  }
}

function save(map: WatchProgressMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(map));
  } catch {
    // storage full – ignore
  }
}

export function getWatchProgress(anilistId: string): WatchProgressEntry | null {
  return load()[anilistId] ?? null;
}

export function saveWatchProgress(
  anilistId: string,
  episode: number,
  position: number,
  duration: number,
): void {
  const map = load();
  map[anilistId] = {
    episode,
    position: Math.floor(position),
    duration: Math.floor(duration),
    updatedAt: Date.now(),
  };
  save(map);
}

export function isAutoplayEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("anivexa-autoplay") === "true";
  } catch {
    return false;
  }
}

export function setAutoplay(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("anivexa-autoplay", String(enabled));
  } catch {
    // ignore
  }
}
