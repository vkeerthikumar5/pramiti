# ---------- DRF Imports ----------
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView

# ---------- Django Imports ----------
from django.shortcuts import get_object_or_404
from django.db.models import Avg, F, Count, Sum
from django.utils.timesince import timesince
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict

# ---------- Local Models ----------
from .models import (
    Group, Document, GroupMember, ActivityLog,
    DocumentReadStatus, Notification
)
from accounts.models import User, Organization
from pramiti_ai.models import AIQuestion

# ---------- Local Serializers ----------
from .serializers import (
    GroupSerializer, GroupDetailSerializer, DocumentSerializer,
    GroupMemberSerializer, UserGroupSerializer,
    OrganizationMemberSerializer, ActivityLogSerializer,
    DocumentReadStatusSerializer, DocumentEngagementSerializer
)

# ---------- Local Utilities ----------
from .utils.utils import log_activity, create_notification

# ---------------------------------------
# Group List & Create
# ---------------------------------------
class GroupListCreate(generics.ListCreateAPIView):
    serializer_class = GroupSerializer

    def get_queryset(self):
        user = self.request.user
        # Check if user is an Organization
        if isinstance(user, Organization):
            # Only groups belonging to this organization
            return Group.objects.filter(organization=user).order_by("-id")
        # For normal users, show only groups they are members of
        return Group.objects.filter(memberships__user=user).distinct().order_by("-id")

    def perform_create(self, serializer):
        user = self.request.user
        # If Organization is creating, set organization
        org = user if isinstance(user, Organization) else None
        serializer.save(
            organization=org,
            created_by=user if not isinstance(user, Organization) else None
        )

# ---------------------------------------
# Group Detail
# ---------------------------------------
class GroupDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

class GroupDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    def patch(self, request, *args, **kwargs):
        group = self.get_object()
        data = request.data
        if 'name' in data:
            group.name = data['name']
        if 'description' in data:
            group.description = data['description']
        group.save()
        serializer = self.get_serializer(group)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        group = self.get_object()
        for member in group.memberships.all():
            message = f"The group '{group.name}' has been deleted."
            create_notification(user=member.user, notif_type="group_deleted", message=message, group=group)
        group.delete()
        return Response({"message": "Group deleted successfully!"}, status=status.HTTP_200_OK)

# ---------------------------------------
# Group Archive
# ---------------------------------------
class GroupArchiveAPIView(APIView):
    def patch(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        if group.status == "inactive":
            group.status = "active"
            msg = "Group activated successfully!"
            notif_msg = f"The group '{group.name}' has been activated."
        else:
            group.status = "inactive"
            msg = "Group archived successfully!"
            notif_msg = f"The group '{group.name}' has been archived."
        group.save()
        members = GroupMember.objects.filter(group=group)
        for member in members:
            create_notification(
                user=member.user,
                notif_type="group_status_changed",
                message=notif_msg,
                group=group
            )
        return Response({"message": msg, "status": group.status}, status=status.HTTP_200_OK)

# ---------------------------------------
# Group Members List
# ---------------------------------------
class GroupMembersList(generics.ListAPIView):
    serializer_class = GroupMemberSerializer

    def get_queryset(self):
        group_id = self.kwargs["group_id"]
        return GroupMember.objects.filter(group_id=group_id)

# ---------------------------------------
# Documents List in Group
# ---------------------------------------
class GroupDocumentsList(generics.ListAPIView):
    serializer_class = DocumentSerializer

    def get_queryset(self):
        group_id = self.kwargs["group_id"]
        return Document.objects.filter(group_id=group_id).order_by("-uploaded_on")

# ---------------------------------------
# Upload Document
# ---------------------------------------
class UploadDocumentAPI(generics.CreateAPIView):
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        group_id = self.kwargs["group_id"]
        document = serializer.save(group_id=group_id, uploaded_by=self.request.user)
        log_activity(
            user=self.request.user,
            group=document.group,
            document=document,
            action=f"Document '{document.title}' uploaded"
        )
        active_members = GroupMember.objects.filter(group_id=group_id, status='active')
        for member in active_members:
            message = f"New document '{document.title}' has been uploaded in group '{document.group.name}'."
            create_notification(
                user=member.user,
                notif_type="document_uploaded",
                message=message,
                group=document.group,
                document=document
            )

# ---------------------------------------
# Delete Document
# ---------------------------------------
class DeleteDocumentAPI(APIView):
    def delete(self, request, group_id, doc_id):
        try:
            document = Document.objects.get(id=doc_id, group_id=group_id)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        document.delete()
        return Response({"message": "Document deleted successfully"}, status=status.HTTP_200_OK)

# ---------------------------------------
# Document Detail
# ---------------------------------------
class DocumentDetailAPI(generics.RetrieveAPIView):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

# ---------------------------------------
# Activity Log for Document
# ---------------------------------------
class DocumentActivityAPI(generics.ListAPIView):
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        doc_id = self.kwargs["doc_id"]
        return ActivityLog.objects.filter(document_id=doc_id).order_by("-timestamp")

# ---------------------------------------
# Join Group
# ---------------------------------------
class JoinGroupAPI(generics.CreateAPIView):
    def post(self, request, *args, **kwargs):
        user = request.user
        code = request.data.get("code", "").upper()
        try:
            group = Group.objects.get(code=code)
        except Group.DoesNotExist:
            return Response({"error": "Invalid group code"}, status=status.HTTP_400_BAD_REQUEST)
        if GroupMember.objects.filter(user=user, group=group).exists():
            member = GroupMember.objects.get(user=user, group=group)
            return Response({"status": "exists", "membership_status": member.status})
        GroupMember.objects.create(user=user, group=group, status='pending', role='member')
        return Response({"status": "pending", "message": "Request sent. Wait for admin approval."})

# ---------------------------------------
# User Groups List
# ---------------------------------------
class UserGroupsList(generics.ListAPIView):
    serializer_class = UserGroupSerializer

    def get_queryset(self):
        user = self.request.user
        return Group.objects.filter(memberships__user=user).order_by('-id')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serialized = []
        for group in queryset:
            membership = GroupMember.objects.get(group=group, user=request.user)
            data = UserGroupSerializer(group, context={"request": request}).data
            data["role"] = membership.role
            serialized.append(data)
        return Response(serialized)

# ---------------------------------------
# Organization Members List
# ---------------------------------------
class OrganizationMembersAPIView(generics.ListAPIView):
    serializer_class = OrganizationMemberSerializer

    def get_queryset(self):
        user = self.request.user
        if not isinstance(user, Organization):
            return User.objects.none()
        return User.objects.filter(organization=user.organization_name).distinct()

# ---------------------------------------
# Update / Remove Group Members
# ---------------------------------------
class UpdateGroupMemberStatusAPI(APIView):
    def patch(self, request, group_id, user_id):
        status_value = request.data.get("status")
        if status_value not in ["active", "pending", "suspended"]:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            member = GroupMember.objects.get(group_id=group_id, user_id=user_id)
        except GroupMember.DoesNotExist:
            return Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)
        old_status = member.status
        member.status = status_value
        member.save()
        if old_status != status_value:
            message = f"Your status in group '{member.group.name}' has been changed to '{status_value}'."
            create_notification(user=member.user, notif_type="status_changed", message=message, group=member.group)
        return Response({"message": "Status updated", "status": member.status})

class RemoveGroupMemberAPI(APIView):
    def delete(self, request, group_id, user_id):
        try:
            member = GroupMember.objects.get(group_id=group_id, user_id=user_id)
        except GroupMember.DoesNotExist:
            return Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)
        member.delete()
        message = f"You have been removed from group '{member.group.name}'."
        create_notification(user=member.user, notif_type="status_changed", message=message, group=member.group)
        return Response({"message": "Member removed"})

# ---------------------------------------
# Update / Remove Organization Members
# ---------------------------------------
class UpdateOrgMemberStatusAPI(APIView):
    def patch(self, request, user_id):
        status_value = request.data.get("status")
        if status_value not in ["active", "pending", "suspended"]:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            member = User.objects.get(id=user_id, organization=request.user.organization_name)
        except User.DoesNotExist:
            return Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)
        member.status = status_value
        member.is_active = status_value == "active"
        member.save()
        return Response({"message": "Status updated", "status": status_value})

class RemoveOrgMemberAPI(APIView):
    def delete(self, request, user_id):
        try:
            member = User.objects.get(id=user_id, organization=request.user.organization_name)
        except User.DoesNotExist:
            return Response({"error": "Member not found"}, status=status.HTTP_404_NOT_FOUND)
        GroupMember.objects.filter(user=member).delete()
        member.delete()
        return Response({"message": "Member removed"})

# ---------------------------------------
# Update Document Read Status
# ---------------------------------------
class UpdateReadStatusAPI(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, document_id):
        user = request.user
        document = Document.objects.get(id=document_id)
        obj, created = DocumentReadStatus.objects.get_or_create(document=document, user=user)
        document.views += 1
        document.save()
        log_activity(user=user, group=document.group, document=document, action=f"'{user.full_name}' viewed the document.")
        return Response({
            "read_time_seconds": obj.read_time_seconds,
            "completed_count": document.completed_count,
            "is_completed": obj.is_completed,
            "avg_read_time": document.avg_read_time
        })

    def post(self, request, document_id):
        user = request.user
        document = Document.objects.get(id=document_id)
        read_time = int(request.data.get("read_time_seconds", 0))
        is_completed = request.data.get("is_completed", False)
        obj, created = DocumentReadStatus.objects.get_or_create(document=document, user=user)
        obj.read_time_seconds += read_time
        if is_completed and not obj.is_completed:
            obj.is_completed = True
            log_activity(user=user, group=document.group, document=document, action=f"'{user.full_name}' completed reading the document.")
        obj.save()
        document.readers = document.read_statuses.filter(read_time_seconds__gt=0).count()
        document.save()
        return Response({
            "message": "Read status updated",
            "readers": document.readers,
            "avg_read_time_seconds": document.read_statuses.aggregate(avg=Avg('read_time_seconds'))['avg'] or 0,
        })

# ---------------------------------------
# Document Engagement
# ---------------------------------------
class DocumentEngagementView(APIView):
    def get(self, request, document_id):
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        group_members = [gm.user for gm in document.group.memberships.all() if gm.status == 'active']
        read_statuses = DocumentReadStatus.objects.filter(document=document)
        read_status_map = {r.user_id: r for r in read_statuses}

        engagements_data = []
        for user in group_members:
            if user.id in read_status_map:
                obj = read_status_map[user.id]
                engagements_data.append(DocumentEngagementSerializer(obj).data)
            else:
                engagements_data.append({
                    "id": None,
                    "participantName": user.full_name,
                    "email": user.email,
                    "readDuration": "NA",
                    "isCompleted": "Pending",
                    "lastAccessed": "NA",
                })
        return Response({"engagements": engagements_data})

# ---------------------------------------
# Notifications
# ---------------------------------------
class UserNotificationsAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        notifs = Notification.objects.filter(user=user).order_by('-created_at')
        notif_list = [
            {
                "id": n.id,
                "title": n.get_type_display(),
                "message": n.message,
                "time": timesince(n.created_at) + " ago",
                "read": n.read,
            }
            for n in notifs
        ]
        unread_count = notifs.filter(read=False).count()
        return Response({"notifications": notif_list, "unread_count": unread_count})

class MarkNotificationReadAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, notif_id):
        try:
            notif = Notification.objects.get(id=notif_id, user=request.user)
            notif.read = True
            notif.save()
            return Response({"success": True})
        except Notification.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

# ---------------------------------------
# Admin Dashboard
# ---------------------------------------

class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # 1️⃣ Ensure only organization can access
        if not isinstance(user, Organization):
            return Response({"error": "Only organizations can access this dashboard"}, status=403)

        org = user  # safe to use as organization

        # 2️⃣ Use organization object directly for filters
        total_active_employees = User.objects.filter(organization=org, status="active").count()
        total_groups = Group.objects.filter(organization=org).count()
        total_documents = Document.objects.filter(group__organization=org).count()
        total_questions = AIQuestion.objects.filter(group__organization=org).count()

        today = timezone.now().date()
        questions_today = AIQuestion.objects.filter(group__organization=org, asked_at__date=today).count()
        last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]

        ai_qs = AIQuestion.objects.filter(
            group__organization=org, 
            asked_at__date__gte=last_7_days[0]
        ).values("asked_at__date").annotate(count=Count("id"))
        ai_usage_map = {q["asked_at__date"]: q["count"] for q in ai_qs}
        ai_usage_data = [{"date": day.strftime("%Y-%m-%d"), "count": ai_usage_map.get(day, 0)} for day in last_7_days]

        most_viewed_docs = Document.objects.filter(group__organization=org).order_by("-views").values("title", "views")[:3]
        confusing_docs = AIQuestion.objects.filter(group__organization=org).values("document__title").annotate(questions=Count("id")).order_by("-questions")[:3]
        most_confusing_documents = [{"title": d["document__title"], "questions": d["questions"]} for d in confusing_docs]

        return Response({
            "stats": {
                "total_employees": total_active_employees,
                "total_groups": total_groups,
                "total_documents": total_documents,
                "total_questions": total_questions,
                "questions_today": questions_today,
            },
            "ai_usage_over_time": ai_usage_data,
            "most_viewed_documents": list(most_viewed_docs),
            "most_confusing_documents": most_confusing_documents
        })
