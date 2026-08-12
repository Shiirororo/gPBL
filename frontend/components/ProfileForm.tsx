"use client";

import { IdentificationCard, Star, User } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfile {
  user_name: string;
  score: number;
}

export default function ProfileForm() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/user/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || "Unable to load profile.");
        setProfile(data as UserProfile);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Unable to load profile.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xl shadow-black/10">
      <div className="h-24 bg-gradient-to-r from-violet-600/30 via-indigo-500/20 to-transparent" />
      <CardHeader className="relative border-b border-border pt-12">
        <span className="absolute -top-10 left-6 flex size-20 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
          <User size={34} weight="bold" />
        </span>
        <CardTitle className="font-mono text-xl">{profile?.user_name ?? "User profile"}</CardTitle>
        <CardDescription>Your gPBL account and learning progress.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {loading && <p className="text-sm text-muted-foreground">Loading profile...</p>}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {!loading && !error && profile && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <dt className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><IdentificationCard size={16} /> Username</dt>
              <dd className="truncate font-mono text-sm font-semibold">{profile.user_name}</dd>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <dt className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Star size={16} /> Total score</dt>
              <dd className="font-mono text-sm font-semibold text-violet-400">{profile.score} points</dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
