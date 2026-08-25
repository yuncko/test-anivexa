"use client";

import type { Mapping } from "@/types/anivexa";

interface AnimeHeaderProps {
  anime: Mapping;
}

export default function AnimeHeader({ anime }: AnimeHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-white md:text-3xl">
        {anime.title}
      </h1>
      <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
        <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-medium uppercase">
          {anime.format}
        </span>
        <span>{anime.episodes} episodes</span>
        {anime.synonyms[0] && anime.synonyms[0] !== anime.title && (
          <span className="text-white/40">{anime.synonyms[0]}</span>
        )}
      </div>
    </div>
  );
}
