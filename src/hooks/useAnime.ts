"use client";

import { useQuery } from "@tanstack/react-query";
import { getMappings } from "@/lib/anivexa/client";
import type { Mapping } from "@/types/anivexa";

export function useAnime(anilistId: number) {
  return useQuery<Mapping>({
    queryKey: ["anime", anilistId],
    queryFn: async () => {
      const res = await getMappings(anilistId);
      return res.mappings;
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}