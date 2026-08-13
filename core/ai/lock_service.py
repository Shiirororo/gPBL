"""
AI Lock Service

Manages feature locks to prevent users from accessing certain features
(like AI assistance) for specified durations.
"""
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from core.models import FeatureLock
import logging

logger = logging.getLogger(__name__)


class LockService:
    """Service for managing user feature locks"""
    
    AI_FEATURE = 'ai_assistance'
    
    @staticmethod
    def create_ai_lock(user, duration_minutes=10):
        """
        Create an AI assistance lock for the specified user and duration.
        
        Args:
            user: User instance
            duration_minutes: Duration in minutes (default: 10)
            
        Returns:
            FeatureLock instance or None if lock already exists
        """
        try:
                with transaction.atomic():
                    # Calculate lock expiry time
                    locked_until = timezone.now() + timedelta(minutes=duration_minutes)
                    
                    # Verify user exists in database first
                    if not user.pk:
                        logger.error(f"Cannot create lock for user without primary key: {user}")
                        return None
                    
                    # Create or update existing lock
                    lock, created = FeatureLock.objects.update_or_create(
                        user=user,
                        feature=LockService.AI_FEATURE,
                        defaults={
                            'locked_until': locked_until
                        }
                    )
                
                action = "Created" if created else "Updated"
                logger.info(f"{action} AI lock for user {user.user_name} until {locked_until}")
                
                return lock
                
        except Exception as e:
            logger.error(f"Failed to create AI lock for user {user.user_name}: {e}")
            return None
    
    @staticmethod
    def is_ai_locked(user):
        """
        Check if AI assistance is currently locked for the user.
        
        Args:
            user: User instance
            
        Returns:
            bool: True if AI is locked, False otherwise
        """
        try:
            lock = FeatureLock.objects.filter(
                user=user,
                feature=LockService.AI_FEATURE,
                locked_until__gt=timezone.now()
            ).first()
            
            return lock is not None
            
        except Exception as e:
            logger.error(f"Error checking AI lock for user {user.user_name}: {e}")
            return False
    
    @staticmethod
    def get_lock_remaining_time(user):
        """
        Get remaining lock time in seconds for AI assistance.
        
        Args:
            user: User instance
            
        Returns:
            int: Remaining seconds or 0 if not locked
        """
        try:
            lock = FeatureLock.objects.filter(
                user=user,
                feature=LockService.AI_FEATURE,
                locked_until__gt=timezone.now()
            ).first()
            
            if lock:
                remaining = lock.locked_until - timezone.now()
                return max(0, int(remaining.total_seconds()))
            
            return 0
            
        except Exception as e:
            logger.error(f"Error getting lock remaining time for user {user.user_name}: {e}")
            return 0
    
    @staticmethod
    def get_lock_expiry(user):
        """
        Get the expiry datetime for AI assistance lock.
        
        Args:
            user: User instance
            
        Returns:
            datetime or None if not locked
        """
        try:
            lock = FeatureLock.objects.filter(
                user=user,
                feature=LockService.AI_FEATURE,
                locked_until__gt=timezone.now()
            ).first()
            
            return lock.locked_until if lock else None
            
        except Exception as e:
            logger.error(f"Error getting lock expiry for user {user.user_name}: {e}")
            return None
    
    @staticmethod
    def remove_lock(user, feature=None):
        """
        Remove a specific lock or all locks for a user.
        
        Args:
            user: User instance
            feature: Feature name (default: AI_FEATURE)
            
        Returns:
            int: Number of locks removed
        """
        try:
            if feature is None:
                feature = LockService.AI_FEATURE
                
            deleted_count, _ = FeatureLock.objects.filter(
                user=user,
                feature=feature
            ).delete()
            
            logger.info(f"Removed {deleted_count} {feature} locks for user {user.user_name}")
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error removing {feature} lock for user {user.user_name}: {e}")
            return 0
    
    @staticmethod
    def cleanup_expired_locks():
        """
        Clean up expired locks from the database.
        This should be called periodically by a background task.
        
        Returns:
            int: Number of expired locks cleaned up
        """
        try:
            deleted_count, _ = FeatureLock.objects.filter(
                locked_until__lt=timezone.now()
            ).delete()
            
            if deleted_count > 0:
                logger.info(f"Cleaned up {deleted_count} expired locks")
            
            return deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired locks: {e}")
            return 0
    
    @staticmethod
    def get_user_locks(user):
        """
        Get all active locks for a user.
        
        Args:
            user: User instance
            
        Returns:
            QuerySet of active FeatureLock instances
        """
        try:
            return FeatureLock.objects.filter(
                user=user,
                locked_until__gt=timezone.now()
            ).order_by('locked_until')
            
        except Exception as e:
            logger.error(f"Error getting locks for user {user.user_name}: {e}")
            return FeatureLock.objects.none()
