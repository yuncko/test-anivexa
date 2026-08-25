"use client";

import type { ParsedProvider } from "@/lib/anivexa/normalize";
import EpisodeCard from "./EpisodeCard";
import type { AudioType, Episode } from "@/types/anivexa";

interface EpisodeSelectorProps {
  providers: ParsedProvider[];
  currentProvider: string;
  currentAudio: AudioType;
  currentEpisode: number;
  onSelectEpisode: (provider: string, episode: Episode) => void;
  onSelectProvider: (provider: string) => void;
}

export default function EpisodeSelector({
  providers,
  currentProvider,
  currentAudio,
  currentEpisode,
  onSelectEpisode,
  onSelectProvider,
}: EpisodeSelectorProps) {
  const provider = providers.find((p) => p.name === currentProvider) ?? providers[0];
  if (!provider) return null;

  const episodes =
    currentAudio === "dub" ? provider.dub : currentAudio === "raw" ? provider.raw : provider.sub;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
        Episodes
      </h3>

      {providers.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {providers.map((p) => (
            <button
              key={p.name}
              onClick={() => onSelectProvider(p.name)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                p.name === currentProvider
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto pr-1">
        {episodes.length === 0 && (
          <p className="py-4 text-center text-sm text-white/40">
            No episodes available.
          </p>
        )}
        {[...episodes]
          .sort((a, b) => a.number - b.number)
          .map((ep) => (
            <EpisodeCard
              key={`${ep.audio}-${ep.number}`}
              episode={ep}
              isSelected={ep.number === currentEpisode}
              onClick={() => onSelectEpisode(provider.name, ep)}
            />
          ))}
      </div>
    </div>
  );
}
