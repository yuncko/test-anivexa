"use client";

import { Suspense, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAnime } from "@/hooks/useAnime";
import { useEpisodes } from "@/hooks/useEpisodes";
import { useWatchSources } from "@/hooks/useWatchSources";
import { useWatchProgress } from "@/hooks/useWatchProgress";
import AnimePlayer from "@/components/player/AnimePlayer";
import ServerSelector from "@/components/player/ServerSelector";
import AnimeHeader from "@/components/anime/AnimeHeader";
import EpisodeSelector from "@/components/anime/EpisodeSelector";
import EpisodeList from "@/components/anime/EpisodeList";
import type { Episode, AudioType } from "@/types/anivexa";

function parseAudio(value: string | null): AudioType {
  return value === "dub" ? "dub" : "sub";
}

function WatchPageInner() {
  const params = useParams<{ anilistId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const anilistId = Number(params.anilistId);
  const urlEp = Number(searchParams.get("ep")) || 1;
  const urlServer = searchParams.get("server") ?? "";
  const urlAudio = parseAudio(searchParams.get("audio"));

  const [episode, setEpisode] = useState(urlEp);
  const [audio, setAudio] = useState<AudioType>(urlAudio);
  const [provider, setProvider] = useState(urlServer);
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);
  const providerTried = useRef(new Set<string>());

  const { data: anime } = useAnime(anilistId);
  const { data: episodesData, isLoading: episodesLoading } = useEpisodes(anilistId);

  const providers = useMemo(
    () =>
      (episodesData?.providers ?? [])
        .filter((p) => p.sub.length > 0 || p.dub.length > 0)
        .sort((a, b) => {
          const rank = (x: typeof a) => Math.max(x.sub.length, x.dub.length);
          return rank(b) - rank(a);
        }),
    [episodesData],
  );

  // Pick initial provider: URL server → first provider with episodes.
  useEffect(() => {
    if (provider && providers.some((p) => p.name === provider)) return;
    const match = providers.find((p) => p.name === urlServer);
    setProvider(match?.name ?? providers[0]?.name ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers, urlServer]);

  const providerData = useMemo(
    () => providers.find((p) => p.name === provider),
    [providers, provider],
  );

  // Follow URL changes (e.g. browser back/forward).
  useEffect(() => {
    setEpisode(urlEp);
    setAudio(urlAudio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlEp, urlAudio]);

  const episodeList = useMemo(() => {
    if (!providerData) return [];
    return (audio === "dub" ? providerData.dub : providerData.sub).slice().sort((a, b) => a.number - b.number);
  }, [providerData, audio]);

  const currentEpisodeObj = useMemo(
    () => episodeList.find((e) => e.number === episode) ?? episodeList[0],
    [episodeList, episode],
  );

  // Current episode number the player should use.
  const activeEpisode = currentEpisodeObj?.number ?? episode;

  const sourcesQuery = useWatchSources({
    provider,
    anilistId,
    audio,
    episode: activeEpisode,
    episodeId: currentEpisodeObj?.id,
    enabled: providers.length > 0 && !!provider && !!currentEpisodeObj,
  });

  // ----- Automatic provider fallback -----
  // If the current provider errors (403 etc.) or returns no usable sources,
  // advance to the next provider instead of failing the page.
  useEffect(() => {
    if (!provider || providers.length === 0) return;
    if (!sourcesQuery.isError && !sourcesQuery.isSuccess) return;

    const failed =
      sourcesQuery.isError || (sourcesQuery.data?.length ?? 0) === 0;
    if (!failed) {
      providerTried.current.add(provider);
      return;
    }

    providerTried.current.add(provider);
    if (providerTried.current.size > providers.length) return; // all tried

    const next = providers.find((p) => !providerTried.current.has(p.name));
    if (next) {
      setFallbackNote(`${provider} unavailable — switching to ${next.name}...`);
      setProvider(next.name);
    } else {
      setFallbackNote(null);
    }
  }, [sourcesQuery.isError, sourcesQuery.isSuccess, sourcesQuery.data, provider, providers]);

  useEffect(() => {
    if (sourcesQuery.isFetching) setFallbackNote(null);
  }, [sourcesQuery.isFetching]);

  // ----- Watch progress -----
  const { resumeTime } = useWatchProgress(String(anilistId), activeEpisode);

  // ----- URL state -----
  const pushUrl = useCallback(
    (ep: number, server?: string, audioType?: AudioType) => {
      const sp = new URLSearchParams();
      if (ep > 1) sp.set("ep", String(ep));
      if (server) sp.set("server", server);
      if (audioType === "dub") sp.set("audio", "dub");
      const qs = sp.toString();
      router.replace(`/watch/${anilistId}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, anilistId],
  );

  const handleEpisodeSelect = useCallback(
    (prov: string, ep: Episode) => {
      setEpisode(ep.number);
      setAudio(ep.audio);
      setProvider(prov);
      providerTried.current = new Set();
      pushUrl(ep.number, prov, ep.audio);
    },
    [pushUrl],
  );

  const handleProviderChange = useCallback(
    (prov: string) => {
      setProvider(prov);
      providerTried.current = new Set();
      pushUrl(activeEpisode, prov, audio);
    },
    [pushUrl, activeEpisode, audio],
  );

  const handleAudioChange = useCallback(
    (next: AudioType) => {
      setAudio(next);
      providerTried.current = new Set();
      pushUrl(activeEpisode, provider, next);
    },
    [pushUrl, activeEpisode, provider],
  );

  const hasNext = episodeList.some((e) => e.number > activeEpisode);
  const hasPrev = episodeList.some((e) => e.number < activeEpisode);

  const handleNext = useCallback(() => {
    const next = episodeList.find((e) => e.number > activeEpisode);
    if (next) handleEpisodeSelect(provider, next);
  }, [episodeList, activeEpisode, handleEpisodeSelect, provider]);

  const handlePrev = useCallback(() => {
    const prev = [...episodeList].reverse().find((e) => e.number < activeEpisode);
    if (prev) handleEpisodeSelect(provider, prev);
  }, [episodeList, activeEpisode, handleEpisodeSelect, provider]);

  const sources = sourcesQuery.data ?? [];
  const displayAnime = episodesData?.mapping ?? anime ?? null;
  const episodeTitle = currentEpisodeObj?.title
    ? `Episode ${currentEpisodeObj.number} — ${currentEpisodeObj.title}`
    : undefined;

  const providerLoading =
    episodesLoading || (sourcesQuery.isLoading && providers.length > 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight text-white">
            Anivexa
          </Link>
          {displayAnime && (
            <span className="truncate text-sm text-white/50">{displayAnime.title}</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Player */}
        <div className="mb-4">
          {providerLoading || !provider ? (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-black">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
            </div>
          ) : sources.length > 0 ? (
            <AnimePlayer
              anilistId={String(anilistId)}
              sources={sources}
              episodeNumber={activeEpisode}
              episodeTitle={episodeTitle}
              startTime={resumeTime()}
              autoplayNext
              hasNextEpisode={hasNext}
              onNextEpisode={hasNext ? handleNext : undefined}
              onPrevEpisode={hasPrev ? handlePrev : undefined}
            />
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-black px-4">
              {sourcesQuery.isError || fallbackNote ? (
                <>
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
                  <p className="text-sm text-white/60">
                    {fallbackNote ?? "This server is currently unavailable. Trying another..."}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-white/60">
                    No playable source is currently available.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => sourcesQuery.refetch()}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => {
                        const next = providers.find((p) => p.name !== provider);
                        if (next) handleProviderChange(next.name);
                      }}
                      className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:border-white/40"
                    >
                      Change Server
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Below the player */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left column */}
          <div className="space-y-6">
            {displayAnime ? (
              <AnimeHeader anime={displayAnime} />
            ) : (
              <div className="space-y-3">
                <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
              </div>
            )}

            {/* Audio + provider selectors */}
            {providerData && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleAudioChange("sub")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    audio === "sub"
                      ? "bg-red-500 text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                  disabled={providerData.sub.length === 0}
                >
                  Japanese / Sub ({providerData.sub.length})
                </button>
                {providerData.dub.length > 0 && (
                  <button
                    onClick={() => handleAudioChange("dub")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      audio === "dub"
                        ? "bg-red-500 text-white"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    Dub ({providerData.dub.length})
                  </button>
                )}
              </div>
            )}

            {providers.length > 1 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                  Servers
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {providers.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleProviderChange(p.name)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                        p.name === provider
                          ? "bg-white/15 text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                {episodesData && episodesData.failedProviders.length > 0 && (
                  <p className="text-xs text-white/25">
                    Unavailable:{" "}
                    {episodesData.failedProviders.map((f) => f.provider).join(", ")}
                  </p>
                )}
              </div>
            )}

            {/* Sources of current provider */}
            {sources.length > 0 && (
              <ServerSelector
                sources={sources}
                currentSourceId={sources[0]?.id ?? null}
                failedIds={new Set()}
                onSelect={() => {
                  /* handled inside player overlay */
                }}
              />
            )}

            {/* Mobile episode strip */}
            {episodeList.length > 0 && (
              <div className="lg:hidden">
                <EpisodeList
                  episodes={episodeList}
                  currentEpisode={activeEpisode}
                  onSelect={(ep) => handleEpisodeSelect(provider, ep)}
                />
              </div>
            )}

            {/* Episode description */}
            {currentEpisodeObj?.description && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                  Episode {currentEpisodeObj.number}
                  {currentEpisodeObj.title ? ` — ${currentEpisodeObj.title}` : ""}
                </h3>
                <p className="text-sm leading-relaxed text-white/50">
                  {currentEpisodeObj.description}
                </p>
              </div>
            )}
          </div>

          {/* Right column: desktop episode sidebar */}
          <aside className="hidden lg:block">
            {episodesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
                ))}
              </div>
            ) : providers.length > 0 ? (
              <EpisodeSelector
                providers={providers}
                currentProvider={provider}
                currentAudio={audio}
                currentEpisode={activeEpisode}
                onSelectEpisode={handleEpisodeSelect}
                onSelectProvider={handleProviderChange}
              />
            ) : (
              <p className="text-sm text-white/40">
                No providers currently have this anime.
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
        </div>
      }
    >
      <WatchPageInner />
    </Suspense>
  );
}
