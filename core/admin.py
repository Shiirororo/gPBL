from django.contrib import admin
from .models import (
    User, CodingChallenge, TestCase, UserCompletedChallenge,
    Result, AiQuestion, AIConversation, AIExchange,
    FeatureLock, ChallengeSession
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'user_name', 'score', 'is_active', 'is_staff']
    list_filter = ['is_active', 'is_staff']
    search_fields = ['user_name']


@admin.register(CodingChallenge)
class CodingChallengeAdmin(admin.ModelAdmin):
    list_display = ['challenge_id', 'title', 'difficulty', 'score', 'acceptance_rate']
    list_filter = ['difficulty', 'learning_status']
    search_fields = ['title', 'description']


@admin.register(FeatureLock)
class FeatureLockAdmin(admin.ModelAdmin):
    list_display = ['user', 'feature', 'locked_until', 'is_expired', 'created_at']
    list_filter = ['feature', 'locked_until', 'created_at']
    search_fields = ['user__user_name']
    readonly_fields = ['created_at']
    
    def is_expired(self, obj):
        return obj.is_expired
    is_expired.boolean = True
    is_expired.short_description = 'Expired'


@admin.register(ChallengeSession)
class ChallengeSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'challenge', 'status', 'started_at', 'ended_at']
    list_filter = ['status', 'started_at', 'ended_at']
    search_fields = ['user__user_name', 'challenge__title']
    readonly_fields = ['started_at']


# Register other models with basic admin
admin.site.register(TestCase)
admin.site.register(UserCompletedChallenge)
admin.site.register(Result)
admin.site.register(AiQuestion)
admin.site.register(AIConversation)
admin.site.register(AIExchange)
