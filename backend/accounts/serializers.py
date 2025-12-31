from rest_framework import serializers
from .models import User, Organization
from django.contrib.auth.hashers import make_password



class OrganizationRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = "__all__"
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def create(self, validated_data):
        raw_password = validated_data.get("password")
        validated_data["password"] = make_password(raw_password)
        return super().create(validated_data)


class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "full_name", "dob", "gender", "organization", "department",
            "employee_id", "designation", "email", "phone_number",
            "address", "password"
        ]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    


# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from .models import User, Organization

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        # 1️⃣ Try User login
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                return {
                    "role": "user",
                    "user_obj": user,
                    "is_active": user.is_active
                }
            else:
                raise serializers.ValidationError("Invalid credentials")
        except User.DoesNotExist:
            pass

        # 2️⃣ Try Organization login
        try:
            org = Organization.objects.get(email=email)
            if check_password(password, org.password):
                return {
                    "role": "admin",
                    "org_obj": org,
                    "is_active": True
                }
            else:
                raise serializers.ValidationError("Invalid credentials")
        except Organization.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials")

# accounts/serializers.py
from rest_framework import serializers
from .models import User

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "full_name",
            "dob",
            "gender",
            "organization",
            "department",
            "employee_id",
            "designation",
            "email",
            "phone_number",
            "address",
            
        ]

from rest_framework import serializers
from .models import Organization

class OrganizationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "email",
            "admin_name",
            "designation",
            "phone_number",
            "organization_name",
            "industry",
            "organization_size",
            "registration_id",
        ]
        read_only_fields = ["email", "registration_id"]
