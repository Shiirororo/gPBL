"use client";

import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = "Easy" | "Medium" | "Hard";

interface Example {
  input: Record<string, unknown>;
  output: unknown;
  explanation?: string;
}

interface Problem {
  id: number;
  title: string;
  difficulty: Difficulty;
  description: string;
  constraints: string[];
  examples: Example[];
  tags: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PROBLEM: Problem = {
  id: 1,
  title: "Two Sum",
  difficulty: "Easy",

  description:
    "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",

  constraints: [
    "2 <= nums.length <= 10⁴",
    "-10⁹ <= nums[i] <= 10⁹",
    "-10⁹ <= target <= 10⁹",
    "Only one valid answer exists.",
    "You may not use the same element twice.",
  ],

  examples: [
    {
      input: { nums: [2, 7, 11, 15], target: 9 },
      output: [0, 1],
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: { nums: [3, 2, 4], target: 6 },
      output: [1, 2],
      explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
    },
    {
      input: { nums: [3, 3], target: 6 },
      output: [0, 1],
      explanation: "Because nums[0] + nums[1] == 6, we return [0, 1].",
    },
  ],

  functionSignature: {
    language: "python",
    functionName: "twoSum",
    parameters: [
      { name: "nums", type: "number[]" },
      { name: "target", type: "number" },
    ],
    returnType: "number[]",
  },

  starterCode: `def twoSum(nums, target): `,

  tags: ["Array", "Hash Table"],
} as Problem & { functionSignature: object; starterCode: string };

// ─── Difficulty Badge ─────────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Medium: "bg-orange-500/15  text-orange-400  border-orange-500/30",
  Hard:   "bg-red-500/15     text-red-400     border-red-500/30",
};

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge
      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${DIFFICULTY_STYLES[difficulty]}`}
    >
      {difficulty}
    </Badge>
  );
}

// ─── Inline code helper ───────────────────────────────────────────────────────

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
      {children}
    </code>
  );
}

// ─── Render description with `backtick` → <InlineCode> ───────────────────────

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <InlineCode key={i}>{part.slice(1, -1)}</InlineCode>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Example Block ────────────────────────────────────────────────────────────

function ExampleBlock({ example, index }: { example: Example; index: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1.5">
      <p className="font-semibold text-foreground">Example {index + 1}</p>
      <div className="font-mono space-y-1">
        <p>
          <span className="text-muted-foreground">Input:&nbsp;</span>
          {Object.entries(example.input)
            .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
            .join(", ")}
        </p>
        <p>
          <span className="text-muted-foreground">Output:&nbsp;</span>
          {JSON.stringify(example.output)}
        </p>
        {example.explanation && (
          <p className="font-sans text-muted-foreground">
            <span className="font-semibold text-foreground">Explanation:&nbsp;</span>
            {example.explanation}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CodingProblemBox() {
  const problem = MOCK_PROBLEM;

  return (
    <Card className="rounded-xl h-full overflow-y-auto">
      <CardHeader className="border-b border-border pb-3">
        {/* Problem number + title */}
        <div className="flex items-start gap-2">
          <CardTitle className="text-base font-semibold leading-snug">
            <span className="text-muted-foreground">{problem.id}.&nbsp;</span>
            {problem.title}
          </CardTitle>
        </div>

        {/* Difficulty + Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="rounded-full text-xs text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4 text-sm leading-relaxed">
        {/* Description */}
        <CardDescription className="text-sm text-foreground/80 leading-relaxed">
          <FormattedText text={problem.description} />
        </CardDescription>

        {/* Examples */}
        <section className="space-y-2">
          {problem.examples.map((ex, i) => (
            <ExampleBlock key={i} example={ex} index={i} />
          ))}
        </section>

        {/* Constraints */}
        <section className="space-y-1.5">
          <p className="font-semibold text-foreground text-sm">Constraints:</p>
          <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground marker:text-muted-foreground">
            {problem.constraints.map((c, i) => (
              <li key={i}>
                <InlineCode>{c}</InlineCode>
              </li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}