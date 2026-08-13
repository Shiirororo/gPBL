"""
Decorators and middleware for enforcing feature locks
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .lock_service import LockService
import logging

logger = logging.getLogger(__name__)


def require_ai_unlocked(view_func):
    """
    Decorator to check AI lock before allowing access to AI endpoints.
    
    Returns HTTP 423 Locked if AI assistance is currently locked for the user.
    """
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        # Skip check if user is not authenticated
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return view_func(self, request, *args, **kwargs)
        
        # Check if AI is locked for this user
        if LockService.is_ai_locked(request.user):
            remaining_seconds = LockService.get_lock_remaining_time(request.user)
            expiry_time = LockService.get_lock_expiry(request.user)
            
            logger.info(
                f"AI access denied for user {request.user.user_name} - "
                f"{remaining_seconds}s remaining"
            )
            
            return Response({
                'error': {
                    'code': 'ai_locked',
                    'message': 'AI assistance is locked. Please try solving the challenge on your own first.',
                    'remaining_seconds': remaining_seconds,
                    'locked_until': expiry_time.isoformat() if expiry_time else None
                }
            }, status=status.HTTP_423_LOCKED)
        
        return view_func(self, request, *args, **kwargs)
    
    return wrapper


class LockEnforcementMixin:
    """
    Mixin class that can be added to views to enforce AI locks.
    Alternative to using the decorator.
    """
    
    def dispatch(self, request, *args, **kwargs):
        """Override dispatch to check locks before processing request"""
        
        # Only check locks for authenticated users on AI-related endpoints
        if (hasattr(request, 'user') and 
            request.user.is_authenticated and 
            self.should_enforce_ai_lock(request)):
            
            if LockService.is_ai_locked(request.user):
                return self.handle_ai_locked_response(request.user)
        
        return super().dispatch(request, *args, **kwargs)
    
    def should_enforce_ai_lock(self, request):
        """
        Override this method to determine when to enforce AI locks.
        Default: enforce on POST requests (creating conversations/messages)
        """
        return request.method == 'POST'
    
    def handle_ai_locked_response(self, user):
        """Handle response when AI is locked"""
        remaining_seconds = LockService.get_lock_remaining_time(user)
        expiry_time = LockService.get_lock_expiry(user)
        
        logger.info(
            f"AI access denied for user {user.user_name} - "
            f"{remaining_seconds}s remaining"
        )
        
        return Response({
            'error': {
                'code': 'ai_locked',
                'message': 'AI assistance is locked. Please try solving the challenge on your own first.',
                'remaining_seconds': remaining_seconds,
                'locked_until': expiry_time.isoformat() if expiry_time else None
            }
        }, status=status.HTTP_423_LOCKED)
