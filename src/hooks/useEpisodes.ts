"use client";

import { useQuery } from "@tanstack/react-query";
import { getEpisodes } from "@/lib/anivexa/client";
import { parseProviders } from "@/lib/anivexa/normalize";
import type { ParsedEpisodes } from "@/lib/anivexa/normalize";
import type { Mapping } from "@/types/anivexa";

export interface EpisodesData {
  mapping: Mapping;
  providers: ParsedEpisodes["providers"];
  failedProviders: ParsedEpisodes["failedProviders"];
}

export function useEpisodes(anilistId: number) {
  return useQuery<EpisodesData>({
    queryKey: ["episodes", anilistId],
    queryFn: async () => {
      const res = await getEpisodes(anilistId);
      const { providers, failedProviders } = parseProviders(res);
      return { mapping: res.mappings, providers, failedProviders };
    },
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
}
