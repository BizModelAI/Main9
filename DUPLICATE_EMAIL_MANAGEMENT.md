# Duplicate Email Management System

## Overview

This document outlines the comprehensive duplicate email management system implemented to handle cases where users take the quiz multiple times with the same email address.

## Problem Statement

When users take the quiz and have results sent to their email, the results are stored in the database. If they take the quiz again and input the same email, we need to handle this gracefully to:

1. Prevent duplicate accounts
2. Avoid spam emails
3. Provide clear user feedback
4. Maintain data integrity
5. Guide users to appropriate actions

## Current Implementation

### 1. Email Rate Limiting

**Location**: `server/services/emailService.ts`

- **Cooldown Period**: 1 minute between emails to the same address
- **Hourly Limit**: Maximum 5 emails per hour per email address
- **Automatic Cleanup**: Old cache entries are automatically removed

```typescript
private readonly EMAIL_COOLDOWN = 60 * 1000; // 1 minute
private readonly MAX_EMAILS_PER_HOUR = 5;
```

### 2. Database-Level Duplicate Prevention

**Location**: `server/routes.ts` - `/api/save-quiz-data`

The system checks for ALL existing users before creating new ones:

1. **Any Existing User**: If any account (paid or temporary) exists with the email, use that account
2. **Paid Users**: If a paid account exists, prevent creation and suggest login
3. **Temporary Users**: If a temporary account exists, create a new quiz attempt while preserving existing ones
4. **Anonymous Users**: No database storage, localStorage only

### 3. Existing Account Detection

**Location**: `server/routes.ts` - `/api/check-existing-attempts/:email`

New endpoint to check for existing accounts:

```typescript
GET /api/check-existing-attempts/:email
```

Returns:
- `hasAccount`: boolean
- `userType`: "paid" | "temporary" | "new"
- `attemptsCount`: number of previous attempts
- `latestAttempt`: most recent quiz attempt
- `message`: user-friendly message

### 4. Enhanced Frontend Components

#### EmailResultsModal (`client/src/components/EmailResultsModal.tsx`)

- Checks for existing accounts before sending emails
- Shows warnings for temporary accounts with previous attempts
- Prevents sending to paid accounts (suggests login instead)
- Better error handling and user feedback

#### CongratulationsGuest (`client/src/components/CongratulationsGuest.tsx`)

- Validates existing accounts before saving quiz data
- Prevents duplicate temporary accounts
- Clear error messages for paid account conflicts

## User Experience Flow

### Scenario 1: New Email Address
1. User enters email for the first time
2. System creates new temporary account
3. Quiz data saved for 3 months
4. Email sent successfully

### Scenario 2: Existing Temporary Account
1. User enters email that has a temporary account
2. System detects existing account
3. Shows warning: "You have X previous quiz attempts with this email"
4. Creates new quiz attempt while preserving existing ones
5. Email sent successfully

### Scenario 3: Existing Paid Account
1. User enters email that has a paid account
2. System detects paid account
3. Shows error: "You already have a paid account. Please log in."
4. Prevents duplicate account creation
5. Guides user to login

### Scenario 4: Rate Limited Email
1. User tries to send email too frequently
2. System enforces 1-minute cooldown
3. Shows error: "Please wait before sending another email"
4. Prevents email spam

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  is_temporary BOOLEAN DEFAULT FALSE,
  session_id TEXT,
  temp_quiz_data JSONB,
  expires_at TIMESTAMP,
  -- ... other fields
);
```

### Quiz Attempts Table
```sql
CREATE TABLE quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  quiz_data JSONB NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  -- ... other fields
);
```

## Key Features

### 1. Three-Tier Storage System
- **Tier 1**: Authenticated paid users - permanent storage
- **Tier 2**: Email-provided users - 3-month temporary storage with multiple quiz attempts
- **Tier 3**: Anonymous users - localStorage only

### 2. Automatic Data Cleanup
- Temporary accounts expire after 3 months
- Expired data is automatically removed
- Manual cleanup endpoint available

### 3. Session Management
- Temporary users are tied to session IDs
- Session updates when users return
- Prevents orphaned accounts
- Multiple quiz attempts are preserved per user

### 4. Email Deduplication
- Rate limiting prevents spam
- Cooldown periods between emails
- Hourly limits per email address

## API Endpoints

### Save Quiz Data
```
POST /api/save-quiz-data
Body: { quizData, email?, paymentId? }
```

### Check Existing Attempts
```
GET /api/check-existing-attempts/:email
```

### Send Quiz Results
```
POST /api/send-quiz-results
Body: { email, quizData, attemptId? }
```

## Error Handling

### Common Error Scenarios

1. **Existing Paid Account**
   - Error: "You already have a paid account. Please log in."
   - Action: Redirect to login page

2. **Rate Limited**
   - Error: "Please wait before sending another email."
   - Action: Show cooldown timer

3. **Invalid Email**
   - Error: "Please enter a valid email address."
   - Action: Highlight input field

4. **Database Error**
   - Error: "Failed to save your data. Please try again."
   - Action: Retry button

## Monitoring and Analytics

### Logging
- All duplicate email attempts are logged
- Rate limit violations are tracked
- Account creation/updates are monitored

### Metrics to Track
- Duplicate email attempts per day
- Rate limit violations
- Account conversion rates
- Email delivery success rates

## Future Enhancements

### 1. Email Verification
- Send verification emails before saving data
- Prevent fake email addresses

### 2. Account Merging
- Allow users to merge temporary accounts
- Convert temporary to paid accounts

### 3. Advanced Rate Limiting
- IP-based rate limiting
- Device fingerprinting
- Machine learning spam detection

### 4. User Preferences
- Email frequency preferences
- Unsubscribe options
- Communication preferences

## Testing

### Test Cases

1. **New Email**: Should create temporary account
2. **Existing Temporary**: Should create new quiz attempt while preserving existing ones
3. **Existing Paid**: Should prevent creation and suggest login
4. **Rate Limited**: Should enforce cooldown period
5. **Invalid Email**: Should show validation error
6. **Database Error**: Should show retry option

### Manual Testing Commands

```bash
# Test rate limiting
curl -X POST http://localhost:5073/api/send-quiz-results \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","quizData":{}}'

# Check existing attempts
curl http://localhost:5073/api/check-existing-attempts/test@example.com

# Save quiz data
curl -X POST http://localhost:5073/api/save-quiz-data \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","quizData":{}}'
```

## Conclusion

This duplicate email management system provides:

- **Robust duplicate prevention** at multiple levels
- **Clear user feedback** for all scenarios
- **Rate limiting** to prevent abuse
- **Data integrity** through proper account management
- **Scalable architecture** for future enhancements

The system ensures users have a smooth experience while preventing data duplication and email spam. 