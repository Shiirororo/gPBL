import { redirect } from "next/navigation"

export default async function ChallengeAliasDetailPage({
  params,
}: {
  params: Promise<{ challengeId: string }>
}) {
  const { challengeId } = await params
  redirect(`/challenges/${challengeId}`)
}
