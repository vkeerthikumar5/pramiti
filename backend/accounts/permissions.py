# accounts/permissions.py
from rest_framework.permissions import BasePermission
from .models import User, Organization

class IsUser(BasePermission):
    """
    Allows access only to normal User accounts.
    """
    message = "Only normal users can access this resource"

    def has_permission(self, request, view):
        return isinstance(request.user, User)

class IsOrganization(BasePermission):
    """
    Allows access only to Organization accounts.
    """
    message = "Only organizations can access this resource"

    def has_permission(self, request, view):
        return isinstance(request.user, Organization)
