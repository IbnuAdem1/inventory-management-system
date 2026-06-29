import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/lib/api";

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "WORKER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  email: string;
  name: string;
  password: string;
  role: "OWNER" | "WORKER";
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

export function useUsersQuery() {
  return useQuery({
    queryKey: ["users"],
    enabled: Boolean(getAuthToken()),
    retry: false,
    queryFn: () => apiFetch<StaffUser[]>("/users"),
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UserCreateInput) =>
      apiFetch<StaffUser>("/users", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PasswordChangeInput }) =>
      apiFetch<{ message: string }>(`/users/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
  });
}
