"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { PlayerQuality } from "@/types/player";
import { formatTime, clamp } from "@/lib/player/player-utils";

interface VideoControlsProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  qualities: PlayerQuality[];
  currentQuality: number;
  subtitles: { label: string; srclang: string }[];
  currentSubtitle: number;
  playbackRate: number;
  episodeTitle?: string;
  serverLabel?: string;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  onQualityChange: (level: number) => void;
  onSubtitleChange: (index: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onFullscreen: () => void;
  onPiP: () => void;
  onServersClick?: () => void;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

type Menu = "none" | "quality" | "subs" | "speed";

export default function VideoControls({
  playing,
  currentTime,
  duration,
  buffered,
  volume,
  muted,
  qualities,
  currentQuality,
  subtitles,
  currentSubtitle,
  playbackRate,
  episodeTitle,
  serverLabel,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onQualityChange,
  onSubtitleChange,
  onPlaybackRateChange,
  onFullscreen,
  onPiP,
  onServersClick,
  onNextEpisode,
  onPrevEpisode,
}: VideoControlsProps) {
  const [visible, setVisible] = useState(true);
  const [menu, setMenu] = useState<Menu>("none");
  const hideTimer = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    setVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      setMenu("none");
    }, 3000);
  }, []);

  useEffect(() => {
    show();
    return () => window.clearTimeout(hideTimer.current);
  }, [show]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? clamp((buffered / duration) * 100, 0, 100) : 0;

  function toggleMenu(next: Menu) {
    setMenu((cur) => (cur === next ? "none" : next));
    show();
  }

  return (
    <div
      ref={rootRef}
      className={`absolute inset-0 z-10 flex flex-col justify-between transition-opacity duration-300 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      onMouseMove={show}
      onTouchStart={show}
    >
      {/* Top bar */}
      <div className="flex items-start justify-between bg-gradient-to-b from-black/80 to-transparent px-4 pt-3">
        <div>
          {episodeTitle && (
            <p className="text-sm font-medium text-white">{episodeTitle}</p>
          )}
          {serverLabel && (
            <p className="mt-0.5 text-xs text-white/50">{serverLabel}</p>
          )}
        </div>
        {onServersClick && (
          <button
            onClick={() => {
              onServersClick();
              show();
            }}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium text-white/80 hover:border-white/30 hover:text-white"
            aria-label="Change server"
          >
            Servers
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
        {/* Timeline */}
        <div
          className="group mb-3 flex h-6 cursor-pointer items-center"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = clamp((e.clientX - rect.left) / rect.width, 0, 1);
            onSeek(pct * duration);
          }}
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.floor(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 5));
            if (e.key === "ArrowRight") onSeek(currentTime + 5);
          }}
        >
          <div className="relative h-1 w-full rounded-full bg-white/20 transition-all group-hover:h-1.5">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-white/30"
              style={{ width: `${bufferedPct}%` }}
            />
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-red-500"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        <div className="relative flex items-center gap-1.5">
          {onPrevEpisode && (
            <button
              onClick={onPrevEpisode}
              className="rounded p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Previous episode"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
          )}

          <button
            onClick={onPlayPause}
            className="rounded p-1.5 text-white hover:bg-white/10"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z" /></svg>
            ) : (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          {onNextEpisode && (
            <button
              onClick={onNextEpisode}
              className="rounded p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Next episode"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" /></svg>
            </button>
          )}

          {/* Volume */}
          <div className="group/vol flex items-center">
            <button
              onClick={onMuteToggle}
              className="rounded p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494m0 0L7.58 16.07a1 1 0 00-1.28.14l-.07.07H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.23l.07-.07a1 1 0 00.14-1.28L12 6.253z" /></svg>
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="ml-1 h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100"
              aria-label="Volume"
            />
          </div>

          <span className="ml-2 text-xs tabular-nums text-white/80">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Popup menus (rendered above the bar) */}
          {menu !== "none" && (
            <div className="absolute bottom-12 right-4 z-20 min-w-[120px] rounded-lg border border-white/10 bg-black/95 p-1.5 shadow-xl">
              {menu === "quality" && (
                <>
                  <MenuItem
                    active={currentQuality === -1}
                    onClick={() => {
                      onQualityChange(-1);
                      setMenu("none");
                    }}
                  >
                    Auto
                  </MenuItem>
                  {qualities.map((q) => (
                    <MenuItem
                      key={q.level}
                      active={currentQuality === q.level}
                      onClick={() => {
                        onQualityChange(q.level);
                        setMenu("none");
                      }}
                    >
                      {q.label}
                    </MenuItem>
                  ))}
                </>
              )}
              {menu === "subs" && (
                <>
                  <MenuItem
                    active={currentSubtitle === -1}
                    onClick={() => {
                      onSubtitleChange(-1);
                      setMenu("none");
                    }}
                  >
                    Off
                  </MenuItem>
                  {subtitles.map((sub, i) => (
                    <MenuItem
                      key={`${sub.srclang}-${i}`}
                      active={currentSubtitle === i}
                      onClick={() => {
                        onSubtitleChange(i);
                        setMenu("none");
                      }}
                    >
                      {sub.label}
                    </MenuItem>
                  ))}
                </>
              )}
              {menu === "speed" &&
                SPEEDS.map((s) => (
                  <MenuItem
                    key={s}
                    active={playbackRate === s}
                    onClick={() => {
                      onPlaybackRateChange(s);
                      setMenu("none");
                    }}
                  >
                    {s}x
                  </MenuItem>
                ))}
            </div>
          )}

          {/* Subtitles */}
          {subtitles.length > 0 && (
            <ControlButton
              label="Subtitles"
              active={menu === "subs"}
              onClick={() => toggleMenu("subs")}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            </ControlButton>
          )}

          {/* Quality */}
          {qualities.length > 0 && (
            <ControlButton
              label="Quality"
              active={menu === "quality"}
              onClick={() => toggleMenu("quality")}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </ControlButton>
          )}

          {/* Speed */}
          <button
            onClick={() => toggleMenu("speed")}
            className={`rounded px-2 py-1.5 text-xs font-semibold transition-colors ${
              menu === "speed" ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
            aria-label="Playback speed"
          >
            {playbackRate}x
          </button>

          {/* PiP */}
          <ControlButton label="Picture in picture" active={false} onClick={onPiP}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 6h4v6h-4v-6z" /></svg>
          </ControlButton>

          {/* Fullscreen */}
          <ControlButton label="Fullscreen" active={false} onClick={onFullscreen}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </ControlButton>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded p-1.5 transition-colors ${
        active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function MenuItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors hover:bg-white/10 ${
        active ? "text-red-400" : "text-white/80"
      }`}
    >
      {children}
    </button>
  );
}
