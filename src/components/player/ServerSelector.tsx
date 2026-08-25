"use client";

import type { StreamSource } from "@/types/anivexa";

interface ServerSelectorProps {
  sources: StreamSource[];
  currentSourceId: string | null;
  failedIds: Set<string>;
  onSelect: (source: StreamSource) => void;
}

export default function ServerSelector({
  sources,
  currentSourceId,
  failedIds,
  onSelect,
}: ServerSelectorProps) {
  const grouped = sources.reduce<Record<string, StreamSource[]>>((acc, s) => {
    (acc[s.provider] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
        Servers
      </h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(grouped).map(([provider, srcs]) => (
          <div key={provider}>
            <p className="mb-1 text-xs font-medium text-white/40">{provider}</p>
            <div className="flex flex-wrap gap-1.5">
              {srcs.map((src) => {
                const isCurrent = src.id === currentSourceId;
                const isFailed = failedIds.has(src.id);
                return (
                  <button
                    key={src.id}
                    onClick={() => onSelect(src)}
                    disabled={isFailed && !isCurrent}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isCurrent
                        ? "border-red-500 bg-red-500/20 text-red-400"
                        : isFailed
                          ? "cursor-not-allowed border-white/5 bg-white/5 text-white/30 line-through"
                          : "border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10"
                    }`}
                    aria-label={`${provider} ${src.name}`}
                  >
                    {src.name}
                    <span className="ml-1.5 text-[10px] uppercase opacity-50">
                      {src.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
