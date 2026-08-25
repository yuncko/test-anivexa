import type { StreamSource } from "@/types/anivexa";

export function rankSource(source: StreamSource): number {
  let score = 0;

  if (source.type === "hls") score += 30;
  else if (source.type === "mp4") score += 25;
  else if (source.type === "iframe") score -= 50;
  else score -= 1000;

  score += source.priority;

  if (source.subtitles && source.subtitles.length > 0) score += 10;

  return score;
}
