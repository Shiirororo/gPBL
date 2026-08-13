"""
Assessment API Views

Provides endpoints for code comprehension assessments:
- Check for pending assessments
- Get assessment details and questions  
- Submit answers for AI evaluation
"""

import logging
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from core.models import CodeAssessment
from core.ai.assessment_service import get_assessment_service

logger = logging.getLogger(__name__)


class PendingAssessmentView(APIView):
    """Check if user has any pending assessments that must be completed."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get the user's pending assessment, if any.
        
        Returns:
            200: {"has_pending": bool, "assessment_id"?: int, "challenge_id"?: int, ...}
        """
        pending = CodeAssessment.objects.filter(
            result__user=request.user,
            status__in=['PENDING', 'IN_PROGRESS']
        ).select_related('result__challenge').first()
        
        if not pending:
            return Response({"has_pending": False})
            
        return Response({
            "has_pending": True,
            "assessment_id": pending.assessment_id,
            "challenge_id": pending.result.challenge.challenge_id,
            "challenge_title": pending.result.challenge.title,
            "created_at": pending.created_at,
            "status": pending.status
        })


class AssessmentDetailView(APIView):
    """Get assessment questions or submit answers."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, assessment_id):
        """
        Get assessment details including questions.
        
        Args:
            assessment_id: ID of the assessment to retrieve
            
        Returns:
            200: Assessment data with questions and current answers
            404: Assessment not found or not owned by user
        """
        try:
            assessment = CodeAssessment.objects.select_related(
                'result__challenge', 'result__user'
            ).get(
                assessment_id=assessment_id,
                result__user=request.user
            )
        except CodeAssessment.DoesNotExist:
            return Response(
                {"detail": "Assessment not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Mark as started if first time accessing
        if assessment.status == 'PENDING':
            assessment.status = 'IN_PROGRESS'
            assessment.started_at = timezone.now()
            assessment.save(update_fields=['status', 'started_at'])
            logger.info(f"Assessment {assessment_id} marked as IN_PROGRESS")
        
        response_data = {
            "assessment_id": assessment.assessment_id,
            "status": assessment.status,
            "questions": assessment.questions,
            "answers": assessment.answers or {},
            "challenge": {
                "id": assessment.result.challenge.challenge_id,
                "title": assessment.result.challenge.title,
                "description": assessment.result.challenge.description
            },
            "submitted_code": assessment.result.submit,
            "created_at": assessment.created_at,
            "started_at": assessment.started_at,
        }
        
        # Include evaluation results if completed
        if assessment.status == 'COMPLETED':
            response_data.update({
                "ai_score": assessment.ai_score,
                "ai_feedback": assessment.ai_feedback,
                "detailed_scores": assessment.detailed_scores,
                "completed_at": assessment.completed_at
            })
        
        return Response(response_data)
    
    def post(self, request, assessment_id):
        """
        Submit answers for AI evaluation.
        
        Args:
            assessment_id: ID of the assessment to submit answers for
            
        Request body:
            {"answers": {"1": "answer text", "2": "answer text", ...}}
            
        Returns:
            200: Assessment completed successfully with AI feedback
            400: Invalid request or missing answers
            404: Assessment not found
            500: AI evaluation failed
        """
        try:
            assessment = CodeAssessment.objects.select_related('result').get(
                assessment_id=assessment_id,
                result__user=request.user,
                status__in=['PENDING', 'IN_PROGRESS']
            )
        except CodeAssessment.DoesNotExist:
            return Response(
                {"detail": "Assessment not found or already completed"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        answers = request.data.get('answers', {})
        if not isinstance(answers, dict):
            return Response(
                {"detail": "Answers must be provided as a dictionary"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate all questions are answered
        question_ids = {str(q['id']) for q in assessment.questions}
        provided_ids = set(answers.keys())
        
        if not question_ids.issubset(provided_ids):
            missing = question_ids - provided_ids
            return Response(
                {"detail": f"Missing answers for questions: {sorted(missing)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate answers are not empty
        empty_answers = [qid for qid, answer in answers.items() 
                        if qid in question_ids and not str(answer).strip()]
        if empty_answers:
            return Response(
                {"detail": f"Empty answers for questions: {sorted(empty_answers)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Submit for AI evaluation
        try:
            assessment_service = get_assessment_service()
            eval_result = assessment_service.evaluate_answers(
                questions=assessment.questions,
                answers=answers,
                original_code=assessment.result.submit
            )
            
            # Update assessment with results
            assessment.answers = answers
            assessment.status = 'COMPLETED'
            assessment.completed_at = timezone.now()
            assessment.ai_score = eval_result['overall_score']
            assessment.ai_feedback = eval_result['overall_feedback']
            assessment.detailed_scores = eval_result['question_scores']
            assessment.save()
            
            logger.info(
                f"Assessment {assessment_id} completed with score {eval_result['overall_score']}"
            )
            
            return Response({
                "message": "Assessment completed successfully",
                "ai_score": assessment.ai_score,
                "ai_feedback": assessment.ai_feedback,
                "detailed_scores": assessment.detailed_scores
            })
            
        except Exception as e:
            logger.error(f"Assessment evaluation failed for {assessment_id}: {e}")
            return Response(
                {"detail": "Evaluation failed, please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
