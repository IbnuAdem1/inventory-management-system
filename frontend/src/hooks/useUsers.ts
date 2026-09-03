import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface WorkerUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "WORKER";
  branchId?: string | null;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  branchId?: string | null;
  permissions?: string[];
}

export interface UserUpdateInput {
  name?: string;
  branchId?: string | null;
  permissions?: string[];
}

export interface UserStatusInput {
  isActive: boolean;
}

export interface UserPasswordResetInput {
  password: string;
}

export function useUsersQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["users"],
    enabled: isAuthenticated,
    retry: false,
    queryFn: () => apiFetch<WorkerUser[]>("/users"),
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UserCreateInput) =>
      apiFetch<WorkerUser>("/users", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UserUpdateInput }) =>
      apiFetch<WorkerUser>(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}


export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UserStatusInput }) =>
      apiFetch<WorkerUser>(`/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useResetUserPasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UserPasswordResetInput }) =>
      apiFetch<{ message: string }>(`/users/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message: string }>(`/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
