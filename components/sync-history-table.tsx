"use client";

import { useState, useDeferredValue } from "react";
import { useSyncHistory } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SyncHistoryModal } from "@/components/sync-history-modal";

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "success":
    case "processed":
      return "default" as const;
    case "error":
    case "failed":
    case "aborted":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function formatTimestamp(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

export function SyncHistoryTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const { data, isLoading, error } = useSyncHistory(page, 20, deferredSearch);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(
    null
  );

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm">Loading sync history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="rounded-xl bg-destructive/10 px-6 py-4 text-sm text-destructive">
          Error: {error.message}
        </div>
      </div>
    );
  }

  const records = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Sync History</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Latest sync status per product
          </p>
        </div>
        <Input
          placeholder="Search by description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="font-semibold">Connector</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Operation</TableHead>
              <TableHead className="font-semibold">Operation Time</TableHead>
              <TableHead className="font-semibold">Attempts</TableHead>
              <TableHead className="font-semibold">Entity Type</TableHead>
              <TableHead className="font-semibold">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  No records found
                </TableCell>
              </TableRow>
            )}
            {records.map((record) => (
              <TableRow
                key={record.id}
                className="cursor-pointer transition-colors hover:bg-primary/5"
                onClick={() => setSelectedDescription(record.extern_description)}
              >
                <TableCell className="font-medium max-w-50 truncate">
                  {record.extern_description}
                </TableCell>
                <TableCell className="text-muted-foreground">{record.connector_type}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(record.status)}>
                    {record.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{record.last_operation}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{formatTimestamp(record.last_operation_ts)}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{record.attempt_count}</TableCell>
                <TableCell className="text-muted-foreground">{record.entity_type}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{formatTimestamp(record.updated_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <ScrollArea className="w-full">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => setPage(p)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </Pagination>
      )}

      <SyncHistoryModal
        externDescription={selectedDescription ?? ""}
        open={selectedDescription !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDescription(null);
        }}
      />
    </>
  );
}
