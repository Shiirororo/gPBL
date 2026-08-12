import type { Metadata } from "next";
import Link from "next/link";
import SubmissionDetail from "@/components/SubmissionDetail";

export const metadata: Metadata = { title: "Submission" };

type SubmissionPageProps = {
  params: Promise<{ submissionId: string }>;
};

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const { submissionId } = await params;
  const resultId = Number(submissionId);

  return (
    <div className="mx-auto min-h-[calc(100vh-3rem)] max-w-5xl p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Submission</p>
          <h1 className="text-xl font-semibold">Result #{submissionId}</h1>
        </div>
        <Link href="/challenges" className="text-sm text-primary underline-offset-4 hover:underline">
          Back to challenges
        </Link>
      </div>
      <SubmissionDetail resultId={resultId} />
    </div>
  );
}
