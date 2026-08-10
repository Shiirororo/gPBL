from django.db import models


class User(models.Model):
    user_id = models.BigAutoField(primary_key=True)
    user_name = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=255)
    score = models.IntegerField(default=0)

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