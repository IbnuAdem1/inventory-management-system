// src/hooks/useAuth.ts
// React Query mutations for auth-related actions beyond login/logout.

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      apiFetch<{ message: string }>("/auth/password", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
  });
}
