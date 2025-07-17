import React, { useState, useEffect } from "react";
import { X, Mail, CheckCircle, Loader2 } from "lucide-react";
import { getSessionId } from "../../../shared/utils";
import { QuizData } from "../types";

interface EmailResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizData: QuizData;
  isPaidUser: boolean;
  userEmail?: string | null;
}

// DEPRECATED: This modal was removed because /api/email-results does not exist in the backend.
// If email results functionality is needed, use /api/send-quiz-results or another valid endpoint.

export default function EmailResultsModal() {
  return null;
}
