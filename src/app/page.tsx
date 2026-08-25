"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const QUICK_ACCESS = [
  { title: "Attack on Titan", id: 16498 },
  { title: "Jujutsu Kaisen", id: 51009 },
  { title: "Demon Slayer", id: 40748 },
  { title: "One Punch Man", id: 21459 },
];

export default function HomePage() {
  const router = useRouter();
  const [input, setInput] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = Number(input.trim());
    if (id > 0) router.push(`/watch/${id}`);
  }

  function go(id: number) {
    router.push(`/watch/${id}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Anivexa
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Anime streaming powered by Anivexa API
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AniList ID"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-red-500/50"
            min={1}
            aria-label="AniList ID"
          />
          <button
            type="submit"
            className="rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600"
          >
            Watch
          </button>
        </form>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-white/30">
            Quick Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_ACCESS.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                <p className="text-sm font-medium text-white/80">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-white/30">
                  AniList ID: {item.id}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
