import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type { SyncHistoryRecord, PaginatedResponse } from "./types";

interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string;
  banned: boolean | null;
}

export type { User };

export function useSyncHistory(page = 1, limit = 20, search = "") {
  return useQuery<PaginatedResponse<SyncHistoryRecord>>({
    queryKey: ["sync-history", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/sync-history?${params}`);
      if (!res.ok) throw new Error("Failed to fetch sync history");
      return res.json();
    },
    placeholderData: keepPreviousData,
  });
}

export function useSyncTimeline(externDescription: string, enabled: boolean) {
  return useQuery<SyncHistoryRecord[]>({
    queryKey: ["sync-timeline", externDescription],
    queryFn: async () => {
      const res = await fetch(
        `/api/sync-history/timeline?externDescription=${encodeURIComponent(externDescription)}`
      );
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    enabled: enabled && !!externDescription,
  });
}

export function useUsers() {
  return useQuery<{ users: User[] }>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name: string;
      role: string;
    }) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update role");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
