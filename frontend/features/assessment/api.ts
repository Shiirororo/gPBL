/**
 * API functions for Code Assessment feature
 */

import { 
  PendingAssessmentResponse, 
  AssessmentDetail, 
  SubmitAnswersRequest, 
  SubmitAnswersResponse 
} from './types'

const API_BASE = '/api/assessments'

/**
 * Check if user has any pending assessments
 */
export async function checkPendingAssessment(): Promise<PendingAssessmentResponse | null> {
  const response = await fetch(`${API_BASE}/pending/`, {
    credentials: 'include',
  })

  // 401 = not authenticated; silently return null (no pending assessment)
  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error('Failed to check pending assessment')
  }

  const data = await response.json().catch(() => null)
  // Treat a null/non-object response as "no pending assessment"
  if (!data || typeof data !== 'object') return null
  return data as PendingAssessmentResponse
}

/**
 * Get assessment details including questions
 */
export async function getAssessmentDetail(assessmentId: number): Promise<AssessmentDetail> {
  const response = await fetch(`${API_BASE}/${assessmentId}/`, {
    credentials: 'include',
  })
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Assessment not found')
    }
    throw new Error('Failed to get assessment details')
  }
  
  return response.json()
}

/**
 * Submit answers for AI evaluation
 */
export async function submitAssessmentAnswers(
  assessmentId: number, 
  answers: Record<string, string>
): Promise<SubmitAnswersResponse> {
  const response = await fetch(`${API_BASE}/${assessmentId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ answers }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Submission failed' }))
    throw new Error(errorData.detail || 'Failed to submit answers')
  }
  
  return response.json()
}
