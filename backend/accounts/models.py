from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager,  Permission

from groups.models import Group
class UserManager(BaseUserManager):
    def create_user(self, email, password=None):
        if not email:
            raise ValueError("Email is required")
        user = self.model(email=self.normalize_email(email))
        user.set_password(password)
        user.save()
        return user


class User(AbstractBaseUser, PermissionsMixin):
    full_name = models.CharField(max_length=100, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, blank=True)

    organization = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    employee_id = models.CharField(max_length=50, blank=True)
    designation = models.CharField(max_length=100, blank=True)

    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20)
    address = models.TextField(blank=True)

    STATUS_CHOICES = [
    ("pending", "Pending"),
    ("active", "Active"),
    ("suspended", "Suspended"),
]

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending"
    )
    is_active = models.BooleanField(default=False)  # keep for auth only

    is_staff = models.BooleanField(default=False)

    groups = models.ManyToManyField(
        Group,
        blank=True,
        related_name='user_users_groups'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        blank=True,
        related_name='user_users_permissions'
    )
    
    objects = UserManager()
    USERNAME_FIELD = "email"
    
    def __str__(self):
        return self.email


from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class OrganizationManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        org = self.model(email=email, **extra_fields)
        if password:
            org.set_password(password)
        org.save()
        return org

class Organization(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    admin_name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)

    organization_name = models.CharField(max_length=200)
    industry = models.CharField(max_length=100)
    organization_size = models.IntegerField()
    registration_id = models.CharField(max_length=100)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = OrganizationManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["organization_name", "admin_name"]

    def __str__(self):
        return self.organization_name
