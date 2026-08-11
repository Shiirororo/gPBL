"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

type TestStatus = "accepted" | "wrong_answer" | "runtime_error" | "pending";

interface TestCase {
  id: number;
  status: TestStatus;
  input: Record<string, unknown>;
  expectedOutput: unknown;
  actualOutput: unknown;
  runtime?: string; // e.g. "12 ms"
  stderr?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TEST_CASES: TestCase[] = [
  {
    id: 1,
    status: "accepted",
    input: { nums: [2, 7, 11, 15], target: 9 },
    expectedOutput: [0, 1],
    actualOutput: [0, 1],
    runtime: "8 ms",
  },
  {
    id: 2,
    status: "wrong_answer",
    input: { nums: [3, 2, 4], target: 6 },
    expectedOutput: [1, 2],
    actualOutput: [0, 2],
    runtime: "9 ms",
  },
  {
    id: 3,
    status: "runtime_error",
    input: { nums: [3, 3], target: 6 },
    expectedOutput: [0, 1],
    actualOutput: null,
    runtime: undefined,
    stderr: "IndexError: list index out of range\n  at line 4 in twoSum",
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<
  TestStatus,
  {
    label: string;
    dotClass: string;
    badgeClass: string;
    borderClass: string;
  }
> = {
  accepted: {
    label: "Accepted",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    borderClass: "border-emerald-500/50",
  },
  wrong_answer: {
    label: "Wrong Answer",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/30",
    borderClass: "border-red-500/50",
  },
  runtime_error: {
    label: "Runtime Error",
    dotClass: "bg-red-500",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/30",
    borderClass: "border-red-500/50",
  },
  pending: {
    label: "Pending",
    dotClass: "bg-muted-foreground",
    badgeClass: "bg-muted/40 text-muted-foreground border-border",
    borderClass: "border-border",
  },
};

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: TestStatus }) {
  const meta = STATUS_META[status];
  const isPulsing = status === "accepted";

  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {isPulsing && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${meta.dotClass}`}
        />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${meta.dotClass}`}
      />
    </span>
  );
}

// ─── Tab Row ──────────────────────────────────────────────────────────────────

function TestCaseTab({
  tc,
  isActive,
  onClick,
}: {
  tc: TestCase;
  isActive: boolean;
  onClick: () => void;
}) {
  const meta = STATUS_META[tc.status];

  return (
    <button
      onClick={onClick}
      className={[
        "group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200",
        isActive
          ? `${meta.badgeClass} ${meta.borderClass} shadow-sm`
          : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      ].join(" ")}
    >
      <StatusDot status={tc.status} />
      <span>Case {tc.id}</span>
    </button>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-foreground">
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CodingResult({ className }: { className?: string }) {
  const [activeId, setActiveId] = useState<number>(MOCK_TEST_CASES[0].id);
  const active = MOCK_TEST_CASES.find((tc) => tc.id === activeId)!;
  const meta = STATUS_META[active.status];

  const allPassed = MOCK_TEST_CASES.every((tc) => tc.status === "accepted");
  const passCount = MOCK_TEST_CASES.filter(
    (tc) => tc.status === "accepted"
  ).length;

  return (
    <Card className={`rounded-xl h-full flex flex-col overflow-hidden ${className ?? ""}`}>
      {/* ── Header ── */}
      <CardHeader className="shrink-0 border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Test Results</CardTitle>

          {/* Overall pass/fail badge */}
          <span
            className={[
              "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
              allPassed
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30",
            ].join(" ")}
          >
            {passCount} / {MOCK_TEST_CASES.length} Passed
          </span>
        </div>

        {/* Tab row */}
        <div className="flex flex-wrap gap-2 pt-2">
          {MOCK_TEST_CASES.map((tc) => (
            <TestCaseTab
              key={tc.id}
              tc={tc}
              isActive={activeId === tc.id}
              onClick={() => setActiveId(tc.id)}
            />
          ))}
        </div>
      </CardHeader>

      {/* ── Detail panel ── */}
      <CardContent className="flex-1 overflow-y-auto space-y-4 pt-4">
        {/* Status banner */}
        <div
          className={[
            "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-xs font-medium",
            meta.badgeClass,
            meta.borderClass,
          ].join(" ")}
        >
          <StatusDot status={active.status} />
          <span className="font-semibold">{meta.label}</span>
          {active.runtime && (
            <span className="ml-auto text-muted-foreground">
              Runtime: {active.runtime}
            </span>
          )}
        </div>

        {/* Input */}
        <DetailRow label="Input">
          {Object.entries(active.input)
            .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
            .join("\n")}
        </DetailRow>

        {/* Expected */}
        <DetailRow label="Expected Output">
          {JSON.stringify(active.expectedOutput)}
        </DetailRow>

        {/* Actual */}
        <DetailRow label="Your Output">
          {active.actualOutput !== null && active.actualOutput !== undefined ? (
            <span
              className={
                active.status === "accepted" ? "text-emerald-400" : "text-red-400"
              }
            >
              {JSON.stringify(active.actualOutput)}
            </span>
          ) : (
            <span className="text-red-400 italic">null</span>
          )}
        </DetailRow>

        {/* Stderr — only shown on runtime error */}
        {active.stderr && (
          <DetailRow label="Error">
            <pre className="whitespace-pre-wrap text-red-400">{active.stderr}</pre>
          </DetailRow>
        )}
      </CardContent>
    </Card>
  );
}