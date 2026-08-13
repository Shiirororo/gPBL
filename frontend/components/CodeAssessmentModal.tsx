'use client'

/**
 * Code Assessment Modal Component
 * 
 * Forces users to complete comprehension assessment after 100% AC submissions.
 * Cannot be dismissed until all questions are answered and submitted.
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, BookOpen, Code } from 'lucide-react'
import { getAssessmentDetail, submitAssessmentAnswers } from '@/features/assessment/api'
import { AssessmentDetail, AssessmentQuestion } from '@/features/assessment/types'

interface CodeAssessmentModalProps {
  assessmentId: number
  isOpen: boolean
  onComplete: () => void
}

export function CodeAssessmentModal({ assessmentId, isOpen, onComplete }: CodeAssessmentModalProps) {
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Load assessment data
  useEffect(() => {
    if (!isOpen || !assessmentId) return

    const loadAssessment = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const data = await getAssessmentDetail(assessmentId)
        setAssessment(data)
        
        // Initialize answers with existing data
        setAnswers(data.answers || {})
        
        // If already completed, show results immediately
        if (data.status === 'COMPLETED') {
          setCurrentQuestionIndex(-1) // Show results view
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assessment')
      } finally {
        setIsLoading(false)
      }
    }

    loadAssessment()
  }, [isOpen, assessmentId])

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const isCurrentAnswerValid = () => {
    if (!assessment || currentQuestionIndex < 0) return true
    const currentQuestion = assessment.questions[currentQuestionIndex]
    const answer = answers[currentQuestion.id.toString()]
    return answer && answer.trim().length > 0
  }

  const getAnsweredCount = () => {
    if (!assessment) return 0
    return assessment.questions.filter(q => 
      answers[q.id.toString()]?.trim()
    ).length
  }

  const canSubmit = () => {
    if (!assessment) return false
    return assessment.questions.every(q => 
      answers[q.id.toString()]?.trim()
    )
  }

  const handleNext = () => {
    if (!assessment) return
    
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!assessment || !canSubmit()) return

    try {
      setIsSubmitting(true)
      setError(null)
      
      const result = await submitAssessmentAnswers(assessmentId, answers)
      
      // Update assessment with results
      setAssessment(prev => prev ? {
        ...prev,
        status: 'COMPLETED',
        ai_score: result.ai_score,
        ai_feedback: result.ai_feedback,
        detailed_scores: result.detailed_scores,
        completed_at: new Date().toISOString()
      } : null)
      
      // Show results view
      setCurrentQuestionIndex(-1)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answers')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (assessment?.status === 'COMPLETED') {
      onComplete()
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Prevent closing if not completed
          if (assessment?.status !== 'COMPLETED') {
            e.preventDefault()
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing if not completed
          if (assessment?.status !== 'COMPLETED') {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Code Comprehension Assessment
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        ) : !assessment ? (
          <div className="p-4 text-center text-gray-500">
            Assessment not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with challenge info and progress */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{assessment.challenge.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {assessment.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  {assessment.status !== 'COMPLETED' && (
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        Progress: {getAnsweredCount()} / {assessment.questions.length}
                      </div>
                      <Progress 
                        value={(getAnsweredCount() / assessment.questions.length) * 100} 
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Results view (when completed) */}
            {currentQuestionIndex === -1 && assessment.status === 'COMPLETED' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Assessment Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {assessment.ai_score?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">AI Feedback</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {assessment.ai_feedback}
                      </p>
                    </div>
                  </div>

                  {assessment.detailed_scores && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Question Breakdown</h4>
                      {assessment.questions.map((question, index) => {
                        const score = assessment.detailed_scores?.[question.id.toString()]
                        return score ? (
                          <div key={question.id} className="border rounded p-3 space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="font-medium text-sm">Q{index + 1}</div>
                              <Badge variant={score.score >= 80 ? 'default' : score.score >= 60 ? 'secondary' : 'destructive'}>
                                {score.score}/100
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{score.feedback}</p>
                          </div>
                        ) : null
                      })}
                    </div>
                  )}

                  <div className="pt-4">
                    <Button onClick={handleClose} className="w-full">
                      Continue to Platform
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Question view (when in progress) */}
            {currentQuestionIndex >= 0 && assessment.status !== 'COMPLETED' && (
              <>
                {/* Current question */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Question {currentQuestionIndex + 1} of {assessment.questions.length}</span>
                      <Badge variant="outline">
                        {answers[assessment.questions[currentQuestionIndex].id.toString()]?.trim() ? 'Answered' : 'Unanswered'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      {assessment.questions[currentQuestionIndex].question}
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="answer">Your Answer</Label>
                      <Textarea
                        id="answer"
                        value={answers[assessment.questions[currentQuestionIndex].id.toString()] || ''}
                        onChange={(e) => handleAnswerChange(
                          assessment.questions[currentQuestionIndex].id.toString(),
                          e.target.value
                        )}
                        placeholder="Explain your understanding in 2-3 sentences..."
                        className="min-h-[120px]"
                        disabled={isSubmitting}
                      />
                      <div className="text-xs text-gray-500">
                        Tip: Be specific about your code's implementation, not generic algorithm concepts.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Code reference (collapsible) */}
                <details className="group">
                  <summary className="cursor-pointer p-3 bg-gray-50 rounded border flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span className="font-medium">View Your Submitted Code</span>
                    <span className="ml-auto text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-2 p-4 bg-gray-900 text-gray-100 rounded font-mono text-sm overflow-x-auto">
                    <pre>{assessment.submitted_code}</pre>
                  </div>
                </details>

                {/* Navigation and submit */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0 || isSubmitting}
                  >
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {currentQuestionIndex < assessment.questions.length - 1 ? (
                      <Button
                        onClick={handleNext}
                        disabled={!isCurrentAnswerValid() || isSubmitting}
                      >
                        Next Question
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit() || isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
