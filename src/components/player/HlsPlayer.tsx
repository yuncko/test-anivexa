"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";
import { isNativeHlsSupported, createHlsInstance } from "@/lib/player/hls";
import type { StreamSource } from "@/types/anivexa";
import type { PlayerQuality } from "@/types/player";

export interface HlsPlayerCallbacks {
  onReady?: () => void;
  onError?: (error: Error) => void;
  onEnded?: () => void;
  onPlaying?: () => void;
  onPaused?: () => void;
  onBuffering?: () => void;
  onTimeUpdate?: (time: number, duration: number, buffered: number) => void;
  onQualities?: (qualities: PlayerQuality[]) => void;
}

interface HlsPlayerProps extends HlsPlayerCallbacks {
  source: StreamSource;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  autoPlay?: boolean;
  startTime?: number;
  /** Current hls.js instance exposed to the parent for quality control. */
  onHlsInstance?: (hls: Hls | null) => void;
}

/**
 * Video element that plays a single StreamSource.
 * - HLS via hls.js (native HLS on Safari/iOS)
 * - MP4/direct via native <video>
 * - Subtitle tracks rendered as HTML5 <track>
 *
 * All callbacks are stored in refs so that parent re-renders never
 * tear down and rebuild the media pipeline.
 */
export default function HlsPlayer({
  source,
  videoRef,
  autoPlay = false,
  startTime = 0,
  onHlsInstance,
  onReady,
  onError,
  onEnded,
  onPlaying,
  onPaused,
  onBuffering,
  onTimeUpdate,
  onQualities,
}: HlsPlayerProps) {
  const cb = useRef<HlsPlayerCallbacks>({});
  cb.current = { onReady, onError, onEnded, onPlaying, onPaused, onBuffering, onTimeUpdate, onQualities };

  // Attach <video> element event listeners once.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => cb.current.onPlaying?.();
    const onPause = () => cb.current.onPaused?.();
    const onEnd = () => cb.current.onEnded?.();
    const onWaiting = () => cb.current.onBuffering?.();
    const onTime = () => {
      const end = video.buffered.length > 0
        ? video.buffered.end(video.buffered.length - 1)
        : 0;
      cb.current.onTimeUpdate?.(video.currentTime, video.duration || 0, end);
    };
    const onErr = () => {
      // Ignore errors while the element has no source (between switches).
      if (!video.currentSrc && !video.getAttribute("src")) return;
      cb.current.onError?.(new Error(video.error?.message || "Playback error"));
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnd);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("error", onErr);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnd);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("error", onErr);
    };
  }, [videoRef]);

  // Re-create the media pipeline only when the actual source changes.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let disposed = false;

    const seekToStart = () => {
      if (startTime > 0 && Math.abs(video.currentTime - startTime) > 1) {
        video.currentTime = startTime;
      }
    };

    const attachSubtitles = () => {
      if (!source.subtitles?.length) return;
      video.querySelectorAll("track").forEach((t) => t.remove());
      for (const sub of source.subtitles) {
        const track = document.createElement("track");
        track.kind = "subtitles";
        track.label = sub.label;
        track.srclang = sub.srclang;
        track.src = sub.url;
        if (sub.default) track.default = true;
        video.appendChild(track);
      }
    };

    const startPlayback = () => {
      if (autoPlay) {
        video.play().catch(() => {
          /* autoplay blocked — user will press play */
        });
      }
    };

    if (source.type === "hls" && isNativeHlsSupported()) {
      video.src = source.url;
      video.addEventListener("loadedmetadata", seekToStart, { once: true });
      attachSubtitles();
      startPlayback();
      cb.current.onReady?.();
      onHlsInstance?.(null);
    } else if (source.type === "hls") {
      hls = createHlsInstance();
      hls.loadSource(source.url);
      hls.attachMedia(video);
      onHlsInstance?.(hls);

      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        if (disposed) return;
        const qualities: PlayerQuality[] = data.levels.map((level, i) => ({
          level: i,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          label: `${level.height}p`,
        }));
        cb.current.onQualities?.(qualities);
        seekToStart();
        startPlayback();
        cb.current.onReady?.();
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (disposed || !data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          // Media errors are often recoverable without switching sources.
          try {
            hls?.recoverMediaError();
            return;
          } catch {
            /* fall through to error */
          }
        }
        cb.current.onError?.(
          new Error(data.details ?? "HLS playback error"),
        );
      });
    } else if (source.type === "mp4") {
      video.src = source.url;
      video.addEventListener("loadedmetadata", seekToStart, { once: true });
      attachSubtitles();
      startPlayback();
      cb.current.onReady?.();
      onHlsInstance?.(null);
    } else {
      cb.current.onError?.(new Error(`Unsupported source type: ${source.type}`));
      onHlsInstance?.(null);
    }

    return () => {
      disposed = true;
      if (hls) {
        hls.destroy();
        onHlsInstance?.(null);
      }
      video.removeAttribute("src");
      video.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.id, source.url, source.type, startTime, autoPlay, videoRef]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full bg-black"
      playsInline
      controls={false}
      preload="metadata"
    />
  );
}
