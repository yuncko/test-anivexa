"use client";

export default function PlayerLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-red-500" />
        <p className="text-sm text-white/60">Loading stream...</p>
      </div>
    </div>
  );
}