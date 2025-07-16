# Route Audit: Backend vs Frontend

## ✅ MATCHING ROUTES

### Authentication Routes

| Frontend Call                         | Backend Route                                | Status   |
| ------------------------------------- | -------------------------------------------- | -------- |
| `POST /api/auth/login`                | `app.post("/api/auth/login")`                | ✅ MATCH |
| `POST /api/auth/signup`               | `app.post("/api/auth/signup")`               | ✅ MATCH |
| `POST /api/auth/logout`               | `app.post("/api/auth/logout")`               | ✅ MATCH |
| `GET /api/auth/me`                    | `app.get("/api/auth/me")`                    | ✅ MATCH |
| `DELETE /api/auth/account`            | `app.delete("/api/auth/account")`            | ✅ MATCH |
| `PUT /api/auth/profile`               | `app.put("/api/auth/profile")`               | ✅ MATCH |
| `POST /api/auth/forgot-password`      | `app.post("/api/auth/forgot-password")`      | ✅ MATCH |
| `POST /api/auth/reset-password`       | `app.post("/api/auth/reset-password")`       | ✅ MATCH |
| `POST /api/auth/change-password`      | `app.post("/api/auth/change-password")`      | ✅ MATCH |
| `POST /api/auth/unsubscribe`          | `app.post("/api/auth/unsubscribe")`          | ✅ MATCH |
| `GET /api/auth/latest-quiz-data`      | `app.get("/api/auth/latest-quiz-data")`      | ✅ MATCH |
| `POST /api/auth/save-quiz-data`       | `app.post("/api/auth/save-quiz-data")`       | ✅ MATCH |
| `GET /api/auth/latest-paid-quiz-data` | `app.get("/api/auth/latest-paid-quiz-data")` | ✅ MATCH |

### Quiz & Data Routes

| Frontend Call                                       | Backend Route                                              | Status   |
| --------------------------------------------------- | ---------------------------------------------------------- | -------- |
| `POST /api/save-quiz-data`                          | `app.post("/api/save-quiz-data")`                          | ✅ MATCH |
| `POST /api/quiz-attempts/:quizAttemptId/ai-content` | `app.post("/api/quiz-attempts/:quizAttemptId/ai-content")` | ✅ MATCH |
| `GET /api/quiz-attempts/:quizAttemptId/ai-content`  | `app.get("/api/quiz-attempts/:quizAttemptId/ai-content")`  | ✅ MATCH |

### AI & OpenAI Routes

| Frontend Call                                    | Backend Route                                           | Status   |
| ------------------------------------------------ | ------------------------------------------------------- | -------- |
| `GET /api/openai-status`                         | `app.get("/api/openai-status")`                         | ✅ MATCH |
| `POST /api/openai-chat`                          | `app.post("/api/openai-chat")`                          | ✅ MATCH |
| `POST /api/analyze-skills`                       | `app.post("/api/analyze-skills")`                       | ✅ MATCH |
| `POST /api/ai-business-fit-analysis`             | `app.post("/api/ai-business-fit-analysis")`             | ✅ MATCH |
| `POST /api/generate-business-fit-descriptions`   | `app.post("/api/generate-business-fit-descriptions")`   | ✅ MATCH |
| `POST /api/generate-business-avoid-descriptions` | `app.post("/api/generate-business-avoid-descriptions")` | ✅ MATCH |
| `POST /api/generate-income-projections`          | `app.post("/api/generate-income-projections")`          | ✅ MATCH |

### Payment Routes

| Frontend Call                            | Backend Route                                   | Status   |
| ---------------------------------------- | ----------------------------------------------- | -------- |
| `POST /api/create-report-unlock-payment` | `app.post("/api/create-report-unlock-payment")` | ✅ MATCH |
| `POST /api/create-paypal-payment`        | `app.post("/api/create-paypal-payment")`        | ✅ MATCH |
| `POST /api/capture-paypal-payment`       | `app.post("/api/capture-paypal-payment")`       | ✅ MATCH |

### Email Routes

| Frontend Call             | Backend Route                    | Status   |
| ------------------------- | -------------------------------- | -------- |
| `POST /api/email-results` | `app.post("/api/email-results")` | ✅ MATCH |
| `POST /api/contact`       | `app.post("/api/contact")`       | ✅ MATCH |

### Utility Routes

| Frontend Call            | Backend Route                   | Status   |
| ------------------------ | ------------------------------- | -------- |
| `POST /api/generate-pdf` | `app.post("/api/generate-pdf")` | ✅ MATCH |

---

## ❌ MISMATCHED/MISSING ROUTES

### Frontend calls routes that DON'T exist in backend:

| Frontend Call                            | Status           | Issue                                  |
| ---------------------------------------- | ---------------- | -------------------------------------- |
| `POST /api/create-quiz-payment`          | ❌ MISSING       | Called in QuizPaymentRequired.tsx      |
| `POST /api/create-access-pass-payment`   | ❌ MISSING       | Called in StripePaymentForm.tsx        |
| `POST /api/create-retake-bundle-payment` | ❌ MISSING       | Called in QuizRetakeModal.tsx          |
| `GET /api/quiz-attempts/5`               | ❌ WRONG PATTERN | Should be `/api/quiz-attempts/:userId` |

### Backend routes that are NEVER called from frontend:

| Backend Route                                          | Status    | Issue                   |
| ------------------------------------------------------ | --------- | ----------------------- |
| `GET /api/quiz-retake-status/:userId`                  | ❌ UNUSED | Legacy retake system    |
| `POST /api/quiz-attempt`                               | ❌ UNUSED | Legacy quiz attempt     |
| `GET /api/quiz-attempts/:userId`                       | ❌ UNUSED | User history endpoint   |
| `GET /api/report-unlock-status/:userId/:quizAttemptId` | ❌ UNUSED | Report unlock check     |
| `GET /api/user-pricing/:userId`                        | ❌ UNUSED | Pricing endpoint        |
| `GET /api/payment-history/:userId`                     | ❌ UNUSED | Payment history         |
| `GET /api/business-resources/:businessModel`           | ❌ UNUSED | Business resources      |
| `POST /api/ai-personality-analysis`                    | ❌ UNUSED | AI personality endpoint |
| `POST /api/send-quiz-results`                          | ❌ UNUSED | Legacy email endpoint   |
| `POST /api/send-welcome-email`                         | ❌ UNUSED | Welcome email           |
| `POST /api/send-full-report`                           | ❌ UNUSED | Full report email       |

---

## 🔧 PRIORITY FIXES NEEDED

### HIGH PRIORITY (Breaking functionality):

1. **`POST /api/create-quiz-payment`** - Called in QuizPaymentRequired.tsx but doesn't exist
2. **`POST /api/create-access-pass-payment`** - Called in StripePaymentForm.tsx but doesn't exist
3. **`POST /api/create-retake-bundle-payment`** - Called in QuizRetakeModal.tsx but doesn't exist

### MEDIUM PRIORITY (Dead code cleanup):

1. Remove unused backend routes for retake system
2. Remove unused frontend components calling missing routes
3. Implement missing `useReportUnlock` hook properly

### LOW PRIORITY (Optimization):

1. Remove legacy authentication debug endpoints
2. Clean up unused AI analysis endpoints
