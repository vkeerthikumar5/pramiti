# accounts/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User, Organization

class UserOrgJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication to allow both User and Organization login.
    """

    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")

        # Try to get User first
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            pass

        # Try to get Organization
        try:
            return Organization.objects.get(id=user_id)
        except Organization.DoesNotExist:
            raise AuthenticationFailed("User not found")
