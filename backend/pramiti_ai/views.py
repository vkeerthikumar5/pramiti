# pramiti_ai/views.py
import os
import time
from dotenv import load_dotenv
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated

import google.generativeai as genai

from .models import AIQuestion, DocumentNote
from .serializers import AIQuestionSerializer, DocumentNoteSerializer, ActivityLogSerializer
from accounts.authentication import UserOrgJWTAuthentication
from groups.models import Document, Group
from pramiti_ai.utils.pdf import extract_text_from_pdf

# Load .env
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("❌ GEMINI_API_KEY not found in .env file")

# Configure Gemini AI
genai.configure(api_key=GEMINI_API_KEY)


# ---------------------------
# Ask AI Question
# ---------------------------
class AskAIQuestionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, document_id):
        question_text = request.data.get("question")
        group_id = request.data.get("group_id")
        if not group_id:
            return Response({"error": "group_id is required"}, status=400)

        document = get_object_or_404(Document, id=document_id)
        group = get_object_or_404(Group, id=group_id)

        ai_question = AIQuestion.objects.create(
            user=request.user,
            document=document,
            group=group,
            question=question_text,
            status="answered"  # temporary
        )

        start_time = time.time()
        try:
            # Extract document text once
            if not document.content:
                document.content = extract_text_from_pdf(document.file.path)
                document.save()

            document_text = document.content
            if not document_text:
                return Response(
                    {"error": "This document is scanned or unreadable. AI cannot process it."},
                    status=400
                )

            # Gemini AI model
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"""
You are an AI assistant.

Use the document below to answer the question.

Rules:
- Answer clearly
- Give a SHORT topic (1–3 words)
- No markdown
- No bullets
- Plain text only

Return STRICTLY in this format:

ANSWER:
<answer here>

TOPIC:
<topic here>

Document:
{document_text}

Question:
{question_text}
"""
            response = model.generate_content(prompt)
            raw_text = response.text.strip()

            if "TOPIC:" in raw_text:
                answer_text = raw_text.split("TOPIC:")[0].replace("ANSWER:", "").strip()
                topic_text = raw_text.split("TOPIC:")[1].strip()
            else:
                answer_text = raw_text
                topic_text = "General"

            end_time = time.time()

            # Update AIQuestion record
            ai_question.answer = answer_text
            ai_question.topic = topic_text
            ai_question.tokens_used = None
            ai_question.response_time_ms = int((end_time - start_time) * 1000)
            ai_question.status = "answered"
            ai_question.answered_at = timezone.now()
            ai_question.save()

            serializer = AIQuestionSerializer(ai_question)
            return Response(serializer.data)

        except Exception as e:
            ai_question.status = "failed"
            ai_question.save()
            return Response({"error": str(e)}, status=500)


# ---------------------------
# Document AI Questions History
# ---------------------------
class DocumentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, doc_id):
        user = request.user
        history = AIQuestion.objects.filter(document_id=doc_id, user=user).order_by("-asked_at")
        data = [{"question": h.question, "answer": h.answer} for h in history]
        return Response(data)


# ---------------------------
# Document Notes
# ---------------------------
class DocumentNoteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, doc_id):
        note, _ = DocumentNote.objects.get_or_create(user=request.user, document_id=doc_id)
        serializer = DocumentNoteSerializer(note)
        return Response(serializer.data)

    def post(self, request, doc_id):
        note, _ = DocumentNote.objects.get_or_create(user=request.user, document_id=doc_id)
        note.content = request.data.get("content", "")
        note.save()
        serializer = DocumentNoteSerializer(note)
        return Response(serializer.data)


# ---------------------------
# Document AI Questions List
# ---------------------------
class DocumentAIQuestionsView(APIView):
    authentication_classes = [UserOrgJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, document_id):
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        questions = AIQuestion.objects.filter(document=document).order_by('-asked_at')
        serializer = AIQuestionSerializer(questions, many=True)

        qa_list = [
            {
                "id": q["id"],
                "user_name": q.get("user_name") or "Anonymous",
                "q": q["question"],
                "a": q["answer"],
                "ts": q["asked_at"][:16] if q["asked_at"] else "NA",
                "status": q["status"],
            }
            for q in serializer.data
        ]
        return Response({"questions": qa_list})


# ---------------------------
# Document Topics Aggregation
# ---------------------------
class DocumentTopicsView(APIView):
    authentication_classes = [UserOrgJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, document_id):
        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        topics = (
            AIQuestion.objects
            .filter(document=document)
            .values("topic")
            .annotate(question_count=Count("id"))
            .order_by("-question_count")
        )
        return Response({"topics": list(topics)})
