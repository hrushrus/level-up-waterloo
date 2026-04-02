# LevelUp Waterloo - Authentication Implementation Guide

## Overview

This document describes the complete authentication system implemented for LevelUp Waterloo, including email/password signup, login, logout, and protected routes.

## Architecture

### Backend (Already Implemented)

The backend provides tRPC procedures for authentication:

- **`auth.signup`** - Create new user account with email, password, and name
- **`auth.login`** - Authenticate user and create session
- **`auth.logout`** - Clear session and sign out user
- **`auth.profile`** - Get current user profile (protected)
- **`auth.updateProfile`** - Update user profile (protected)
- **`auth.changePassword`** - Change user password (protected)

**Files:**
- `server/routers/auth.ts` - tRPC authentication procedures
- `server/services/auth-service.ts` - Authentication business logic with bcryptjs password hashing

### Frontend Components

#### 1. Auth Context (`lib/auth-context.tsx`)

Central state management for authentication. Provides:

```typescript
interface AuthContextType {
  user: AuthUser | null;                    // Current logged-in user
  isLoading: boolean;                       // Loading state
  isSignedIn: boolean;                      // Whether user is authenticated
  error: string | null;                     // Error message
  signup: (email, password, name) => void;  // Sign up new user
  login: (email, password) => void;         // Sign in user
  logout: () => void;                       // Sign out user
  clearError: () => void;                   // Clear error message
}
```

**Features:**
- Calls tRPC API endpoints directly (no dependency on tRPC context)
- Persists user info to secure storage (SecureStore on native, localStorage on web)
- Handles session tokens automatically
- Provides error messages for UI feedback

#### 2. Login Screen (`app/(auth)/login.tsx`)

User sign-in interface with:

- **Email validation** - Checks valid email format
- **Password validation** - Minimum 8 characters
- **Show/hide password** - Toggle password visibility
- **Error display** - Shows auth errors from backend
- **Loading state** - Disables inputs during submission
- **Sign up link** - Navigate to signup screen

#### 3. Signup Screen (`app/(auth)/signup.tsx`)

New account creation with:

- **Name validation** - Minimum 2 characters
- **Email validation** - Valid email format, uniqueness checked by backend
- **Password validation** - Minimum 8 characters with uppercase, lowercase, and numbers
- **Confirm password** - Ensures passwords match
- **Show/hide password** - Toggle visibility for both fields
- **Error display** - Shows validation and backend errors
- **Loading state** - Prevents multiple submissions
- **Sign in link** - Navigate back to login

#### 4. Profile Screen (`app/(tabs)/profile.tsx`)

User account management with:

- **User info display** - Name, email, login method, member since date
- **Edit profile button** - Placeholder for future profile editing
- **Change password button** - Placeholder for future password change
- **Sign out button** - Logout with confirmation

#### 5. Route Guards (`app/_layout.tsx`)

Automatic navigation based on auth state:

- **Unauthenticated users** → Redirected to login screen
- **Authenticated users** → Can access home, bookmarks, and profile tabs
- **Loading state** → Prevents navigation until auth state is determined

## User Flows

### Sign Up Flow

```
1. User opens app
2. Route guard checks auth state (not signed in)
3. User redirected to login screen
4. User taps "Sign up" link
5. Navigates to signup screen
6. User enters name, email, password, confirm password
7. Form validates on blur/change
8. User submits form
9. API creates user account with bcryptjs hashing
10. Session cookie set by backend
11. User info stored locally
12. User redirected to home screen
13. Profile tab now shows user info
```

### Login Flow

```
1. User opens app
2. Route guard checks auth state (not signed in)
3. User redirected to login screen
4. User enters email and password
5. Form validates on blur/change
6. User submits form
7. API authenticates user
8. Session cookie set by backend
9. User info stored locally
10. User redirected to home screen
11. Can now access bookmarks and profile
```

### Logout Flow

```
1. User navigates to Profile tab
2. User taps "Sign Out" button
3. API clears session cookie
4. Local user info cleared
5. User redirected to login screen
6. All protected routes now inaccessible
```

## Session Management

### Web Platform

- **Session storage:** HTTP-only cookies (set by backend)
- **User info storage:** localStorage
- **Token management:** Automatic via cookies, no manual token handling

### Native Platform (iOS/Android)

- **Session storage:** HTTP-only cookies (set by backend)
- **User info storage:** SecureStore (device keychain/keystore)
- **Token management:** Optional JWT in SecureStore for offline verification

## Security Features

### Password Security

- **Hashing:** bcryptjs with salt rounds (implemented in backend)
- **Validation:** Minimum 8 characters, uppercase, lowercase, numbers
- **Storage:** Never stored in plaintext, only hashed in database

### Session Security

- **HTTP-only cookies:** Cannot be accessed via JavaScript
- **Secure flag:** Only sent over HTTPS
- **SameSite:** Prevents CSRF attacks
- **User info:** Stored securely (SecureStore on native, localStorage on web)

### Form Validation

- **Real-time validation:** Errors shown as user types
- **Email format:** RFC-compliant email validation
- **Password confirmation:** Ensures passwords match before submission
- **Backend validation:** Server-side validation prevents invalid data

## File Structure

```
app/
├── (auth)/                    # Auth screens group
│   ├── _layout.tsx           # Auth navigation layout
│   ├── login.tsx             # Login screen
│   └── signup.tsx            # Signup screen
├── (tabs)/
│   ├── _layout.tsx           # Tab navigation layout
│   ├── index.tsx             # Home screen
│   ├── bookmarks.tsx         # Bookmarks screen
│   └── profile.tsx           # Profile screen
└── _layout.tsx               # Root layout with route guards

lib/
├── auth-context.tsx          # Auth state management
├── _core/
│   └── auth.ts              # Session/user storage utilities
└── trpc.ts                  # tRPC client setup

server/
├── routers/
│   └── auth.ts              # tRPC auth procedures
└── services/
    └── auth-service.ts      # Auth business logic
```

## API Integration

### Direct API Calls

The auth context calls tRPC endpoints directly via HTTP:

```typescript
const response = await fetch(`${apiUrl}/api/trpc/auth.login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",  // Include cookies
  body: JSON.stringify({ json: { email, password } }),
});
```

This approach:
- Avoids circular dependency with tRPC context
- Works during app initialization
- Automatically handles cookies
- Provides full error information

## Testing

### Manual Testing Checklist

- [ ] **Signup flow** - Create new account with valid credentials
- [ ] **Signup validation** - Try invalid email, short password, mismatched passwords
- [ ] **Login flow** - Sign in with correct credentials
- [ ] **Login validation** - Try wrong password, non-existent email
- [ ] **Profile display** - User info shows correctly after login
- [ ] **Logout flow** - Sign out and verify redirected to login
- [ ] **Route protection** - Cannot access home/bookmarks without login
- [ ] **Session persistence** - Refresh page and user stays logged in
- [ ] **Cross-device sync** - Login on web, check if persisted on native

### Automated Tests

Run existing test suite:

```bash
pnpm test
```

Current test coverage:
- Auth service: Password hashing, user creation, authentication
- Admin router: Protected procedures, role-based access
- Opportunities API: Data retrieval and filtering

## Future Enhancements

### Phase 2: OAuth Integration

- [ ] Google Sign-In
- [ ] Apple Sign-In
- [ ] Account linking (connect OAuth to email account)

### Phase 3: Advanced Features

- [ ] Two-factor authentication (2FA)
- [ ] Email verification
- [ ] Password reset via email
- [ ] Account recovery options

### Phase 4: User Management

- [ ] Edit profile screen
- [ ] Change password screen
- [ ] Delete account option
- [ ] Account activity log

## Troubleshooting

### "Unable to find tRPC Context" Error

**Cause:** AuthProvider was inside tRPC provider, causing circular dependency

**Solution:** Ensure AuthProvider wraps the entire app and is outside tRPC provider

```typescript
<AuthProvider>
  <trpc.Provider>
    {/* App content */}
  </trpc.Provider>
</AuthProvider>
```

### User Not Persisting After Refresh

**Cause:** User info not saved to storage

**Solution:** Check that `Auth.setUserInfo()` is called after successful login/signup

### Redirect Loop Between Login and Home

**Cause:** Route guard logic incorrect or auth state not updating

**Solution:** Verify `useAuth()` returns correct `isSignedIn` value

### CORS Errors on API Calls

**Cause:** API server not configured for cross-origin requests

**Solution:** Ensure backend sets proper CORS headers and credentials are included

## References

- **Backend Auth:** `server/routers/auth.ts`
- **Auth Service:** `server/services/auth-service.ts`
- **Frontend Context:** `lib/auth-context.tsx`
- **Login Screen:** `app/(auth)/login.tsx`
- **Signup Screen:** `app/(auth)/signup.tsx`
- **Profile Screen:** `app/(tabs)/profile.tsx`
