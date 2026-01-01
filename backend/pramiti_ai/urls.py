from django.urls import path
from . import views

urlpatterns = [
    path('documents/<int:document_id>/ask-ai/', views.AskAIQuestionAPIView.as_view(), name='ask-ai'),
    path("documents/<int:doc_id>/history/", views.DocumentHistoryView.as_view(), name="document-history"),
    path('documents/<int:doc_id>/note/', views.DocumentNoteView.as_view(), name='document-note'),
    path("documents/<int:document_id>/qa/", views.DocumentAIQuestionsView.as_view(), name="document-qa"),
    path("documents/<int:document_id>/topics/", views.DocumentTopicsView.as_view(), name="document-topics"),
]
