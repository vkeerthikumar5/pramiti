from rest_framework import serializers
from .models import Group
from rest_framework import serializers
from .models import Group, Document, GroupMember,  ActivityLog
from accounts.models import User

class GroupSerializer(serializers.ModelSerializer):
    members_count = serializers.IntegerField(read_only=True)
    documents_count = serializers.IntegerField(read_only=True)
    questions_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Group
        fields = '__all__'  # keep all existing fields
        read_only_fields = [
            'id', 'organization', 'created_by', 'created_on',
            'status', 'avatar', 'tags',
            'members_count', 'documents_count', 'questions_count'  # added counts
        ]


# ----------------------------
# User Serializer (simple)
# ----------------------------
class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "email"]


# ----------------------------
# Group Serializer
# ----------------------------
class GroupDetailSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    members_count = serializers.IntegerField(read_only=True)
    documents_count = serializers.IntegerField(read_only=True)
    questions_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "description",
            "organization",
            "created_by",
            "created_on",
            "status",
            "avatar",
            "code",
            "members_count",
            "documents_count",
            "questions_count",
        ]
    def get_created_by(self, obj):
        # If a user created it
        user_name = obj.organization.admin_name if obj.organization else None
        
        # Get organization name
        org_name = obj.organization.organization_name if obj.organization else None
        
        # Combine with comma
        parts = [p for p in [user_name, org_name] if p]
        return ", ".join(parts) if parts else "Unknown"

# ----------------------------
# Group Member Serializer
# ----------------------------
class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer()

    class Meta:
        model = GroupMember
        fields = ["user", "role", "status", "joined_on", "last_active"]

# ----------------------------
# Document Serializer
# ----------------------------


# ----------------------------
# Activity Log Serializer
# ----------------------------
class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSimpleSerializer()

    class Meta:
        model = ActivityLog
        fields = "__all__"

from rest_framework import generics, permissions
from .models import Group, GroupMember
from .serializers import GroupSerializer
from accounts.authentication import UserOrgJWTAuthentication

class UserGroupsList(generics.ListAPIView):
    serializer_class = GroupSerializer
    authentication_classes = [UserOrgJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Only groups where the user is a member or pending
        return Group.objects.filter(memberships__user=user).order_by('-id')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

# serializers.py
from rest_framework import serializers
from .models import Group, GroupMember

class UserGroupSerializer(serializers.ModelSerializer):
    membership_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'code', 'membership_status','status']  # add other fields as needed

    def get_membership_status(self, obj):
        user = self.context['request'].user
        try:
            member = GroupMember.objects.get(user=user, group=obj)
            return member.status  # 'pending', 'active', etc.
        except GroupMember.DoesNotExist:
            return None

class OrganizationMemberSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "email",
            "designation",
            "department",
            "employee_id",
            "is_active",
            "groups",
            "status",
        ]

    def get_groups(self, obj):
        return [
            {
                "id": gm.group.id,
                "name": gm.group.name,
                "status": gm.status
            }
            for gm in obj.group_memberships.select_related("group").all()
        ]


    def get_status(self, obj):
        return obj.status




    def get_group_id(self, obj):
        # Return first group id or None
        if obj.groups.exists():
            return obj.groups.first().id
        return None


# serializers.py
from rest_framework import serializers
from .models import Document

from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.admin_name",
        read_only=True
    )

    # Writable file field
    file = serializers.FileField(write_only=True)

    # Read-only URL field
    file_url = serializers.SerializerMethodField(read_only=True)

    not_completed_count = serializers.IntegerField(read_only=True)
    completed_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "summary",
            "file",          # for upload
            "file_url",      # for response
            "uploaded_on",
            "uploaded_by",
            "uploaded_by_name",
            "file_size",
            "views",
            "readers",
            "not_completed_count",
            "completion_percent",
            "completed_count",
        ]
        read_only_fields = [
            "id",
            "uploaded_on",
            "uploaded_by",
            "uploaded_by_name",
            "file_size",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file:
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None


from rest_framework import serializers
from .models import DocumentReadStatus

class DocumentReadStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentReadStatus
        fields = ['document', 'user', 'is_completed', 'read_time_seconds', 'last_read_on','avg_read_time']

from rest_framework import serializers
from .models import DocumentReadStatus

class DocumentEngagementSerializer(serializers.ModelSerializer):
    participantName = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)
    readDuration = serializers.SerializerMethodField()
    isCompleted = serializers.SerializerMethodField()  # Now returns Completed/In Progress/Pending
    lastAccessed = serializers.SerializerMethodField()  # Handle NA

    class Meta:
        model = DocumentReadStatus
        fields = [
            "id",
            "participantName",
            "email",
            "readDuration",
            "isCompleted",
            "lastAccessed",
        ]

    def get_participantName(self, obj):
        return obj.user.full_name

    def get_readDuration(self, obj):
        # If read_time_seconds is 0 or None, return "NA"
        if not obj.read_time_seconds:
            return "NA"
        return f"{round(obj.read_time_seconds / 60, 2)} mins"

    def get_isCompleted(self, obj):
        if obj.is_completed:
            return "Completed"
        elif obj.read_time_seconds and obj.read_time_seconds > 0:
            return "In Progress"
        else:
            return "Pending"

    def get_lastAccessed(self, obj):
        if obj.last_read_on:
            return obj.last_read_on
        return "NA"


# admin_dashboard/serializers.py
from rest_framework import serializers

class SimpleChartSerializer(serializers.Serializer):
    date = serializers.CharField()
    views = serializers.IntegerField(required=False)
    count = serializers.IntegerField(required=False)


class DocumentMetricSerializer(serializers.Serializer):
    title = serializers.CharField()
    views = serializers.IntegerField(required=False)
    questions = serializers.IntegerField(required=False)

