"""
AI Assessment Service

Handles code comprehension assessment generation and evaluation using OpenAI API.
"""

import json
import logging
from typing import Dict, List

from django.conf import settings
from openai import OpenAI

logger = logging.getLogger(__name__)


class AssessmentService:
    """Service for generating and evaluating code comprehension assessments."""
    
    def __init__(self):
        api_key = getattr(settings, 'OPENAI_API_KEY', None)
        if api_key:
            self.openai_client = OpenAI(api_key=api_key)
        else:
            self.openai_client = None
            logger.warning("OpenAI API key not configured - assessment features will be disabled")
            
        self.question_count = getattr(settings, 'ASSESSMENT_QUESTION_COUNT', 6)
        self.model = getattr(settings, 'OPENAI_ASSESSMENT_MODEL', 'gpt-4')
    
    def _check_client(self):
        """Check if OpenAI client is available."""
        if self.openai_client is None:
            raise Exception("OpenAI API not configured - set OPENAI_API_KEY environment variable")
    
    def generate_assessment_questions(
        self, 
        code: str, 
        challenge_description: str, 
        challenge_title: str
    ) -> List[Dict]:
        """
        Generate comprehension questions about the submitted code.
        
        Args:
            code: User's submitted Python code
            challenge_description: The original challenge description  
            challenge_title: Title of the challenge
            
        Returns:
            List of question dictionaries with id, question, and type fields
            
        Raises:
            Exception: If OpenAI API call fails or returns invalid JSON
        """
        self._check_client()
        
        prompt = f"""
Analyze this Python solution to the coding challenge "{challenge_title}":

Challenge Description:
{challenge_description}

User's Code:
```python
{code}
```

Generate exactly {self.question_count} questions to test the user's understanding of their own code's functionality.
Focus on these areas:
1. Algorithm logic and approach
2. Key data structures and their purpose
3. Time/space complexity considerations  
4. Edge case handling
5. Code structure and organization
6. Problem-solving strategy

Questions should be:
- Specific to their actual implementation
- Test conceptual understanding, not memorization
- Require explanation in 2-3 sentences
- Avoid yes/no questions

Return as valid JSON array with this exact format:
[
  {{"id": 1, "question": "What is the overall approach your solution takes to solve this problem?", "type": "open"}},
  {{"id": 2, "question": "Explain the purpose of the main data structure you used in your code.", "type": "open"}},
  {{"id": 3, "question": "How does your solution handle edge cases or invalid inputs?", "type": "open"}},
  {{"id": 4, "question": "What is the time complexity of your solution and why?", "type": "open"}},
  {{"id": 5, "question": "Describe the key steps in your algorithm's execution flow.", "type": "open"}},
  {{"id": 6, "question": "What would happen if the input size increased significantly?", "type": "open"}}
]

Generate questions that match the actual code implementation, not generic algorithm questions.
"""
        
        try:
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1500
            )
            
            content = response.choices[0].message.content
            questions = json.loads(content)
            
            # Validate structure
            if not isinstance(questions, list) or len(questions) != self.question_count:
                raise ValueError(f"Expected {self.question_count} questions, got {len(questions)}")
                
            for i, q in enumerate(questions):
                if not all(key in q for key in ['id', 'question', 'type']):
                    raise ValueError(f"Question {i} missing required fields")
            
            logger.info(f"Generated {len(questions)} assessment questions")
            return questions
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON response from OpenAI: {e}")
            raise Exception("Failed to generate valid assessment questions")
            
        except Exception as e:
            logger.error(f"OpenAI API error during question generation: {e}")
            raise Exception(f"Assessment generation failed: {str(e)}")
    
    def evaluate_answers(
        self, 
        questions: List[Dict], 
        answers: Dict[str, str], 
        original_code: str
    ) -> Dict:
        """
        Evaluate user answers against their submitted code.
        
        Args:
            questions: List of question dictionaries
            answers: Dict mapping question IDs to user answers
            original_code: The user's original submission
            
        Returns:
            Dict with overall_score, overall_feedback, and question_scores
            
        Raises:
            Exception: If OpenAI API call fails or returns invalid JSON
        """
        self._check_client()
        
        # Prepare questions and answers for evaluation
        qa_pairs = []
        for q in questions:
            qid = str(q["id"])
            user_answer = answers.get(qid, "")
            qa_pairs.append({
                "question": q["question"],
                "user_answer": user_answer
            })
        
        prompt = f"""
You are evaluating a user's understanding of their own code. Here is their original solution:

```python
{original_code}
```

Questions and their answers:
{json.dumps(qa_pairs, indent=2)}

Evaluate each answer based on:
- Technical accuracy (40%): Is the explanation factually correct?
- Conceptual understanding (30%): Does the user understand the underlying concepts?
- Clarity of explanation (20%): Is the answer well-structured and clear?  
- Completeness (10%): Does the answer address all parts of the question?

Score each answer from 0-100, then calculate an overall score.

Provide constructive feedback focusing on:
- What the user understood correctly
- Areas where understanding could be improved
- Specific suggestions for deeper learning

Return valid JSON in this exact format:
{{
  "overall_score": 85.5,
  "overall_feedback": "Good understanding of the core algorithm. Consider studying time complexity analysis more deeply. Your explanations of data structures were particularly strong.",
  "question_scores": {{
    "1": {{"score": 90, "feedback": "Excellent explanation of the overall approach. You clearly understand the problem-solving strategy."}},
    "2": {{"score": 80, "feedback": "Good explanation but could elaborate on why this data structure was optimal for this problem."}},
    "3": {{"score": 75, "feedback": "Partially correct. You identified some edge cases but missed the handling of empty inputs."}},
    "4": {{"score": 85, "feedback": "Correct time complexity identification with good reasoning."}},
    "5": {{"score": 90, "feedback": "Clear step-by-step breakdown of the algorithm flow."}},
    "6": {{"score": 88, "feedback": "Good analysis of scalability considerations."}}
  }}
}}
"""
        
        try:
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,  # Lower temperature for more consistent evaluation
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            evaluation = json.loads(content)
            
            # Validate structure
            required_keys = ['overall_score', 'overall_feedback', 'question_scores']
            if not all(key in evaluation for key in required_keys):
                raise ValueError("Evaluation response missing required fields")
            
            # Validate score range
            overall_score = evaluation['overall_score']
            if not (0 <= overall_score <= 100):
                raise ValueError(f"Overall score {overall_score} out of valid range")
            
            logger.info(f"Evaluated assessment with overall score: {overall_score}")
            return evaluation
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON response from OpenAI during evaluation: {e}")
            raise Exception("Failed to generate valid assessment evaluation")
            
        except Exception as e:
            logger.error(f"OpenAI API error during evaluation: {e}")
            raise Exception(f"Assessment evaluation failed: {str(e)}")


# Global service instance
_assessment_service = AssessmentService()


def get_assessment_service() -> AssessmentService:
    """Get the global assessment service instance."""
    return _assessment_service
