/**
 * Types for Code Assessment feature
 */

export interface AssessmentQuestion {
  id: number
  question: string
  type: 'open'
}

export interface PendingAssessmentResponse {
  has_pending: boolean
  assessment_id?: number
  challenge_id?: number
  challenge_title?: string
  created_at?: string
  status?: string
}

export interface AssessmentDetail {
  assessment_id: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  questions: AssessmentQuestion[]
  answers: Record<string, string>
  challenge: {
    id: number
    title: string
    description: string
  }
  submitted_code: string
  created_at: string
  started_at?: string
  // Only present when completed
  ai_score?: number
  ai_feedback?: string
  detailed_scores?: Record<string, {
    score: number
    feedback: string
  }>
  completed_at?: string
}

export interface SubmitAnswersRequest {
  answers: Record<string, string>
}

export interface SubmitAnswersResponse {
  message: string
  ai_score: number
  ai_feedback: string
  detailed_scores: Record<string, {
    score: number
    feedback: string
  }>
}
