"use client";

import type { Episode } from "@/types/anivexa";

interface EpisodeListProps {
  episodes: Episode[];
  currentEpisode: number;
  onSelect: (episode: Episode) => void;
}

export default function EpisodeList({
  episodes,
  currentEpisode,
  onSelect,
}: EpisodeListProps) {
  if (episodes.length === 0) {
    return (
      <p className="text-sm text-white/50">
        No episodes available for this audio type.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
        Episodes
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-x-visible md:pb-0 lg:grid-cols-6">
        {episodes.map((ep) => {
          const isCurrent = ep.number === currentEpisode;
          return (
            <button
              key={`${ep.audio}-${ep.number}`}
              onClick={() => onSelect(ep)}
              className={`flex-shrink-0 rounded-lg border p-3 text-left transition-colors md:flex-shrink ${
                isCurrent
                  ? "border-red-500 bg-red-500/20"
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
              aria-label={`Episode ${ep.number}${ep.title ? ` - ${ep.title}` : ""}`}
              aria-current={isCurrent ? "true" : undefined}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${
                    isCurrent ? "bg-red-500 text-white" : "bg-white/10 text-white/60"
                  }`}
                >
                  {ep.number}
                </span>
                {ep.filler && (
                  <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                    Filler
                  </span>
                )}
              </div>
              {ep.title && (
                <p className="mt-1.5 line-clamp-2 text-xs text-white/60">
                  {ep.title}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
