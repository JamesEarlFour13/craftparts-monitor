import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { SyncHistoryRecord, PaginatedResponse } from "./types";

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
