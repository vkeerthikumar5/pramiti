from django.db import models
from django.conf import settings
import string
import random

# =======================
# GROUP
# =======================
class Group(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    code = models.CharField(
        max_length=10,
        unique=True,
        blank=True,
        editable=False
    )

    organization = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.CASCADE,
        related_name="org_groups",
        null=True,
        blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="groups_created"
    )

    created_on = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )

    avatar = models.ImageField(
        upload_to='group_avatars/',
        blank=True,
        null=True
    )

    tags = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_unique_code()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_unique_code(length=6):
        while True:
            code = ''.join(
                random.choices(string.ascii_uppercase + string.digits, k=length)
            )
            if not Group.objects.filter(code=code).exists():
                return code

    @property
    def members_count(self):
        return self.memberships.filter(status='active').count()

    @property
    def documents_count(self):
        return self.documents.count()

    @property
    def questions_count(self):
        """
        Sum of all AIQuestions for all documents in this group
        """
        return self.ai_questions.count()


# =======================
# GROUP MEMBER
# =======================
class GroupMember(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('member', 'Member'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
    )

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='memberships'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='group_memberships'
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='member'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    joined_on = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('group', 'user')

    def __str__(self):
        return f"{self.user} -> {self.group}"


# =======================
# DOCUMENT
# =======================
class Document(models.Model):
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    file = models.FileField(upload_to='group_documents/')
    file_size = models.CharField(max_length=50, blank=True)
    uploaded_by = models.ForeignKey(
        "accounts.Organization",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents_uploaded"
    )
    uploaded_on = models.DateTimeField(auto_now_add=True)
    content = models.TextField(blank=True, null=True)
    views = models.PositiveIntegerField(default=0)
    readers = models.PositiveIntegerField(default=0)
    unanswered_questions = models.PositiveIntegerField(default=0)
    version = models.CharField(max_length=20, default="1.0")
    tags = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.title

    @property
    def total_users(self):
        return self.group.memberships.filter(status='active').count()

    @property
    def completed_count(self):
        return self.read_statuses.filter(is_completed=True).count()

    @property
    def not_completed_count(self):
        return self.total_users - self.completed_count

    @property
    def avg_read_time(self):
        qs = self.read_statuses.all()
        if not qs.exists():
            return 0
        total_seconds = sum(r.read_time_seconds for r in qs)
        return total_seconds / qs.count()  # average in seconds (float)


    @property
    def completion_percent_calculated(self):
        if self.total_users == 0:
            return 0
        return (self.completed_count * 100) // self.total_users
    
    @property
    def completion_percent(self):
        total_users = self.group.memberships.filter(status='active').count()
        if total_users == 0:
            return 0
        completed_users = self.read_statuses.filter(is_completed=True).count()
        return (completed_users * 100) // total_users


class DocumentReadStatus(models.Model):
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="read_statuses"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="document_read_statuses"
    )
    is_completed = models.BooleanField(default=False)
    read_time_seconds = models.PositiveIntegerField(default=0)  # total time spent reading in seconds
    last_read_on = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('document', 'user')

    def __str__(self):
        return f"{self.user.email} - {self.document.title}"


# =======================
# ACTIVITY LOG
# =======================
# models.py
from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from groups.models import Group, Document

class ActivityLog(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    user = GenericForeignKey('content_type', 'object_id')

    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.action

# notifications/models.py
from django.db import models
from django.conf import settings
from groups.models import Group, Document
from django.utils import timezone

class Notification(models.Model):
    NOTIF_TYPES = [
        ("added", "Added to Group"),
        ("status_changed", "Status Changed"),
        ("document_uploaded", "Document Uploaded"),
        ("group_deleted", "Group Deleted"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    type = models.CharField(max_length=50, choices=NOTIF_TYPES)
    message = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    read = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.type} - {self.message[:50]}"
