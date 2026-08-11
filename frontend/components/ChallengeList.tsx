"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { getChallenges } from "@/features/challenges/api"
import type { Challenge, ChallengeDifficulty } from "@/features/challenges/types"

type FilterDifficulty = "all" | ChallengeDifficulty

const FILTER_OPTIONS: Array<{ label: string; value: FilterDifficulty }> = [
  { label: "All", value: "all" },
  { label: "Easy", value: "easy" },
  { label: "Medium", value: "medium" },
  { label: "Hard", value: "hard" },
]

const DIFFICULTY_STYLES: Record<ChallengeDifficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  hard: "bg-red-500/15 text-red-400 border-red-500/30",
}

const ACTIVE_FILTER_STYLES: Record<FilterDifficulty, string> = {
  all: "bg-primary text-primary-foreground border-primary",
  easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  medium: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  hard: "bg-red-500/20 text-red-400 border-red-500/40",
}

function isSolved(challenge: Challenge): boolean {
  const status = challenge.learning_status?.toLowerCase() ?? ""
  return status === "solved" || status === "completed"
}

export default function ChallengeList() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [filter, setFilter] = useState<FilterDifficulty>("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    void getChallenges(controller.signal)
      .then((items) => {
        setChallenges(items)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Unable to load challenges.")
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const filtered = useMemo(
    () =>
      challenges.filter((challenge) => {
        const matchesDifficulty = filter === "all" || challenge.difficulty === filter
        const matchesSearch = challenge.title.toLowerCase().includes(search.toLowerCase())
        return matchesDifficulty && matchesSearch
      }),
    [challenges, filter, search],
  )

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="shrink-0 border-b border-border px-4 pb-3 pt-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Challenges
          <span className="ml-2 text-xs font-normal normal-case text-muted-foreground/60">
            {filtered.length} problems
          </span>
        </h2>

        <input
          id="challenge-search"
          type="search"
          placeholder="Search problems..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mb-2 w-full rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm transition placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/50"
        />

        <div className="flex gap-1.5">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              id={`challenge-filter-${option.value}`}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-full border px-3 py-0.5 text-xs font-medium transition-all ${
                filter === option.value
                  ? ACTIVE_FILTER_STYLES[option.value]
                  : "border-border bg-transparent text-muted-foreground hover:border-ring/40 hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="flex-1 divide-y divide-border overflow-y-auto">
        {loading && <li className="p-6 text-center text-sm text-muted-foreground">Loading challenges...</li>}
        {!loading && error && <li role="alert" className="p-6 text-center text-sm text-red-400">{error}</li>}
        {!loading && !error && filtered.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">No problems found.</li>
        )}

        {!loading && !error && filtered.map((challenge) => (
          <li key={challenge.challenge_id}>
            <Link
              href={`/challenge/${challenge.challenge_id}`}
              id={`challenge-item-${challenge.challenge_id}`}
              className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <span
                className={`mt-1.5 size-2 shrink-0 rounded-full transition-colors ${
                  isSolved(challenge) ? "bg-emerald-500" : "bg-border group-hover:bg-muted-foreground/40"
                }`}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-6 shrink-0 text-xs text-muted-foreground">
                    {challenge.challenge_id}.
                  </span>
                  <span className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                    {challenge.title}
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 pl-8">
                  <Badge className={`h-4 rounded-full border px-2 py-0 text-[10px] font-semibold capitalize ${DIFFICULTY_STYLES[challenge.difficulty]}`}>
                    {challenge.difficulty}
                  </Badge>
                  {(challenge.categories ?? []).map((category) => (
                    <Badge key={category} variant="outline" className="h-4 rounded-full px-1.5 text-[10px] text-muted-foreground">
                      {category}
                    </Badge>
                  ))}
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/60">
                    {challenge.acceptance_rate}% acceptance
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
