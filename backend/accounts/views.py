# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Organization
from .serializers import (
    LoginSerializer,
    UserRegisterSerializer,
    OrganizationRegisterSerializer,
    UserProfileSerializer,
    OrganizationProfileSerializer,
)
from groups.models import GroupMember, DocumentReadStatus, Document


# ---------------------------
# Organization Registration & User Registration
# ---------------------------
class OrganizationRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrganizationRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Organization registered successfully"}, status=201)
        return Response(serializer.errors, status=400)


class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=201)
        return Response(serializer.errors, status=400)


class OrganizationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        orgs = Organization.objects.all()
        serializer = OrganizationRegisterSerializer(orgs, many=True)
        return Response(serializer.data)


# ---------------------------
# Login
# ---------------------------
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            role = data["role"]

            # Generate JWT tokens for both User and Organization
            if role == "user":
                user = data["user_obj"]
                refresh = RefreshToken.for_user(user)
            else:  # organization
                org = data["org_obj"]
                refresh = RefreshToken.for_user(org)

            access = str(refresh.access_token)
            refresh_token = str(refresh)

            return Response({
                "role": role,
                "is_active": data.get("is_active", True),
                "access": access,
                "refresh": refresh_token
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------
# User Profile
# ---------------------------
class UserProfileAPIView(APIView):

    def get(self, request):
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)


class UserProfileUpdateAPIView(APIView):

    def put(self, request):
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------
# User Dashboard
# ---------------------------
class UserDashboardAPIView(APIView):

    def get(self, request):
        user = request.user

        # 1. User name
        name = user.full_name or user.email.split("@")[0]

        # 2. Active groups joined
        active_memberships = GroupMember.objects.filter(user=user, status='active')
        groups_joined_count = active_memberships.count()
        group_names = list(active_memberships.values_list("group__name", flat=True))

        # 3. All documents in joined active groups
        all_docs = Document.objects.filter(
            group__memberships__user=user,
            group__memberships__status='active'
        ).distinct()
        total_docs_count = all_docs.count()

        # 4. Read status entries for user
        read_status_qs = DocumentReadStatus.objects.filter(
            user=user,
            document__in=all_docs
        )
        docs_started_count = read_status_qs.count()

        # 5. Completed documents
        completed_docs_count = read_status_qs.filter(is_completed=True).count()

        # 6. Started but NOT completed
        started_not_completed_count = read_status_qs.filter(is_completed=False).count()

        # 7. Not yet started documents
        not_started_docs_count = total_docs_count - docs_started_count

        # 8. Completion percentage
        completion_percent = (
            (completed_docs_count * 100) // total_docs_count
            if total_docs_count > 0 else 0
        )

        # 9. Started but not completed docs info
        not_completed_docs = read_status_qs.filter(is_completed=False)\
            .select_related('document', 'document__group')

        not_completed_info = [
            {
                "document": nd.document.title,
                "group": nd.document.group.name,
                "file_url": request.build_absolute_uri(nd.document.file.url)
                    if nd.document.file else None,
                "document_id": nd.document.id,
                "group_id": nd.document.group.id,
            }
            for nd in not_completed_docs
        ]

        print("Started but not completed docs:", not_completed_info)

        return Response({
            "name": name,
            "groups_joined_count": groups_joined_count,
            "group_names": group_names,
            "total_documents_count": total_docs_count,
            "documents_completed_count": completed_docs_count,
            "started_not_completed_count": started_not_completed_count,
            "not_started_documents_count": not_started_docs_count,
            "completion_percent": completion_percent,
            "not_completed_docs": not_completed_info
        })


# ---------------------------
# Organization Profile
# ---------------------------
class OrganizationProfileAPIView(APIView):

    def get(self, request):
        org = request.user
        serializer = OrganizationProfileSerializer(org)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        org = request.user
        serializer = OrganizationProfileSerializer(org, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Profile updated successfully", "data": serializer.data},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
