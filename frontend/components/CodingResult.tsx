"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChallengeWorkspace } from "@/hooks/useChallengeWorkspace";

const PASSED = new Set(["AC", "accepted"]);

export default function CodingResult({ className }: { className?: string }) {
  const { submissionResult } = useChallengeWorkspace();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!submissionResult) {
    return <Card className={`rounded-xl h-full p-6 text-sm text-muted-foreground ${className ?? ""}`}>Run your code to see test results.</Card>;
  }

  const details = submissionResult.details ?? [];
  const active = details[Math.min(activeIndex, Math.max(details.length - 1, 0))];
  return (
    <Card className={`rounded-xl h-full flex flex-col overflow-hidden ${className ?? ""}`}>
      <CardHeader className="shrink-0 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Test Results</CardTitle>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${PASSED.has(submissionResult.status) ? "text-emerald-400" : "text-red-400"}`}>
            {submissionResult.passed_testcases} / {submissionResult.total_testcases} Passed
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {details.map((test, index) => (
            <button key={`${test.testcase_id}-${index}`} type="button" onClick={() => setActiveIndex(index)} className={`rounded-lg border px-3 py-1.5 text-xs ${index === activeIndex ? "border-violet-500 text-violet-300" : "border-border text-muted-foreground"}`}>
              Case {index + 1}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3 pt-4 text-xs">
        {!active && <p>No testcase details were returned by the backend.</p>}
        {active && <>
          <p className={PASSED.has(active.status) ? "text-emerald-400" : "text-red-400"}>{active.status} · {active.runtime_ms} ms</p>
          <div><p className="mb-1 text-muted-foreground">Expected output</p><pre className="rounded border p-2 whitespace-pre-wrap">{active.expected_output ?? "Hidden"}</pre></div>
          <div><p className="mb-1 text-muted-foreground">Your output</p><pre className="rounded border p-2 whitespace-pre-wrap">{active.actual_output ?? "No output"}</pre></div>
          {active.stderr && <div><p className="mb-1 text-muted-foreground">Error</p><pre className="rounded border p-2 text-red-400 whitespace-pre-wrap">{active.stderr}</pre></div>}
        </>}
      </CardContent>
    </Card>
  );
}
