from django.urls import path
from . import views

urlpatterns = [
    # ---------------------------
    # Groups
    # ---------------------------
    path('groups/', views.GroupListCreate.as_view(), name='group-list-create'),
    path('user/groups/', views.UserGroupsList.as_view(), name='user-groups'),
    path('groups/join/', views.JoinGroupAPI.as_view(), name='group-join'),
    path("groups/<int:pk>/", views.GroupDetailAPIView.as_view(), name="group-detail-api"),
    path("groups/<int:pk>/archive/", views.GroupArchiveAPIView.as_view(), name="group-archive"),

    # Group members
    path("groups/<int:group_id>/members/", views.GroupMembersList.as_view(), name="group-members"),
    path("groups/<int:group_id>/members/<int:user_id>/status/", views.UpdateGroupMemberStatusAPI.as_view(), name="group-member-status"),
    path("groups/<int:group_id>/members/<int:user_id>/remove/", views.RemoveGroupMemberAPI.as_view(), name="remove-group-member"),

    # Organization members
    path("organization/members/", views.OrganizationMembersAPIView.as_view(), name='organization-members'),
    path("organization/members/<int:user_id>/status/", views.UpdateOrgMemberStatusAPI.as_view(), name="org-member-status"),
    path("organization/members/<int:user_id>/remove/", views.RemoveOrgMemberAPI.as_view(), name="remove-org-member"),

    # Group documents
    path("groups/<int:group_id>/documents/", views.GroupDocumentsList.as_view(), name="group-documents"),
    path("groups/<int:group_id>/documents/upload/", views.UploadDocumentAPI.as_view(), name="upload-document"),
    path("groups/<int:group_id>/documents/<int:doc_id>/delete/", views.DeleteDocumentAPI.as_view(), name="delete-document"),

    # Documents general
    path("documents/<int:pk>/", views.DocumentDetailAPI.as_view(), name="document-detail"),
    path('documents/<int:document_id>/read-status/', views.UpdateReadStatusAPI.as_view(), name='document-read-status'),
    path('documents/<int:document_id>/engagement/', views.DocumentEngagementView.as_view(), name='document-engagement'),
    path("documents/<int:doc_id>/activity/", views.DocumentActivityAPI.as_view(), name="doc-activity"),

    # Notifications
    path("notifications/user/", views.UserNotificationsAPI.as_view(), name="user_notifications"),
    path("notifications/read/<int:notif_id>/", views.MarkNotificationReadAPI.as_view(), name="mark_notification_read"),

    # Admin
    path("admin/dashboard/", views.AdminDashboardView.as_view(), name="admin-dashboard"),
]
