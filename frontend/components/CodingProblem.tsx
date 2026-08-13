"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace";
import { getChallengeReference } from "@/lib/challenge-reference";

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  hard: "bg-red-500/15 text-red-400 border-red-500/30",
};

function FormattedText({ text }: { text: string }) {
  return text.split(/(`[^`]+`)/g).map((part, index) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={index} className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
        {part.slice(1, -1)}
      </code>
    ) : <span key={index}>{part}</span>,
  );
}

function ChallengeReference({
  example,
  hint,
}: {
  example: string | null;
  hint: string | null;
}) {
  const [isHintVisible, setIsHintVisible] = useState(false);
  const reference = getChallengeReference(example, hint);

  if (!reference.example && !reference.hint) return null;

  return (
    <section className="space-y-3" aria-label="Challenge reference">
      {reference.example && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Example of correct code</h2>
          <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed text-foreground/90">
            <code>{reference.example}</code>
          </pre>
        </div>
      )}

      {reference.hint && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-lg"
            aria-expanded={isHintVisible}
            aria-controls="challenge-database-hint"
            onClick={() => setIsHintVisible((current) => !current)}
          >
            {isHintVisible ? "Hide hint" : "Show hint"}
          </Button>
          {isHintVisible && (
            <div
              id="challenge-database-hint"
              className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-foreground/80"
            >
              <FormattedText text={reference.hint} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function CodingProblemBox() {
  const { challenge, loading, challengeError } = useChallengeWorkspace();

  if (loading) return <Card className="rounded-xl h-full p-6">Loading challenge...</Card>;
  if (challengeError) return <Card className="rounded-xl h-full p-6 text-red-400">{challengeError}</Card>;
  if (!challenge) return <Card className="rounded-xl h-full p-6">Challenge not found.</Card>;

  const categories = challenge.categories ?? [];
  return (
    <Card className="rounded-xl h-full overflow-y-auto">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base font-semibold leading-snug">
          <span className="text-muted-foreground">{challenge.challenge_id}.&nbsp;</span>
          {challenge.title}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_STYLES[challenge.difficulty] ?? ""}`}>
            {challenge.difficulty}
          </Badge>
          {categories.map((category) => <Badge key={category} variant="outline">{category}</Badge>)}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-4 text-sm leading-relaxed">
        <CardDescription className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">
          <FormattedText text={challenge.description} />
        </CardDescription>
        <ChallengeReference
          key={challenge.challenge_id}
          example={challenge.example_of_correct_code}
          hint={challenge.hint}
        />
        <p className="text-xs text-muted-foreground">Score: {challenge.score} · Acceptance: {challenge.acceptance_rate}</p>
      </CardContent>
    </Card>
  );
}
