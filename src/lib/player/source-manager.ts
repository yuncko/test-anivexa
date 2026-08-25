import type { StreamSource } from "@/types/anivexa";
import { rankSource } from "./source-ranking";

export class SourceManager {
  private allSources: StreamSource[] = [];
  private failedIds = new Set<string>();
  private maxRetries = 2;
  private retryCounts = new Map<string, number>();
  private currentIndex = 0;

  setSources(sources: StreamSource[]): void {
    this.allSources = sources
      .map((s) => ({ ...s, score: rankSource(s) }))
      .sort((a, b) => (b as StreamSource & { score: number }).score - (a as StreamSource & { score: number }).score);
    this.currentIndex = 0;
  }

  getPlayableSources(): StreamSource[] {
    return this.allSources.filter(
      (s) => !this.failedIds.has(s.id) && s.type !== "unknown",
    );
  }

  selectBestSource(): StreamSource | null {
    const playable = this.getPlayableSources();
    return playable.length > 0 ? playable[0] : null;
  }

  markSourceFailed(id: string): void {
    const count = this.retryCounts.get(id) ?? 0;
    if (count >= this.maxRetries) {
      this.failedIds.add(id);
      this.retryCounts.delete(id);
      const idx = this.allSources.findIndex((s) => s.id === id);
      if (idx >= 0 && idx <= this.currentIndex) {
        this.currentIndex = idx + 1;
      }
    } else {
      this.retryCounts.set(id, count + 1);
    }
  }

  getNextSource(): StreamSource | null {
    for (let i = this.currentIndex; i < this.allSources.length; i++) {
      const s = this.allSources[i];
      if (!this.failedIds.has(s.id) && s.type !== "unknown") {
        this.currentIndex = i;
        return s;
      }
    }
    return null;
  }

  selectSourceById(id: string): StreamSource | null {
    const src = this.allSources.find((s) => s.id === id);
    if (src) {
      this.failedIds.delete(id);
      this.retryCounts.delete(id);
      this.currentIndex = this.allSources.indexOf(src);
    }
    return src ?? null;
  }

  resetSourceFailures(): void {
    this.failedIds.clear();
    this.retryCounts.clear();
    this.currentIndex = 0;
  }

  hasMoreSources(): boolean {
    return this.getNextSource() !== null;
  }

  getAllSources(): StreamSource[] {
    return [...this.allSources];
  }

  getFailedCount(): number {
    return this.failedIds.size;
  }
}
