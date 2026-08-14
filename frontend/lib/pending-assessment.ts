import type { PendingAssessmentResponse } from "@/features/assessment/types"

export function pendingAssessmentFrom(
  response: PendingAssessmentResponse | null,
): PendingAssessmentResponse | null {
  if (!response?.has_pending) return null
  return typeof response.assessment_id === "number" ? response : null
}
