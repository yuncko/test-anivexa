"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type Hls from "hls.js";
import dynamic from "next/dynamic";
import type { StreamSource } from "@/types/anivexa";
import type { PlayerQuality } from "@/types/player";
import { SourceManager } from "@/lib/player/source-manager";
import VideoControls from "./VideoControls";
import PlayerLoading from "./PlayerLoading";
import PlayerError from "./PlayerError";
import ServerSelector from "./ServerSelector";
import { saveWatchProgress } from "@/lib/storage/watch-progress";

const HlsPlayer = dynamic(() => import("./HlsPlayer"), { ssr: false });

const MAX_AUTO_RETRIES = 2;
const NEXT_EPISODE_COUNTDOWN = 5;

interface AnimePlayerProps {
  anilistId: string;
  sources: StreamSource[];
  episodeNumber: number;
  episodeTitle?: string;
  startTime?: number;
  autoplayNext: boolean;
  hasNextEpisode: boolean;
  onEpisodeWatched?: () => void;
  onSourceChange?: (source: StreamSource) => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
}

export default function AnimePlayer({
  anilistId,
  sources,
  episodeNumber,
  episodeTitle,
  startTime = 0,
  autoplayNext,
  hasNextEpisode,
  onEpisodeWatched,
  onSourceChange,
  onNextEpisode,
  onPrevEpisode,
}: AnimePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const managerRef = useRef<SourceManager>(new SourceManager());
  const sourceRetries = useRef(new Map<string, number>());

  const [currentSource, setCurrentSource] = useState<StreamSource | null>(null);
  const [manualSelection, setManualSelection] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "playing-source" | "switching" | "ended" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [qualities, setQualities] = useState<PlayerQuality[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentSubtitle, setCurrentSubtitle] = useState(-1);
  const [showServers, setShowServers] = useState(false);

  // Re-rank and select whenever the source list changes.
  useEffect(() => {
    const manager = managerRef.current;
    manager.setSources(sources);
    sourceRetries.current.clear();

    const chosen =
      (manualSelection && manager.selectSourceById(manualSelection)) ||
      manager.selectBestSource();

    if (chosen) {
      setCurrentSource(chosen);
      setStatus("loading");
      setErrorMessage("");
    } else {
      setCurrentSource(null);
      setStatus("error");
      setErrorMessage("No playable source is currently available.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources]);

  const markFailed = useCallback((id: string) => {
    setFailedIds((prev) => new Set(prev).add(id));
  }, []);

  // Core fallback routine: called whenever the current source errors fatally.
  const handleSourceError = useCallback(() => {
    const manager = managerRef.current;
    if (!currentSource) return;

    const retries = (sourceRetries.current.get(currentSource.id) ?? 0) + 1;
    sourceRetries.current.set(currentSource.id, retries);

    if (retries <= MAX_AUTO_RETRIES) {
      // Soft retry of the same source: force a reload by nudging state.
      setStatus("loading");
      setCurrentSource((s) => (s ? { ...s } : s));
      return;
    }

    manager.markSourceFailed(currentSource.id);
    markFailed(currentSource.id);

    const next = manager.getNextSource();
    if (next) {
      setSwitchingTo(`${next.provider} — ${next.name}`);
      setStatus("switching");
      onSourceChange?.(next);
      window.setTimeout(() => {
        setCurrentSource(next);
        setStatus("loading");
        setSwitchingTo(null);
      }, 600);
    } else {
      manager.resetSourceFailures();
      setFailedIds(new Set());
      setCurrentSource(null);
      setStatus("error");
      setErrorMessage("Unable to play this episode. All servers failed.");
    }
  }, [currentSource, onSourceChange, markFailed]);

  const handleRetry = useCallback(() => {
    const manager = managerRef.current;
    manager.resetSourceFailures();
    setFailedIds(new Set());
    sourceRetries.current.clear();
    const best = manager.selectBestSource();
    if (best) {
      setCurrentSource(best);
      setStatus("loading");
      setErrorMessage("");
    }
  }, []);

  const handleManualSelect = useCallback(
    (source: StreamSource) => {
      managerRef.current.selectSourceById(source.id);
      sourceRetries.current.delete(source.id);
      setManualSelection(source.id);
      setFailedIds((prev) => {
        const next = new Set(prev);
        next.delete(source.id);
        return next;
      });
      setCurrentSource(source);
      setStatus("loading");
      setShowServers(false);
      onSourceChange?.(source);
    },
    [onSourceChange],
  );

  // ----- Progress persistence -----
  useEffect(() => {
    const id = window.setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused && video.currentTime > 0 && video.duration > 0) {
        saveWatchProgress(anilistId, episodeNumber, video.currentTime, video.duration);
      }
    }, 10_000);
    return () => window.clearInterval(id);
  }, [anilistId, episodeNumber]);

  // ----- Next-episode countdown -----
  useEffect(() => {
    if (status !== "ended" || !autoplayNext || !hasNextEpisode || countdown !== null) return;
    setCountdown(NEXT_EPISODE_COUNTDOWN);
  }, [status, autoplayNext, hasNextEpisode, countdown]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      onNextEpisode?.();
      return;
    }
    const t = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [countdown, onNextEpisode]);

  // ----- Controls -----
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, []);

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (video) video.currentTime = time;
  }, []);

  const handleVolume = useCallback((vol: number) => {
    setVolume(vol);
    setMuted(vol === 0);
    const video = videoRef.current;
    if (video) {
      video.volume = vol;
      video.muted = vol === 0;
    }
  }, []);

  const handleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const handleQuality = useCallback((level: number) => {
    setCurrentQuality(level);
    if (hlsRef.current) hlsRef.current.currentLevel = level;
  }, []);

  const handleSubtitle = useCallback((index: number) => {
    setCurrentSubtitle(index);
    const video = videoRef.current;
    if (!video) return;
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = i === index ? "showing" : "hidden";
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => {});
  }, []);

  const handlePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      /* PiP unsupported */
    }
  }, []);

  const handleRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
  }, []);

  // ----- Keyboard -----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeek(Math.max(0, (videoRef.current?.currentTime ?? 0) - 10));
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeek((videoRef.current?.currentTime ?? 0) + 10);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleVolume(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          handleVolume(Math.max(0, volume - 0.1));
          break;
        case "m":
        case "M":
          handleMute();
          break;
        case "f":
        case "F":
          handleFullscreen();
          break;
        case "Escape":
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlePlayPause, handleSeek, handleVolume, handleMute, handleFullscreen, volume]);

  const subtitles = useMemo(
    () => currentSource?.subtitles?.map((s) => ({ label: s.label, srclang: s.srclang })) ?? [],
    [currentSource],
  );

  const serverLabel = currentSource
    ? `${currentSource.provider} — ${currentSource.name}`
    : undefined;

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black focus:outline-none"
      tabIndex={0}
      role="region"
      aria-label="Video player"
    >
      {/* Overlay states */}
      {status === "error" ? (
        <PlayerError
          message={errorMessage}
          onRetry={handleRetry}
          onChangeServer={() => setShowServers(true)}
        />
      ) : status === "loading" ? (
        <PlayerLoading />
      ) : status === "switching" ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
          <p className="text-sm text-white/70">Current source failed. Trying another server...</p>
          {switchingTo && <p className="text-xs text-white/40">{switchingTo}</p>}
        </div>
      ) : null}

      {/* Player is mounted unless a fatal error occurred */}
      {currentSource && status !== "error" && (
        <HlsPlayer
          key={`${currentSource.id}-${episodeNumber}`}
          source={currentSource}
          videoRef={videoRef}
          autoPlay
          startTime={startTime}
          onHlsInstance={(hls) => {
            hlsRef.current = hls;
          }}
          onReady={() => {
            setStatus((s) => (s === "switching" || s === "ended" ? s : "playing-source"));
          }}
          onPlaying={() => setPlaying(true)}
          onPaused={() => setPlaying(false)}
          onError={() => handleSourceError()}
          onEnded={() => {
            setPlaying(false);
            setStatus("ended");
            const video = videoRef.current;
            saveWatchProgress(anilistId, episodeNumber, video?.duration ?? 0, video?.duration ?? 0);
            onEpisodeWatched?.();
          }}
          onTimeUpdate={(t, d, b) => {
            setCurrentTime(t);
            if (d) setDuration(d);
            setBuffered(b);
          }}
          onQualities={(qs) => setQualities(qs)}
        />
      )}

      {/* Ended overlay: next episode */}
      {status === "ended" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/80">
          {hasNextEpisode ? (
            <>
              <p className="text-lg font-semibold text-white">Next Episode</p>
              {autoplayNext && countdown !== null ? (
                <p className="text-sm text-white/60">
                  Next episode in {countdown} second{countdown === 1 ? "" : "s"}
                </p>
              ) : null}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCountdown(null);
                    onNextEpisode?.();
                  }}
                  className="rounded-lg bg-red-500 px-5 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Play Next
                </button>
                {autoplayNext && countdown !== null && (
                  <button
                    onClick={() => setCountdown(null)}
                    className="rounded-lg border border-white/20 px-5 py-2 text-sm text-white/80 hover:border-white/40"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-lg font-semibold text-white">
              You have finished this episode
            </p>
          )}
          <button
            onClick={() => {
              setStatus("playing-source");
              handleSeek(0);
              handlePlayPause();
            }}
            className="text-sm text-white/50 underline-offset-4 hover:text-white hover:underline"
          >
            Watch again
          </button>
        </div>
      )}

      {/* Controls */}
      {currentSource && (status === "playing-source" || status === "ended") && (
        <VideoControls
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          volume={volume}
          muted={muted}
          qualities={qualities}
          currentQuality={currentQuality}
          subtitles={subtitles}
          currentSubtitle={currentSubtitle}
          playbackRate={playbackRate}
          episodeTitle={episodeTitle ?? `Episode ${episodeNumber}`}
          serverLabel={serverLabel}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onVolumeChange={handleVolume}
          onMuteToggle={handleMute}
          onQualityChange={handleQuality}
          onSubtitleChange={handleSubtitle}
          onPlaybackRateChange={handleRate}
          onFullscreen={handleFullscreen}
          onPiP={handlePiP}
          onServersClick={() => setShowServers((v) => !v)}
          onNextEpisode={hasNextEpisode ? onNextEpisode : undefined}
          onPrevEpisode={onPrevEpisode}
        />
      )}

      {/* Server panel overlay */}
      {showServers && (
        <div className="absolute inset-0 z-30 overflow-auto bg-black/95 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Select a Server
            </h3>
            <button
              onClick={() => setShowServers(false)}
              className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close server list"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ServerSelector
            sources={sources}
            currentSourceId={currentSource?.id ?? null}
            failedIds={failedIds}
            onSelect={handleManualSelect}
          />
        </div>
      )}
    </div>
  );
}
