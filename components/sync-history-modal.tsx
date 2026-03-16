"use client";

import { useState } from "react";
import type { SyncHistoryRecord } from "@/lib/types";
import { useSyncTimeline } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case "success":
      return "bg-green-500";
    case "error":
    case "failed":
      return "bg-red-500";
    default:
      return "bg-neutral-400";
  }
}

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

const DETAIL_FIELDS: { key: keyof SyncHistoryRecord; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "connector_type", label: "Connector Type" },
  { key: "status", label: "Status" },
  { key: "last_operation", label: "Last Operation" },
  { key: "last_operation_ts", label: "Operation Time" },
  { key: "last_error_message", label: "Error Message" },
  { key: "attempt_count", label: "Attempt Count" },
  { key: "binding_id", label: "Binding ID" },
  { key: "entity_type", label: "Entity Type" },
  { key: "extern_description", label: "Description" },
  { key: "extern_id", label: "External ID" },
  { key: "created_at", label: "Created At" },
  { key: "updated_at", label: "Updated At" },
];

export function SyncHistoryModal({
  externDescription,
  open,
  onOpenChange,
}: {
  externDescription: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: records, isLoading } = useSyncTimeline(
    externDescription,
    open
  );
  const [selectedRecord, setSelectedRecord] =
    useState<SyncHistoryRecord | null>(null);

  const displayRecord =
    selectedRecord ?? (records && records.length > 0 ? records[0] : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{externDescription}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading timeline...
          </div>
        ) : (
          <>
            {/* Horizontal Timeline */}
            <ScrollArea className="w-full">
              <div className="flex items-center gap-0 px-2 py-4">
                {records?.map((record, i) => (
                  <div key={record.id} className="flex items-center">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border p-3 min-w-[140px] transition-colors",
                        displayRecord?.id === record.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "size-2.5 rounded-full",
                          statusColor(record.status)
                        )}
                      />
                      <span className="text-xs font-medium">
                        {record.last_operation}
                      </span>
                      <Badge
                        variant={statusVariant(record.status)}
                        className="text-[10px]"
                      >
                        {record.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimestamp(record.updated_at)}
                      </span>
                    </button>

                    {i < (records?.length ?? 0) - 1 && (
                      <div className="h-px w-6 bg-border shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <Separator />

            {/* Detail Panel */}
            {displayRecord ? (
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {DETAIL_FIELDS.map(({ key, label }) => {
                  const value = displayRecord[key];
                  const isError = key === "last_error_message";
                  const isTimestamp =
                    key.endsWith("_at") || key.endsWith("_ts");

                  return (
                    <div key={key} className={isError ? "col-span-2" : ""}>
                      <dt className="text-xs text-muted-foreground mb-0.5">
                        {label}
                      </dt>
                      <dd
                        className={cn(
                          isError && value
                            ? "font-mono text-xs bg-destructive/5 text-destructive p-2 rounded-md"
                            : ""
                        )}
                      >
                        {value === null || value === ""
                          ? "—"
                          : isTimestamp
                            ? formatTimestamp(String(value))
                            : String(value)}
                      </dd>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select a timeline entry to view details
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
