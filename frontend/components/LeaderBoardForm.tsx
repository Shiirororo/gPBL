"use client";

import { Crown, Medal, Trophy } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LeaderboardUser {
  user_name: string;
  score: number;
}

const RANK_STYLES = [
  "border-amber-400/40 bg-amber-400/10 text-amber-300",
  "border-slate-300/30 bg-slate-300/10 text-slate-300",
  "border-orange-500/30 bg-orange-500/10 text-orange-400",
];

export default function LeaderBoardForm() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/leaderboard", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "Unable to load leaderboard.");
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Unable to load leaderboard.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xl shadow-black/10">
      <CardHeader className="border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
            <Trophy size={21} weight="fill" />
          </span>
          <div>
            <CardTitle className="font-mono text-xl">Leaderboard</CardTitle>
            <CardDescription>Top learners ranked by their total score.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading && <p className="p-8 text-center text-sm text-muted-foreground">Loading leaderboard...</p>}
        {error && <p role="alert" className="p-8 text-center text-sm text-red-400">{error}</p>}
        {!loading && !error && users.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No ranking data available.</p>}
        {!loading && !error && users.length > 0 && (
          <ol className="divide-y divide-border">
            {users.map((user, index) => (
              <li key={`${user.user_name}-${index}`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg border font-mono text-sm font-bold ${RANK_STYLES[index] ?? "border-border bg-muted/30 text-muted-foreground"}`}>
                  {index === 0 ? <Crown size={18} weight="fill" /> : index < 3 ? <Medal size={18} weight="fill" /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{user.user_name}</p>
                  <p className="text-xs text-muted-foreground">Rank #{index + 1}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-violet-400">{user.score}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">points</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
