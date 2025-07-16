# Frontend API Calls Audit

## From Previous Grep Results

### AIService (client/src/utils/aiService.ts)

- ✅ POST `/api/openai-chat` - Matches backend
- ✅ GET `/api/auth/me` - Matches backend
- ✅ POST `/api/quiz-attempts/:quizAttemptId/ai-content` - Matches backend
- ✅ GET `/api/quiz-attempts/:quizAttemptId/ai-content` - Matches backend

### Skills Analysis (client/src/utils/skillsAnalysis.ts)

- ✅ POST `/api/analyze-skills` - Matches backend

### Debug OpenAI (client/src/utils/debugOpenAI.ts)

- ✅ GET `/api/openai-status` - Matches backend
- ✅ POST `/api/openai-chat` - Matches backend

### Quiz Logic (client/src/utils/quizLogic.ts)

- ✅ POST `/api/ai-business-fit-analysis` - Matches backend

### Auth Context (client/src/contexts/AuthContext.tsx)

- ✅ GET `/api/auth/me` - Matches backend
- ✅ POST `/api/auth/login` - Matches backend
- ✅ POST `/api/auth/signup` - Matches backend
- ✅ POST `/api/auth/logout` - Matches backend
- ✅ DELETE `/api/auth/account` - Matches backend
- ✅ PUT `/api/auth/profile` - Matches backend
- ✅ GET `/api/auth/latest-quiz-data` - Matches backend

### Navigation Guard (client/src/hooks/useNavigationGuard.ts)

- ✅ GET `/api/auth/latest-paid-quiz-data` - Matches backend

### Payment Components

- ✅ POST `/api/create-paypal-payment` - Matches backend
- ✅ POST `/api/capture-paypal-payment` - Matches backend
- ✅ POST `/api/create-report-unlock-payment` - Matches backend

### Email Components

- ✅ POST `/api/email-results` - Matches backend

### Various Components

- ✅ POST `/api/generate-pdf` - Matches backend
- ✅ POST `/api/openai-chat` - Matches backend
- ✅ POST `/api/generate-business-avoid-descriptions` - Matches backend
- ✅ POST `/api/generate-business-fit-descriptions` - Matches backend
- ✅ POST `/api/generate-income-projections` - Matches backend
- ✅ POST `/api/auth/save-quiz-data` - Matches backend
- ✅ POST `/api/contact` - Matches backend
- ✅ POST `/api/auth/change-password` - Matches backend
- ✅ POST `/api/auth/reset-password` - Matches backend
- ✅ POST `/api/auth/forgot-password` - Matches backend
- ✅ POST `/api/auth/unsubscribe` - Matches backend

### Admin Components

- ✅ GET `/api/admin/payments` - Matches backend
- ✅ GET `/api/admin/refunds` - Matches backend
- ✅ POST `/api/admin/refund` - Matches backend

## Status: ✅ All Match

No route mismatches found! All frontend API calls match existing backend routes.
