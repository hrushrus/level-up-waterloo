# Security Questions Implementation

This document describes the security questions feature implemented in LevelUp Waterloo for account recovery.

## Overview

Security questions provide an alternative account recovery method when users forget their password. Users can set up 3 security questions and use them to verify their identity and reset their password without needing email access.

## Database Schema

The `users` table includes two new fields:

```sql
securityQuestionsSetup BOOLEAN DEFAULT false -- Flag indicating if user has set up security questions
securityQuestionAnswers TEXT -- JSON-encoded security question data with hashed answers
```

The `securityQuestionAnswers` field stores a JSON object with this structure:

```json
{
  "questions": [
    {
      "questionId": 0,
      "question": "What is the name of your first pet?",
      "answer": "$2b$10$..." // bcryptjs hashed answer
    }
  ],
  "setupDate": "2026-04-05T11:51:00.000Z"
}
```

## Predefined Questions

Located in `constants/security-questions.ts`, there are 20 predefined security questions users can choose from:

- What is the name of your first pet?
- What city were you born in?
- What is your mother's maiden name?
- What is the name of your elementary school?
- What was the make of your first car?
- What is your favorite book?
- What is the name of your best friend in high school?
- What is your favorite movie?
- What street did you live on in third grade?
- What is your favorite food?
- What is the name of your first employer?
- What is your favorite sports team?
- In what city or town did your mother and father meet?
- What is your favorite song?
- What is the name of your favorite teacher?
- What is your favorite color?
- What is the name of your first crush?
- What is your favorite restaurant?
- What is the name of your childhood best friend?
- What is your favorite hobby?

## Backend Implementation

### Auth Service Functions

Located in `server/services/auth-service.ts`:

#### `setSecurityQuestions(userId, questions)`
Sets up 3 security questions for a user. Hashes all answers using bcryptjs before storing.

**Parameters:**
- `userId` (number): User ID
- `questions` (array): Array of 3 objects with `questionId`, `question`, and `answer`

**Throws:** Error if not exactly 3 questions provided

#### `verifySecurityQuestions(email, answers)`
Verifies security question answers for account recovery. All 3 answers must be correct.

**Parameters:**
- `email` (string): User email
- `answers` (array): Array of 3 objects with `questionId` and `answer`

**Returns:** User object if verification succeeds

**Throws:** Error if email not found, questions not set up, or answers incorrect

#### `getSecurityQuestions(email)`
Retrieves security questions for a user (without answers).

**Parameters:**
- `email` (string): User email

**Returns:** Array of objects with `questionId` and `question`

#### `hasSecurityQuestions(email)`
Checks if user has security questions set up.

**Parameters:**
- `email` (string): User email

**Returns:** Boolean indicating if security questions are set up

### tRPC Procedures

Located in `server/routers/auth.ts`:

#### `auth.setSecurityQuestions` (Mutation)
**Input:** `{ questions: Array<{ questionId, question, answer }> }`
**Output:** `{ success: boolean, message: string }`
**Authentication:** Required (authenticated users only)

#### `auth.verifySecurityQuestions` (Mutation)
**Input:** `{ email: string, answers: Array<{ questionId, answer }> }`
**Output:** `{ success: boolean, user: User, message: string }`
**Authentication:** Public (auto-logs user in on success)

#### `auth.getSecurityQuestions` (Query)
**Input:** `{ email: string }`
**Output:** `{ success: boolean, questions: Array<{ questionId, question }> }`
**Authentication:** Public

#### `auth.hasSecurityQuestions` (Query)
**Input:** `{ email: string }`
**Output:** `{ success: boolean, hasSecurityQuestions: boolean }`
**Authentication:** Public

## Frontend Implementation

### Screens

#### Security Questions Setup (`app/(tabs)/security-questions.tsx`)
Allows authenticated users to set up their security questions.

**Features:**
- Two-step process: Select questions → Answer questions
- Question selection with remove/change options
- Answer input with validation
- Success confirmation screen
- Tips and best practices

**Navigation:** Accessible from profile/settings screen

#### Security Questions Verification (`app/(auth)/verify-security-questions.tsx`)
Allows users to recover their account using security questions.

**Features:**
- Email input to load questions
- Question display (questions only, no answers)
- Answer input for all 3 questions
- Auto-login on successful verification
- Error handling and validation

**Navigation:** Accessible from forgot password screen

### Auth Context Methods

Located in `lib/auth-context.tsx`:

```typescript
setSecurityQuestions(questions: Array<{
  questionId: number;
  question: string;
  answer: string;
}>) => Promise<void>

verifySecurityQuestions(email: string, answers: Array<{
  questionId: number;
  answer: string;
}>) => Promise<void>

getSecurityQuestions(email: string) => Promise<Array<{
  questionId: number;
  question: string;
}>>

hasSecurityQuestions(email: string) => Promise<boolean>
```

### Navigation Flow

**Setup Flow:**
1. User navigates to security questions screen (from profile)
2. Selects 3 questions from available options
3. Enters answers to selected questions
4. Saves security questions
5. Receives success confirmation

**Recovery Flow:**
1. User clicks "Forgot password?" on login screen
2. Enters email address
3. Clicks "Use Security Questions" button
4. System loads their 3 security questions
5. User answers all 3 questions
6. System verifies answers
7. User is auto-logged in on success
8. Redirected to home screen

## Security Considerations

1. **Answer Hashing:** All answers are hashed using bcryptjs (10 salt rounds) before storage
2. **Case Insensitivity:** Answers are normalized to lowercase before hashing/verification
3. **Whitespace Trimming:** Leading/trailing whitespace is removed from answers
4. **All-or-Nothing Verification:** All 3 answers must be correct; partial credit not allowed
5. **No Hints:** System doesn't reveal which answer is incorrect
6. **Auto-Login:** User is automatically logged in after successful verification for better UX
7. **Secure Storage:** Hashed answers stored in encrypted JSON format in database

## User Flow Example

### Setting Up Security Questions

```
Profile Screen
  ↓
Security Questions Setup Screen
  ↓
Select 3 Questions (e.g., "First pet", "Birth city", "Favorite book")
  ↓
Enter Answers
  ↓
Save Security Questions
  ↓
Success Confirmation
```

### Using Security Questions for Recovery

```
Login Screen
  ↓
Forgot Password?
  ↓
Enter Email
  ↓
Use Security Questions (Alternative)
  ↓
Load Questions
  ↓
Answer 3 Questions
  ↓
Verify & Login
  ↓
Auto-Login to Home
```

## Testing the Feature

### Manual Testing

1. **Setup:**
   - Go to profile/settings
   - Click "Security Questions"
   - Select 3 questions
   - Enter answers
   - Save and verify success

2. **Recovery:**
   - Logout
   - Go to login
   - Click "Forgot password?"
   - Enter email
   - Click "Use Security Questions"
   - Enter answers
   - Verify auto-login

### Edge Cases to Test

- Selecting duplicate questions (should be prevented)
- Entering empty answers (should show validation error)
- Entering incorrect answers (should show error)
- Case sensitivity (answers should be case-insensitive)
- Whitespace handling (extra spaces should be trimmed)
- Multiple recovery attempts (should work each time)

## Future Enhancements

1. **Rate Limiting** — Limit verification attempts to prevent brute force
2. **Account Lockout** — Lock account after X failed attempts
3. **Audit Logging** — Log all security question setup/verification attempts
4. **Backup Codes** — Generate one-time backup codes for account recovery
5. **SMS Verification** — Send verification code via SMS as additional option
6. **Biometric Recovery** — Use fingerprint/face ID for recovery on mobile
7. **Recovery Email** — Send recovery email when security questions are used
8. **Question Rotation** — Require periodic security question updates
9. **Custom Questions** — Allow users to create custom security questions
10. **Multi-Factor Recovery** — Combine security questions with email/SMS verification

## Troubleshooting

### Questions Not Loading
- Verify email address is correct
- Check that user account exists
- Ensure security questions have been set up for the account

### Answers Not Matching
- Answers are case-insensitive (lowercase)
- Extra spaces are trimmed automatically
- Check for typos or spelling differences
- Answers must match exactly (no partial credit)

### Auto-Login Not Working
- Check browser console for errors
- Verify session cookie is being set
- Clear browser cache and try again
- Check network tab for failed API calls

## API Integration

All security questions functionality is exposed through tRPC endpoints:

- `POST /api/trpc/auth.setSecurityQuestions`
- `POST /api/trpc/auth.verifySecurityQuestions`
- `GET /api/trpc/auth.getSecurityQuestions`
- `GET /api/trpc/auth.hasSecurityQuestions`

## Constants

Security questions constants are defined in `constants/security-questions.ts` and can be easily extended or customized.
