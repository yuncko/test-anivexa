"use client";

import type { Episode } from "@/types/anivexa";

interface EpisodeCardProps {
  episode: Episode;
  isSelected: boolean;
  onClick: () => void;
}

export default function EpisodeCard({ episode, isSelected, onClick }: EpisodeCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
        isSelected
          ? "border-red-500/50 bg-red-500/10"
          : "border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      {episode.image && (
        <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded-md">
          <img
            src={episode.image}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isSelected ? "text-red-400" : "text-white/90"}`}>
            Ep {episode.number}
          </span>
          {episode.filler && (
            <span className="rounded bg-yellow-500/20 px-1 py-0.5 text-[10px] text-yellow-400">
              Filler
            </span>
          )}
        </div>
        {episode.title && (
          <p className="truncate text-xs text-white/50">{episode.title}</p>
        )}
        {episode.duration && episode.duration > 0 && (
          <p className="text-[10px] text-white/30">
            {Math.floor(episode.duration / 60)}min
          </p>
        )}
      </div>
    </button>
  );
}
