/**
 * Auth react-query hooks. The session lives in httpOnly cookies (invisible to
 * JS), so the *client-visible* auth state is just "does `/users/me/` resolve?".
 * `useMe` is that probe (cached, no retry); `useLogin`/`useLogout` mutate it and
 * keep the `me` cache in sync so the panel renders without an extra round-trip.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getMe, login, logout } from "@/services/auth.service";
import type { LoginCredentials } from "@/types/auth";

export const authKeys = {
  me: ["auth", "me"] as const,
};

/**
 * The current user. `retry: false` so an anonymous 401 surfaces immediately as
 * an error (the gate redirects on it) rather than retrying. A 401 with a still
 * valid `rt` is transparently refreshed-and-retried inside `http.ts` first, so
 * this only errors when the session is truly gone.
 */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: getMe,
    retry: false,
    staleTime: 60_000,
  });
}

/** Email + password → seeds the `me` cache from the login response. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    },
  });
}

/** Sign out → clears the `me` cache regardless of the API outcome. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: authKeys.me });
    },
  });
}
