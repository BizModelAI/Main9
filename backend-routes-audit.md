# Backend Routes Audit

## Auth Routes (server/auth.ts)

- GET `/api/auth/cookie-test` - Cookie testing
- GET `/api/auth/session-debug` - Session debug info
- POST `/api/auth/session-test` - Session testing
- GET `/api/auth/session-test` - Session testing
- GET `/api/auth/me` - Get current user session
- POST `/api/auth/login` - User login
- POST `/api/auth/signup` - User signup
- POST `/api/auth/logout` - User logout
- PUT `/api/auth/profile` - Update user profile
- DELETE `/api/auth/account` - Delete user account
- POST `/api/auth/forgot-password` - Forgot password
- GET `/api/auth/verify-reset-token/:token` - Verify reset token
- POST `/api/auth/unsubscribe` - Unsubscribe from emails
- POST `/api/auth/reset-password` - Reset password
- POST `/api/auth/change-password` - Change password
- POST `/api/contact` - Contact form

## Main Routes (server/routes.ts)

### OpenAI/AI Routes

- GET `/api/openai-status` - Check OpenAI config
- POST `/api/openai-chat` - General OpenAI chat
- POST `/api/analyze-skills` - Skills analysis
- POST `/api/ai-business-fit-analysis` - Business fit scoring
- POST `/api/ai-personality-analysis` - Personality analysis
- POST `/api/generate-income-projections` - Income projections

### Quiz Routes

- GET `/api/quiz-retake-status/:userId` - Quiz retake status
- POST `/api/quiz-attempt` - Create quiz attempt
- GET `/api/quiz-attempts/:userId` - Get user quiz attempts
- POST `/api/quiz-attempts/:quizAttemptId/ai-content` - Save AI content
- GET `/api/quiz-attempts/:quizAttemptId/ai-content` - Get AI content
- GET `/api/auth/latest-quiz-data` - Get latest quiz data
- GET `/api/auth/latest-paid-quiz-data` - Get latest paid quiz data
- POST `/api/auth/save-quiz-data` - Save quiz data

### Payment Routes

- GET `/api/user-pricing/:userId` - Get user pricing
- POST `/api/create-report-unlock-payment` - Create report unlock payment
- GET `/api/report-unlock-status/:userId/:quizAttemptId` - Check report unlock status
- POST `/api/create-paypal-payment` - Create PayPal payment
- POST `/api/capture-paypal-payment` - Capture PayPal payment
- GET `/api/payment-history/:userId` - Get payment history
- POST `/api/stripe/webhook` - Stripe webhook

### Business/Content Routes

- GET `/api/business-resources/:businessModel` - Get business resources
- POST `/api/generate-pdf` - Generate PDF
- POST `/api/generate-business-fit-descriptions` - Generate fit descriptions
- POST `/api/generate-business-avoid-descriptions` - Generate avoid descriptions

### Email Routes

- POST `/api/send-quiz-results` - Send quiz results email
- POST `/api/send-welcome-email` - Send welcome email
- POST `/api/send-full-report` - Send full report email
- POST `/api/email-results` - Enhanced email functionality
- GET `/api/get-stored-email/:sessionId` - Get stored email
- POST `/api/test-email` - Test email

### Admin Routes

- GET `/api/admin/payments` - Get all payments (admin)
- POST `/api/admin/refund` - Process refund (admin)
- GET `/api/admin/refunds` - Get all refunds (admin)
- GET `/api/admin/all-emails` - Get all emails (admin)
- GET `/api/admin/emails-csv` - Export emails CSV (admin)
- POST `/api/admin/cleanup-expired-data` - Data cleanup (admin)

### Data/Status Routes

- GET `/api/auth/data-retention-status` - Get data retention status
- POST `/api/test-retake-flow` - Test retake flow (debug)

## Status: ✅ Complete

Total Routes: 46
