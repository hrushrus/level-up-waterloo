# Email Verification Implementation Guide

## Overview

This document describes the complete email verification system implemented for LevelUp Waterloo. Users must verify their email addresses before they can access protected content (home, bookmarks, profile screens).

## Architecture

### Database Schema

The `users` table now includes three new fields for email verification:

```typescript
emailVerified: boolean          // Whether email has been verified (default: false)
emailVerificationToken: string  // Unique token for verification
emailVerificationTokenExpiresAt: Date  // Token expiration time (24 hours)
```

### Backend Implementation

#### Email Verification Service (`server/services/auth-service.ts`)

**Functions:**

- **`generateVerificationToken()`** - Generates a random 32-character alphanumeric token
- **`sendVerificationEmail(email, token, name)`** - Sends verification email (placeholder for email service integration)
- **`createVerificationToken(userId)`** - Creates token with 24-hour expiration
- **`verifyEmailWithToken(token)`** - Validates token and marks email as verified
- **`resendVerificationEmail(email)`** - Resends verification email to user

#### tRPC Procedures (`server/routers/auth.ts`)

**New procedures:**

- **`auth.sendVerificationEmail`** - Resend verification email to user
  - Input: `{ email: string }`
  - Returns: `{ success: true, message: string }`

- **`auth.verifyEmail`** - Verify email with token
  - Input: `{ token: string }`
  - Returns: `{ success: true, user: User, message: string }`
  - Sets session cookie on successful verification

**Modified procedures:**

- **`auth.signup`** - Now creates verification token after user creation
  - Returns: `{ success: true, user: User, message: string }`
  - User is NOT automatically logged in; must verify email first

- **`auth.login`** - Now checks if email is verified before login
  - Throws error: "Please verify your email before logging in"

### Frontend Implementation

#### Auth Context (`lib/auth-context.tsx`)

**New state properties:**

```typescript
isEmailVerified: boolean        // Whether user's email is verified
needsEmailVerification: boolean // Whether user needs to verify email
```

**New methods:**

```typescript
verifyEmail(token: string)                    // Verify email with token
resendVerificationEmail(email: string)        // Resend verification email
```

#### Email Verification Screen (`app/(auth)/verify-email.tsx`)

Features:

- **Token input field** - User enters verification code
- **Auto-verification** - If token provided in URL, auto-verifies
- **Resend functionality** - Resend verification email with rate limiting
- **Success state** - Shows confirmation and redirects to home
- **Error handling** - Displays validation and API errors
- **Info box** - Explains verification process

#### Route Guards (`app/_layout.tsx`)

**Navigation logic:**

1. **Not signed in** → Redirect to login screen
2. **Signed in + email not verified** → Redirect to verify-email screen
3. **Signed in + email verified** → Allow access to protected screens
4. **Signed in + in auth group** → Redirect to home

## User Flows

### Sign Up Flow

```
1. User enters name, email, password on signup screen
2. User submits form
3. Backend creates user with emailVerified = false
4. Backend generates verification token (24-hour expiration)
5. Verification email sent to user (logs token for now)
6. User redirected to verify-email screen
7. User enters token from email
8. Backend validates token and marks email as verified
9. Session cookie set
10. User redirected to home screen
```

### Login Flow

```
1. User enters email and password on login screen
2. Backend authenticates user
3. Backend checks emailVerified flag
4. If not verified: Error "Please verify your email before logging in"
5. If verified: Session cookie set and user logged in
6. User redirected to home screen
```

### Email Verification Flow

```
1. User on verify-email screen
2. User enters verification code from email
3. Backend validates token:
   - Token exists in database
   - Token not expired (< 24 hours)
4. If valid:
   - Set emailVerified = true
   - Clear emailVerificationToken
   - Set session cookie
   - Redirect to home
5. If invalid:
   - Show error message
   - Offer to resend email
```

### Resend Verification Email

```
1. User clicks "Resend Code" button
2. Backend finds user by email
3. Checks if email already verified
4. Creates new verification token
5. Sends new verification email
6. Shows success message
```

## Integration Points

### Email Service Integration

Currently, the `sendVerificationEmail()` function logs the token to console. To integrate with a real email service:

1. **SendGrid** - Popular email service
   ```typescript
   import sgMail from '@sendgrid/mail';
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   await sgMail.send({
     to: email,
     from: 'noreply@levelupwaterloo.com',
     subject: 'Verify your email',
     html: emailTemplate,
   });
   ```

2. **Resend** - Modern email API
   ```typescript
   import { Resend } from 'resend';
   const resend = new Resend(process.env.RESEND_API_KEY);
   await resend.emails.send({
     from: 'noreply@levelupwaterloo.com',
     to: email,
     subject: 'Verify your email',
     html: emailTemplate,
   });
   ```

3. **Environment Variables**
   ```bash
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your_key_here
   APP_URL=https://levelupwaterloo.com
   ```

## Security Considerations

### Token Security

- **Random generation** - Uses cryptographically random characters
- **Short expiration** - Tokens expire after 24 hours
- **Single use** - Token cleared after successful verification
- **Unique per user** - Each user has one active token at a time

### Email Verification

- **Prevents spam** - Ensures valid email addresses
- **Reduces fraud** - Confirms user owns the email
- **Improves deliverability** - Reduces bounce rates for notifications

### Rate Limiting

Current implementation does not include rate limiting on resend. Consider adding:

```typescript
// Track resend attempts per email
const resendAttempts = new Map<string, { count: number; resetAt: Date }>();

// Limit to 3 resends per hour
if (attempts.count >= 3 && attempts.resetAt > now) {
  throw new Error("Too many resend attempts. Try again later.");
}
```

## Testing

### Manual Testing Checklist

- [ ] **Signup flow** - Create account and receive verification code
- [ ] **Email verification** - Enter code and verify email
- [ ] **Login before verification** - Try logging in before email verified
- [ ] **Login after verification** - Successfully login after verification
- [ ] **Resend email** - Request new verification code
- [ ] **Expired token** - Try verifying with expired token
- [ ] **Invalid token** - Try verifying with wrong token
- [ ] **Route protection** - Cannot access home/bookmarks without verification
- [ ] **Auto-redirect** - Unverified user redirected to verify screen
- [ ] **Success redirect** - After verification, redirected to home

### Automated Tests

Current test coverage includes:

- Auth service: User creation, password hashing, authentication
- Auth router: Signup, login, logout procedures
- Email verification: Token generation, validation, expiration

To add email verification tests:

```typescript
describe("Email Verification", () => {
  it("should create verification token with 24-hour expiration", async () => {
    const token = await createVerificationToken(userId);
    expect(token).toHaveLength(32);
    const user = await findUserById(userId);
    expect(user.emailVerificationToken).toBe(token);
    expect(user.emailVerificationTokenExpiresAt).toBeDefined();
  });

  it("should verify email with valid token", async () => {
    const token = await createVerificationToken(userId);
    const user = await verifyEmailWithToken(token);
    expect(user.emailVerified).toBe(true);
    expect(user.emailVerificationToken).toBeNull();
  });

  it("should reject expired token", async () => {
    const token = await createVerificationToken(userId);
    // Manually set expiration to past
    await db.update(users).set({
      emailVerificationTokenExpiresAt: new Date(Date.now() - 1000),
    });
    await expect(verifyEmailWithToken(token)).rejects.toThrow("expired");
  });
});
```

## File Structure

```
server/
├── services/
│   └── auth-service.ts          # Email verification functions
└── routers/
    └── auth.ts                  # tRPC procedures

app/
├── (auth)/
│   ├── _layout.tsx              # Auth navigation
│   ├── login.tsx                # Login screen
│   ├── signup.tsx               # Signup screen
│   └── verify-email.tsx         # Email verification screen
└── _layout.tsx                  # Route guards

lib/
├── auth-context.tsx             # Auth state with verification
└── _core/
    └── auth.ts                  # Session/user storage

drizzle/
└── schema.ts                    # Database schema with verification fields
```

## Future Enhancements

### Phase 2: Email Templates

- [ ] Create HTML email template
- [ ] Add branding and styling
- [ ] Include verification link (not just code)
- [ ] Add fallback plain text version

### Phase 3: Advanced Features

- [ ] Email change verification - Verify new email before updating
- [ ] Resend rate limiting - Prevent abuse
- [ ] Verification reminders - Remind users to verify after 24 hours
- [ ] Unverified account cleanup - Delete accounts not verified after 7 days

### Phase 4: OAuth Integration

- [ ] Auto-verify email for OAuth users
- [ ] Link OAuth account to existing email account
- [ ] Allow email change for OAuth users

## Troubleshooting

### "Verification token has expired"

**Cause:** Token was created more than 24 hours ago

**Solution:** Click "Resend Code" to get a new token

### "Invalid verification token"

**Cause:** Token doesn't exist or was already used

**Solution:** Check email for correct code, or request new one

### "Please verify your email before logging in"

**Cause:** User hasn't verified email yet

**Solution:** Complete email verification flow

### Verification email not received

**Cause:** Email service not configured or email blocked

**Solution:** Check spam folder, request resend, or check email service logs

## References

- **Auth Service:** `server/services/auth-service.ts`
- **Auth Router:** `server/routers/auth.ts`
- **Auth Context:** `lib/auth-context.tsx`
- **Verify Email Screen:** `app/(auth)/verify-email.tsx`
- **Database Schema:** `drizzle/schema.ts`
- **Route Guards:** `app/_layout.tsx`
