import { redirect } from "next/navigation"

// NOTE: The canonical redirect is declared in next.config.ts (permanent: true).
// This component acts as a synchronous fallback to avoid the Next.js 15+
// performance.measure negative-timestamp bug that occurs when redirect()
// is called inside an async server component before the render mark is set.
export default function ChallengeAliasDetailPage({
  params,
}: {
  params: { challengeId: string }
}) {
  redirect(`/challenges/${params.challengeId}`)
}
