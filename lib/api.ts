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

export interface NotificationRecipient {
  id: number;
  email: string;
  name: string | null;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

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

// App settings

export function useAppSettings() {
  return useQuery<{ notificationsEnabled: boolean }>({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { notificationsEnabled: boolean }) => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update settings");
      }
      return res.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["app-settings"] });
      const previous = queryClient.getQueryData<{ notificationsEnabled: boolean }>(["app-settings"]);
      queryClient.setQueryData(["app-settings"], data);
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(["app-settings"], context.previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["app-settings"] }),
  });
}

// Notification recipients

export function useNotificationRecipients() {
  return useQuery<{
    recipients: NotificationRecipient[];
    superAdmins: Array<{ name: string; email: string }>;
  }>({
    queryKey: ["notification-recipients"],
    queryFn: async () => {
      const res = await fetch("/api/notification-recipients");
      if (!res.ok) throw new Error("Failed to fetch notification recipients");
      return res.json();
    },
  });
}

type RecipientsData = {
  recipients: NotificationRecipient[];
  superAdmins: Array<{ name: string; email: string }>;
};

export function useCreateNotificationRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; name: string }) => {
      const res = await fetch("/api/notification-recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create recipient");
      }
      return res.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["notification-recipients"] });
      const previous = queryClient.getQueryData<RecipientsData>(["notification-recipients"]);
      if (previous) {
        const optimistic: NotificationRecipient = {
          id: -Date.now(),
          email: data.email,
          name: data.name,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData<RecipientsData>(["notification-recipients"], {
          ...previous,
          recipients: [optimistic, ...previous.recipients],
        });
      }
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(["notification-recipients"], context.previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notification-recipients"] }),
  });
}

export function useUpdateNotificationRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: number;
      email?: string;
      name?: string;
      active?: boolean;
    }) => {
      const res = await fetch(`/api/notification-recipients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update recipient");
      }
      return res.json();
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ["notification-recipients"] });
      const previous = queryClient.getQueryData<RecipientsData>(["notification-recipients"]);
      if (previous) {
        queryClient.setQueryData<RecipientsData>(["notification-recipients"], {
          ...previous,
          recipients: previous.recipients.map((r) =>
            r.id === id ? { ...r, ...data } : r
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(["notification-recipients"], context.previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notification-recipients"] }),
  });
}

export function useDeleteNotificationRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notification-recipients/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete recipient");
      }
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notification-recipients"] });
      const previous = queryClient.getQueryData<RecipientsData>(["notification-recipients"]);
      if (previous) {
        queryClient.setQueryData<RecipientsData>(["notification-recipients"], {
          ...previous,
          recipients: previous.recipients.filter((r) => r.id !== id),
        });
      }
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(["notification-recipients"], context.previous);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["notification-recipients"] }),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/notification-recipients/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to send test email");
      }
      return res.json();
    },
  });
}
