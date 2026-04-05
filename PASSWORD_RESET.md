# Password Reset Flow Implementation

This document describes the password reset flow implemented in LevelUp Waterloo.

## Overview

The password reset system allows users to securely reset their password through a token-based email verification process. Users request a password reset, receive a secure link via email, and can set a new password without needing their current password.

## Database Schema

The `users` table includes two new fields for password reset:

```sql
passwordResetToken VARCHAR(255) -- Secure token for password reset
passwordResetTokenExpiresAt TIMESTAMP -- Token expiration time (1 hour)
```

## Backend Implementation

### Auth Service Functions

Located in `server/services/auth-service.ts`:

#### `generatePasswordResetToken()`
Generates a 32-character random token using alphanumeric characters.

#### `sendPasswordResetEmail(email, resetToken, userName)`
Sends a password reset email to the user. Currently logs the token to console for development.

**TODO:** Integrate with email service (SendGrid, Resend, etc.) in production.

#### `requestPasswordReset(email)`
- Validates the email exists (without revealing if it does for security)
- Generates a reset token with 1-hour expiration
- Stores token in database
- Sends email with reset link

#### `validatePasswordResetToken(token)`
- Validates token exists in database
- Checks if token has expired
- Returns user associated with token

#### `resetPasswordWithToken(token, newPassword)`
- Validates token and expiration
- Hashes new password using bcryptjs
- Updates user's password
- Clears reset token from database
- Auto-logs user in by setting session cookie

### tRPC Procedures

Located in `server/routers/auth.ts`:

#### `auth.requestPasswordReset`
**Input:** `{ email: string }`
**Output:** `{ success: boolean, message: string }`

Initiates password reset flow. Returns generic message for security.

#### `auth.validateResetToken`
**Input:** `{ token: string }`
**Output:** `{ success: boolean, email: string, message: string }`

Validates reset token before allowing password change. Used to show user's email on reset form.

#### `auth.resetPassword`
**Input:** `{ token: string, newPassword: string }`
**Output:** `{ success: boolean, user: User, message: string }`

Completes password reset and auto-logs user in.

## Frontend Implementation

### Screens

#### Forgot Password Screen (`app/(auth)/forgot-password.tsx`)
- Email input field
- Sends password reset request
- Shows success confirmation with email check reminder
- Auto-redirects to login after 3 seconds

#### Reset Password Screen (`app/(auth)/reset-password.tsx`)
- Accepts reset token (from URL or manual input)
- Validates token on mount
- New password input with visibility toggle
- Confirm password input with visibility toggle
- Password requirements display
- Shows success confirmation and auto-redirects to home

### Auth Context Methods

Located in `lib/auth-context.tsx`:

#### `requestPasswordReset(email)`
Calls backend to initiate password reset flow.

#### `validateResetToken(token)`
Validates reset token and returns user's email.

#### `resetPassword(token, newPassword)`
Completes password reset and updates auth state.

### Navigation

- Login screen has "Forgot password?" link → Forgot Password screen
- Forgot Password screen has "Send Reset Link" button → calls `requestPasswordReset`
- Forgot Password screen has "Back to Login" button → Login screen
- Reset Password screen has "Reset Password" button → calls `resetPassword`
- Reset Password screen has "Back to Login" button → Login screen

## Security Considerations

1. **Token Generation:** 32-character random alphanumeric tokens are cryptographically secure
2. **Token Expiration:** Tokens expire after 1 hour to limit exposure window
3. **One-Time Use:** Tokens are cleared after successful password reset
4. **Generic Messages:** "If this email is registered..." message doesn't reveal if email exists
5. **Password Hashing:** New passwords are hashed using bcryptjs with 10 salt rounds
6. **HTTPS Only:** Tokens should only be transmitted over HTTPS in production
7. **Auto-Login:** User is automatically logged in after reset for better UX

## Email Integration (TODO)

Currently, password reset tokens are logged to console. To enable email delivery:

1. Choose email service (SendGrid, Resend, AWS SES, etc.)
2. Update `sendPasswordResetEmail()` in `server/services/auth-service.ts`
3. Create email template with reset link
4. Set `APP_URL` environment variable for reset link generation

Example reset link format:
```
https://yourapp.com/reset-password?token=<RESET_TOKEN>
```

## Testing the Flow

### Manual Testing

1. **Request Reset:**
   - Go to login screen
   - Click "Forgot password?"
   - Enter registered email
   - Check console for reset token

2. **Reset Password:**
   - Copy token from console
   - Go to reset password screen
   - Paste token
   - Enter new password
   - Click "Reset Password"
   - Verify auto-login to home screen

### Automated Testing

Tests can be written for:
- Token generation and validation
- Token expiration
- Password hashing
- Database updates
- API endpoint responses
- Error handling for invalid tokens

## Future Enhancements

1. **Email Service Integration** — Send actual emails via SendGrid/Resend
2. **Rate Limiting** — Limit password reset requests per email/IP
3. **Audit Logging** — Log password reset attempts for security
4. **Backup Codes** — Provide backup codes for account recovery
5. **SMS Option** — Send reset link via SMS as alternative
6. **Password History** — Prevent reuse of recent passwords
7. **Security Questions** — Add optional security questions for verification
