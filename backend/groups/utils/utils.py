from django.contrib.contenttypes.models import ContentType
from ..models import ActivityLog

def log_activity(user=None, group=None, document=None, action=""):
    if user:
        ActivityLog.objects.create(
            content_type=ContentType.objects.get_for_model(user),
            object_id=user.id,
            group=group,
            document=document,
            action=action
        )


from ..models import Notification

def create_notification(user, notif_type, message, group=None, document=None):
    """
    Create and save a notification in DB
    """
    Notification.objects.create(
        user=user,
        type=notif_type,
        message=message,
        group=group,
        document=document
    )
