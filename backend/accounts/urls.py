from django.urls import path
from . import views

urlpatterns = [
    path("register/organization/", views.OrganizationRegisterView.as_view()),
    path("register/user/", views.UserRegisterView.as_view()),
    path("organizations/", views.OrganizationListView.as_view()),
    path("login/", views.LoginView.as_view()), 
    path("user/profile/", views.UserProfileAPIView.as_view(), name="user-profile"),
    path("user/profile/update/", views.UserProfileUpdateAPIView.as_view(), name="user-profile-update"),
    path("user/dashboard/", views.UserDashboardAPIView.as_view(), name="user-dashboard"),
    path("org/profile/", views.OrganizationProfileAPIView.as_view(), name="org-profile")
]
