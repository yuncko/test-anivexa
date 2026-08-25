"use client";

import { useQuery } from "@tanstack/react-query";
import { getWatchSources } from "@/lib/anivexa/client";
import { normalizeSources } from "@/lib/anivexa/normalize";
import type { StreamSource, AudioType } from "@/types/anivexa";

export function useWatchSources({
  provider,
  anilistId,
  audio,
  episode,
  episodeId,
  enabled = true,
}: {
  provider: string;
  anilistId: number;
  audio: AudioType;
  episode: number;
  episodeId?: string;
  enabled?: boolean;
}) {
  return useQuery<StreamSource[]>({
    queryKey: ["watch", anilistId, provider, audio, episode],
    queryFn: async () => {
      const res = await getWatchSources({
        provider,
        anilistId,
        audio,
        episode,
        episodeId,
      });
      return normalizeSources(res.sources, provider, res.subtitles);
    },
    staleTime: 30_000,
    gcTime: 2 * 60_000,
    enabled,
    retry: 0,
  });
}
