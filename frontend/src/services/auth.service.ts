/**
 * Auth domain service — thin typed wrappers over the ky client (`http.ts`).
 * The backend uses a cookie-JWT scheme: login sets the httpOnly `at`/`rt`
 * cookies and returns the user in the body; `/users/me/` echoes the current
 * user; logout blacklists the refresh token and clears the cookies. Tokens never
 * touch JS — the cookies are first-party via the Next proxy.
 */

import type { LoginCredentials, User } from "@/types/auth";
import { endpoints } from "./endpoints";
import { get, post } from "./http";

/** dj-rest-auth wraps the user under `user` (it also echoes `access`/`""` which
 *  we ignore — the tokens live in the httpOnly cookies). */
interface LoginResponse {
  user: User;
}

/** Sign in with email + password. Resolves to the authenticated user. */
export function login(credentials: LoginCredentials): Promise<User> {
  return post<LoginResponse>(endpoints.auth.login, { json: credentials }).then(
    (response) => response.user,
  );
}

/** Sign out — blacklists the `rt` cookie server-side and clears both cookies. */
export function logout(): Promise<{ detail: string }> {
  // No body: the view reads the refresh token from the `rt` cookie.
  return post<{ detail: string }>(endpoints.auth.logout);
}

/** The current user (401 when anonymous — drives the admin gate). */
export function getMe(): Promise<User> {
  return get<User>(endpoints.users.me);
}
