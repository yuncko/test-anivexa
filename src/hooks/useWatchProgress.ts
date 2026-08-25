"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWatchProgress,
  saveWatchProgress,
  isAutoplayEnabled,
  setAutoplay as setAutoplayStorage,
} from "@/lib/storage/watch-progress";
import type { WatchProgressEntry } from "@/types/player";

export function useWatchProgress(anilistId: string, episode: number) {
  const [progress, setProgress] = useState<WatchProgressEntry | null>(null);
  const [autoplay, setAutoplay] = useState(false);

  useEffect(() => {
    setProgress(getWatchProgress(anilistId));
    setAutoplay(isAutoplayEnabled());
  }, [anilistId]);

  const resumeTime = useCallback(() => {
    if (progress && progress.episode === episode && progress.position > 10) {
      return progress.position;
    }
    return 0;
  }, [progress, episode]);

  const save = useCallback(
    (position: number, duration: number) => {
      saveWatchProgress(anilistId, episode, position, duration);
      setProgress({ episode, position, duration, updatedAt: Date.now() });
    },
    [anilistId, episode],
  );

  const toggleAutoplay = useCallback(() => {
    setAutoplay((prev) => {
      const next = !prev;
      setAutoplayStorage(next);
      return next;
    });
  }, []);

  return { progress, resumeTime, save, autoplay, toggleAutoplay };
}
