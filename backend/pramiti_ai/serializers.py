from rest_framework import serializers
from .models import AIQuestion

from rest_framework import serializers
from .models import AIQuestion

class AIQuestionSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AIQuestion
        fields = "__all__"

    def get_user_name(self, obj):
        # Return full name if available, else username, else "Anonymous"
        if obj.user:
            return getattr(obj.user, "get_full_name", lambda: obj.user.full_name)()
        return "Anonymous"

from rest_framework import serializers
from .models import DocumentNote

class DocumentNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentNote
        fields = ['id', 'document', 'user', 'content', 'updated_at']
# serializers.py
from rest_framework import serializers
from groups.models import ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "action",
            "user_name",
            "timestamp",
        ]
