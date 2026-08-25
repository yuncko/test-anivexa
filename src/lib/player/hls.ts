import Hls from "hls.js";

export interface HlsOptions {
  enableWorker?: boolean;
  lowLatencyMode?: boolean;
  maxBufferLength?: number;
  maxMaxBufferLength?: number;
  xhrSetup?: (xhr: XMLHttpRequest, url: string) => void;
}

export function isNativeHlsSupported(): boolean {
  if (typeof document === "undefined") return false;
  const video = document.createElement("video");
  return (
    typeof video.canPlayType === "function" &&
    video.canPlayType("application/vnd.apple.mpegurl") !== ""
  );
}

export function createHlsInstance(options?: HlsOptions): Hls {
  return new Hls({
    enableWorker: true,
    lowLatencyMode: false,
    maxBufferLength: 30,
    maxMaxBufferLength: 600,
    ...options,
  });
}
