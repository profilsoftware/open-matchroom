/**
 * Auth wire types — mirror `users/api/serializers.py`. Tokens live in httpOnly
 * `at`/`rt` cookies (never in JS), so there is no token type here.
 */

/** The authenticated user (UserSerializer — returned by login + `/users/me/`). */
export interface User {
  pid: string;
  email: string;
  name: string;
  isStaff: boolean;
  isSuperuser: boolean;
  lastLogin: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
