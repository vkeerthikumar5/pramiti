# accounts/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User, Organization

# accounts/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User, Organization

class UserOrgJWTAuthentication(JWTAuthentication):

    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")
        user_type = validated_token.get("user_type")

        if not user_type:
            raise AuthenticationFailed("Invalid token: user_type missing")

        if user_type == "organization":
            try:
                return Organization.objects.get(id=user_id)
            except Organization.DoesNotExist:
                raise AuthenticationFailed("Organization not found")

        if user_type == "user":
            try:
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise AuthenticationFailed("User not found")

        raise AuthenticationFailed("Invalid user type")
