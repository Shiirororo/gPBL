import uuid

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class UserManager(BaseUserManager):
    """Custom manager for the User model using user_name as the identifier."""

    def create_user(self, user_name, password=None, **extra_fields):
        if not user_name:
            raise ValueError("The user_name field is required.")
        user = self.model(user_name=user_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, user_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(user_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.BigAutoField(primary_key=True)
    user_name = models.CharField(max_length=100, unique=True)
    score = models.IntegerField(default=0)

    # Required by Django admin & auth system
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = UserManager()

    # Use user_name as the login identifier (replaces default 'username')
    USERNAME_FIELD = 'user_name'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.user_name


class CodingChallenge(models.Model):
    challenge_id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField()

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='easy'
    )
    hint = models.TextField(null=True, blank=True)
    starter_code = models.TextField(null=True, blank=True)
    score = models.IntegerField(default=0)
    categories = models.JSONField(null=True, blank=True)
    learning_status = models.CharField(max_length=50, null=True, blank=True)
    example_of_correct_code = models.TextField(null=True, blank=True)
    function_name = models.CharField(max_length=100, default='solution')
    acceptance_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00
    )

    class Meta:
        db_table = 'coding_challenges'
        indexes = [
            models.Index(fields=['difficulty'], name='idx_challenges_difficulty'),
            models.Index(fields=['learning_status'], name='idx_challenges_learning_status'),
        ]

    def __str__(self):
        return self.title


class TestCase(models.Model):
    testcase_id = models.BigAutoField(primary_key=True)

    challenge = models.ForeignKey(
        'CodingChallenge',
        on_delete=models.CASCADE,
        db_column='challenge_id',
        related_name='test_cases'
    )

    input = models.TextField()
    output = models.TextField()
    is_hidden = models.BooleanField(default=False)

    class Meta:
        db_table = 'test_cases'
        indexes = [
            models.Index(fields=['challenge'], name='idx_test_cases_challenge_id'),
        ]

    def __str__(self):
        return f"TestCase #{self.testcase_id}"


class UserCompletedChallenge(models.Model):
    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='completed_challenges'
    )
    challenge = models.ForeignKey(
        'CodingChallenge',
        on_delete=models.CASCADE,
        db_column='challenge_id',
        related_name='completed_by_users'
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_completed_challenges'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'challenge'],
                name='pk_user_completed_challenges'
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.challenge}"


class Result(models.Model):
    result_id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='results'
    )
    challenge = models.ForeignKey(
        'CodingChallenge',
        on_delete=models.CASCADE,
        db_column='challenge_id',
        related_name='results'
    )

    submit = models.TextField()
    submit_status = models.CharField(max_length=50)
    passed_testcases = models.IntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'results'
        indexes = [
            models.Index(fields=['user'], name='idx_results_user_id'),
            models.Index(fields=['challenge'], name='idx_results_challenge_id'),
            models.Index(fields=['timestamp'], name='idx_results_timestamp'),
        ]

    def __str__(self):
        return f"Result #{self.result_id} - {self.user} - {self.submit_status}"


class AiQuestion(models.Model):
    question_id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='ai_questions'
    )
    challenge = models.ForeignKey(
        'CodingChallenge',
        on_delete=models.CASCADE,
        db_column='challenge_id',
        related_name='ai_questions'
    )

    question = models.TextField()
    user_answer = models.TextField(null=True, blank=True)
    feedback = models.TextField(null=True, blank=True)
    ai_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'ai_questions'
        indexes = [
            models.Index(fields=['user'], name='idx_ai_questions_user_id'),
            models.Index(fields=['challenge'], name='idx_ai_questions_challenge_id'),
        ]

    def __str__(self):
        return f"AiQuestion #{self.question_id} - {self.user}"


class AIConversation(models.Model):
    """Một phiên làm bài độc lập của người dùng trên một challenge."""

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        ABANDONED = 'abandoned', 'Abandoned'

    conversation_id = models.BigAutoField(primary_key=True)

    # Hai khóa ngoại này xác định chủ sở hữu và đề bài của phiên làm việc.
    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='ai_conversations'
    )
    challenge = models.ForeignKey(
        'CodingChallenge',
        on_delete=models.CASCADE,
        db_column='challenge_id',
        related_name='ai_conversations'
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    # current_code là bản nháp mới nhất để có thể tiếp tục khi mở lại challenge.
    # revision tăng sau mỗi lần lưu, giúp tầng service phát hiện ghi đè đồng thời.
    current_code = models.TextField(blank=True, default='')
    revision = models.PositiveBigIntegerField(default=0)

    # Các mốc thời gian phục vụ việc sắp xếp, tiếp tục và đóng một phiên làm bài.
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ai_conversations'
        indexes = [
            models.Index(
                fields=['user', 'challenge', 'updated_at'],
                name='idx_aiconv_user_chal_upd'
            ),
            models.Index(
                fields=['user', 'status', 'updated_at'],
                name='idx_aiconv_user_stat_upd'
            ),
        ]

    def __str__(self):
        return (
            f"AIConversation #{self.conversation_id} - "
            f"{self.user} - {self.challenge}"
        )


class AIExchange(models.Model):
    """Một lượt hỏi - đáp AI cùng snapshot code tại đúng thời điểm hỏi."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    exchange_id = models.BigAutoField(primary_key=True)
    conversation = models.ForeignKey(
        'AIConversation',
        on_delete=models.CASCADE,
        db_column='conversation_id',
        related_name='exchanges'
    )

    sequence = models.PositiveBigIntegerField()
    user_question = models.TextField()

    code_snapshot = models.TextField(blank=True, default='')
    assistant_hint = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    request_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING
    )

    class Meta:
        db_table = 'ai_exchanges'
        ordering = ['sequence', 'exchange_id']
        constraints = [
            models.UniqueConstraint(
                fields=['conversation', 'sequence'],
                name='uq_aiexchange_conv_sequence'
            ),
            models.CheckConstraint(
                condition=models.Q(sequence__gt=0),
                name='ck_aiexchange_sequence_gt_0'
            ),
        ]

    def __str__(self):
        return (
            f"AIExchange #{self.exchange_id} - "
            f"conversation #{self.conversation_id} - sequence {self.sequence}"
        )
