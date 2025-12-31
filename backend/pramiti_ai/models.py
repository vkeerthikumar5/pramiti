# pramiti_ai/models.py
from django.db import models
from django.conf import settings
from groups.models import Group, Document  # keep this import for foreign keys

# =======================
# AI Question
# =======================
class AIQuestion(models.Model):
    STATUS_CHOICES = (
        ('answered', 'Answered'),
        ('failed', 'Failed'),
        ('regenerated', 'Regenerated'),
    )

    VISIBILITY_CHOICES = (
        ('group', 'Group'),
        ('private', 'Private'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='ai_questions'
    )

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='ai_questions'
    )

    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='ai_questions'
    )

    question = models.TextField()
    answer = models.TextField(blank=True)
    topic = models.CharField(max_length=100, blank=True, null=True)
    ai_model = models.CharField(max_length=100, default='gpt-4')
    tokens_used = models.PositiveIntegerField(null=True, blank=True)
    response_time_ms = models.PositiveIntegerField(null=True, blank=True)

    confidence_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='answered'
    )

    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default='group'
    )

    asked_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user} | {self.question[:40]}"


# models.py
from django.db import models
from django.conf import settings  # <- important
from groups.models import Document

class DocumentNote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    content = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'document')  # one note per user per document



