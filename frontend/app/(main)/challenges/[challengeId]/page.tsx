import type { Metadata } from "next";
import ChallengeWorkspace from "@/components/ChallengeWorkspace";
import { ChallengeWorkspaceProvider } from "@/providers/ChallengeWorkspaceProvider";

type ChallengePageProps = {
  params: Promise<{ challengeId: string }>;
};

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
  const { challengeId } = await params;
  return { title: `Challenge ${challengeId}` };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { challengeId } = await params;
  const parsedChallengeId = Number(challengeId);

  return (
    <ChallengeWorkspaceProvider key={parsedChallengeId}>
      <ChallengeWorkspace challengeId={parsedChallengeId} />
    </ChallengeWorkspaceProvider>
  );
}
