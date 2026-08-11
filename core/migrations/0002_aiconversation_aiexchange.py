# Generated manually to match the AIConversation and AIExchange models.

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        # Bảng này lưu một phiên làm challenge, code mới nhất và revision để autosave an toàn.
        migrations.CreateModel(
            name='AIConversation',
            fields=[
                (
                    'conversation_id',
                    models.BigAutoField(primary_key=True, serialize=False),
                ),
                (
                    'status',
                    models.CharField(
                        choices=[
                            ('active', 'Active'),
                            ('completed', 'Completed'),
                            ('abandoned', 'Abandoned'),
                        ],
                        default='active',
                        max_length=10,
                    ),
                ),
                ('current_code', models.TextField(blank=True, default='')),
                ('revision', models.PositiveBigIntegerField(default=0)),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('ended_at', models.DateTimeField(blank=True, null=True)),
                (
                    'challenge',
                    models.ForeignKey(
                        db_column='challenge_id',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='ai_conversations',
                        to='core.codingchallenge',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        db_column='user_id',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='ai_conversations',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'db_table': 'ai_conversations',
                'indexes': [
                    models.Index(
                        fields=['user', 'challenge', 'updated_at'],
                        name='idx_aiconv_user_chal_upd',
                    ),
                    models.Index(
                        fields=['user', 'status', 'updated_at'],
                        name='idx_aiconv_user_stat_upd',
                    ),
                ],
            },
        ),
        # Mỗi bản ghi là một lượt hỏi đáp bất biến cùng snapshot code tại thời điểm hỏi.
        migrations.CreateModel(
            name='AIExchange',
            fields=[
                (
                    'exchange_id',
                    models.BigAutoField(primary_key=True, serialize=False),
                ),
                ('sequence', models.PositiveBigIntegerField()),
                ('user_question', models.TextField()),
                ('code_snapshot', models.TextField(blank=True, default='')),
                ('assistant_hint', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'request_id',
                    models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
                ),
                (
                    'status',
                    models.CharField(
                        choices=[
                            ('pending', 'Pending'),
                            ('completed', 'Completed'),
                            ('failed', 'Failed'),
                        ],
                        default='pending',
                        max_length=10,
                    ),
                ),
                (
                    'conversation',
                    models.ForeignKey(
                        db_column='conversation_id',
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='exchanges',
                        to='core.aiconversation',
                    ),
                ),
            ],
            options={
                'db_table': 'ai_exchanges',
                'ordering': ['sequence', 'exchange_id'],
                'constraints': [
                    models.UniqueConstraint(
                        fields=('conversation', 'sequence'),
                        name='uq_aiexchange_conv_sequence',
                    ),
                    models.CheckConstraint(
                        condition=models.Q(('sequence__gt', 0)),
                        name='ck_aiexchange_sequence_gt_0',
                    ),
                ],
            },
        ),
    ]
