"use client"

import { useEffect, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSubmission } from "@/features/submissions/api"
import type { SubmissionDetail as SubmissionDetailData } from "@/features/submissions/types"

export default function SubmissionDetail({ resultId }: { resultId: number }) {
  const [submission, setSubmission] = useState<SubmissionDetailData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    void getSubmission(resultId, controller.signal)
      .then((data) => {
        setSubmission(data)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Unable to load submission.")
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [resultId])

  if (loading) return <p className="text-sm text-muted-foreground">Loading submission...</p>
  if (error) return <p role="alert" className="text-sm text-red-400">{error}</p>
  if (!submission) return <p className="text-sm text-muted-foreground">Submission not found.</p>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4 text-base">
          <span>Challenge #{submission.challenge_id}</span>
          <span>{submission.submit_status}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Passed: {submission.passed_testcases}</span>
          <span>{new Date(submission.timestamp).toLocaleString()}</span>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <code>{submission.submit}</code>
        </pre>
      </CardContent>
    </Card>
  )
}
