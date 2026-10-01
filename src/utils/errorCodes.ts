/**
 * Monster Realms - Universal Error Code Formatter
 * Translates raw error codes (Firebase Auth codes, Firestore error codes, HTTP status codes,
 * and internal error messages) into clean, friendly human messages.
 * Prevents raw codes like "auth/unauthorized-domain", "(auth/invalid-credential)",
 * "[code=permission-denied]", or raw JSON error objects from being displayed to users.
 */

// Common Firebase Auth error code mappings
const FIREBASE_AUTH_ERROR_MAP: Record<string, string> = {
  'auth/unauthorized-domain':
    'The current website domain is not authorized in Firebase Authentication. Please add this domain to Authorized Domains in your Firebase Console Settings.',
  'auth/invalid-credential':
    'Incorrect email or password. Please verify your credentials or click "Create Account" if you are new.',
  'auth/user-not-found':
    'No account was found with this email address. Please click "Create Account" to sign up.',
  'auth/wrong-password':
    'Incorrect password entered. Please check your password and try again.',
  'auth/email-already-in-use':
    'This email address is already registered. Please sign in instead.',
  'auth/invalid-email':
    'Please enter a valid email address.',
  'auth/weak-password':
    'Password is too weak. Please use at least 6 characters.',
  'auth/popup-closed-by-user':
    'Sign-in was cancelled before completion.',
  'auth/cancelled-popup-request':
    'The sign-in request was cancelled. Please try again.',
  'auth/popup-blocked':
    'The sign-in popup was blocked by your browser. Please allow popups for this site.',
  'auth/operation-not-allowed':
    'This sign-in method is currently disabled in your Firebase project configuration.',
  'auth/too-many-requests':
    'Too many failed attempts. Access has been temporarily restricted. Please try again in a few moments.',
  'auth/network-request-failed':
    'Network connection error. Please verify your internet connection and try again.',
  'auth/user-disabled':
    'This user account has been disabled. Please contact support.',
  'auth/requires-recent-login':
    'This action requires recent authentication. Please sign in again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email address using a different sign-in provider.',
  'auth/internal-error':
    'An internal authentication error occurred. Please try again.',
  'auth/quota-exceeded':
    'Authentication quota exceeded. Please try again later.',
  'auth/invalid-verification-code':
    'The verification code entered is invalid or has expired.',
};

// Common Firestore error code mappings
const FIRESTORE_ERROR_MAP: Record<string, string> = {
  'permission-denied':
    'Database access permission denied. Please sign in or ensure your account is authorized.',
  'unavailable':
    'Database service is temporarily unavailable. Retrying connection...',
  'not-found':
    'The requested game record was not found.',
  'already-exists':
    'This game record already exists.',
  'resource-exhausted':
    'Database daily quota limit reached. Please try again later.',
  'cancelled':
    'The database operation was cancelled.',
  'deadline-exceeded':
    'The database operation timed out. Please try again.',
  'unauthenticated':
    'You must be signed in to perform this action.',
  'failed-precondition':
    'Database precondition failed. The required index or configuration may be initializing.',
  'aborted':
    'The database transaction was aborted due to a conflict. Please retry.',
};

// HTTP Status code mappings
const HTTP_ERROR_MAP: Record<number, string> = {
  400: 'Invalid request data. Please check your inputs.',
  401: 'Authentication required. Please sign in to continue.',
  403: 'Access denied. You do not have permission for this action.',
  404: 'Requested game service or data was not found.',
  409: 'Conflict detected with current state. Please refresh and try again.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'Internal server error occurred. Please try again shortly.',
  502: 'Server gateway error. The server may be restarting.',
  503: 'Game service temporarily unavailable. Please try again shortly.',
  504: 'Server response timed out. Please try again.',
};

/**
 * Format any raw error into a human-readable, friendly string.
 * Strips raw error codes (e.g. "auth/...", "[code=permission-denied]") and JSON blobs.
 */
export function formatErrorCode(err: unknown, fallbackMessage?: string): string {
  if (!err) {
    return fallbackMessage || 'An unexpected error occurred.';
  }

  // 1. Direct code property on Error object
  const anyErr = err as any;
  const rawCode = (anyErr?.code || '').toString().trim();

  if (rawCode) {
    if (FIREBASE_AUTH_ERROR_MAP[rawCode]) {
      return FIREBASE_AUTH_ERROR_MAP[rawCode];
    }
    if (FIRESTORE_ERROR_MAP[rawCode]) {
      return FIRESTORE_ERROR_MAP[rawCode];
    }
  }

  // 2. HTTP Status Code on error object or Response
  const statusCode = typeof anyErr?.status === 'number' ? anyErr.status : undefined;
  if (statusCode && HTTP_ERROR_MAP[statusCode]) {
    // If there is also a specific server error text, prefer it unless it is generic
    if (anyErr.error && typeof anyErr.error === 'string' && anyErr.error.length > 0) {
      return anyErr.error;
    }
    return HTTP_ERROR_MAP[statusCode];
  }

  // 3. String extraction
  let message = '';
  if (typeof err === 'string') {
    message = err;
  } else if (err instanceof Error) {
    message = err.message || '';
  } else if (anyErr?.message) {
    message = String(anyErr.message);
  } else if (anyErr?.error) {
    message = String(anyErr.error);
  }

  if (!message) {
    return fallbackMessage || 'An unexpected error occurred.';
  }

  // 4. Check if message is a JSON string (e.g. from handleFirestoreError)
  if (message.startsWith('{') && message.endsWith('}')) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.error && typeof parsed.error === 'string') {
        // Recursively format the extracted error message
        return formatErrorCode(parsed.error, fallbackMessage);
      }
    } catch {
      // Not valid JSON, continue with regex checks
    }
  }

  // 5. Check for embedded Firebase Auth code: e.g. "Firebase: Error (auth/invalid-credential)."
  const authCodeMatch = message.match(/auth\/[a-z0-9-]+/i);
  if (authCodeMatch) {
    const code = authCodeMatch[0].toLowerCase();
    if (FIREBASE_AUTH_ERROR_MAP[code]) {
      return FIREBASE_AUTH_ERROR_MAP[code];
    }
  }

  // 6. Check for embedded Firestore code: e.g. "FirebaseError: [code=permission-denied]: ..."
  const firestoreCodeMatch = message.match(/\[code=([a-z0-9-]+)\]/i);
  if (firestoreCodeMatch) {
    const code = firestoreCodeMatch[1].toLowerCase();
    if (FIRESTORE_ERROR_MAP[code]) {
      return FIRESTORE_ERROR_MAP[code];
    }
  }

  // 7. Check for JSON / HTML syntax errors
  if (message.includes('Unexpected token') && (message.includes('<') || message.includes('<!doctype'))) {
    return 'The game server returned an unexpected response. The service may be restarting, please try again.';
  }

  // 8. Clean up generic Firebase prefixes
  let cleaned = message
    .replace(/^Firebase:\s*(Error\s*)?\(?[^)]*\)?\.?\s*/i, '')
    .replace(/^FirebaseError:\s*(\[[^\]]*\]:\s*)?/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();

  if (cleaned.length > 0) {
    return cleaned;
  }

  return fallbackMessage || 'An unexpected error occurred. Please try again.';
}
