"use client";

interface PlayerErrorProps {
  message: string;
  onRetry?: () => void;
  onChangeServer?: () => void;
}

export default function PlayerError({
  message,
  onRetry,
  onChangeServer,
}: PlayerErrorProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-black px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
        <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-center text-sm text-white/70">{message}</p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            Retry
          </button>
        )}
        {onChangeServer && (
          <button
            onClick={onChangeServer}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            Change Server
          </button>
        )}
      </div>
    </div>
  );
}