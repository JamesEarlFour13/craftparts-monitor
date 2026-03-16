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
      return "default" as const;
    case "error":
    case "failed":
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
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading sync history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-destructive">
        Error: {error.message}
      </div>
    );
  }

  const records = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Search by description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Connector</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Operation</TableHead>
            <TableHead>Operation Time</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Entity Type</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow
              key={record.id}
              className="cursor-pointer"
              onClick={() => setSelectedDescription(record.extern_description)}
            >
              <TableCell className="font-medium">
                {record.extern_description}
              </TableCell>
              <TableCell>{record.connector_type}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(record.status)}>
                  {record.status}
                </Badge>
              </TableCell>
              <TableCell>{record.last_operation}</TableCell>
              <TableCell>{formatTimestamp(record.last_operation_ts)}</TableCell>
              <TableCell>{record.attempt_count}</TableCell>
              <TableCell>{record.entity_type}</TableCell>
              <TableCell>{formatTimestamp(record.updated_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination className="mt-4">
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
