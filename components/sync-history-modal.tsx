"use client";

import { useEffect, useRef, useState } from "react";
import type { SyncHistoryRecord } from "@/lib/types";
import { useSyncTimeline } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case "processed":
      return "bg-primary";
    case "prepared":
      return "bg-amber-500";
    case "failed":
      return "bg-orange-600";
    case "aborted":
      return "bg-destructive";
    default:
      return "bg-muted-foreground/50";
  }
}

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "processed":
      return "default" as const;
    case "prepared":
      return "secondary" as const;
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
  const { data: records, isLoading } = useSyncTimeline(externDescription, open);
  const [selectedRecord, setSelectedRecord] =
    useState<SyncHistoryRecord | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (records && records.length > 0) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      });
    }
  }, [records]);

  const displayRecord =
    selectedRecord ??
    (records && records.length > 0 ? records[records.length - 1] : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{externDescription}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm">Loading timeline...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Timeline */}
            <div ref={scrollRef} className="w-full overflow-x-auto">
              <div className="flex items-stretch gap-0 px-1 py-3 w-max">
                {records?.map((record, i) => (
                  <div key={record.id} className="flex items-center">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border px-4 py-3 min-w-36 transition-all",
                        displayRecord?.id === record.id
                          ? "border-primary bg-primary/8 shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 hover:border-primary/40 hover:bg-muted/60",
                      )}
                    >
                      <div
                        className={cn(
                          "size-2.5 rounded-full ring-2 ring-offset-2 ring-offset-card",
                          statusColor(record.status),
                          displayRecord?.id === record.id
                            ? "ring-primary/30"
                            : "ring-transparent",
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
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {formatTimestamp(record.updated_at)}
                      </span>
                    </button>

                    {i < (records?.length ?? 0) - 1 && (
                      <div className="h-px w-5 bg-border shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator className="opacity-60" />

            {/* Detail Panel */}
            {displayRecord ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm py-1">
                {DETAIL_FIELDS.map(({ key, label }) => {
                  const value = displayRecord[key];
                  const isError = key === "last_error_message";
                  const isTimestamp =
                    key.endsWith("_at") || key.endsWith("_ts");

                  return (
                    <div key={key} className={isError ? "col-span-2" : ""}>
                      <dt className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                        {label}
                      </dt>
                      <dd
                        className={cn(
                          "text-foreground",
                          isError && value
                            ? "font-mono text-xs bg-destructive/8 text-destructive p-3 rounded-lg border border-destructive/15"
                            : "",
                          isTimestamp ? "tabular-nums" : "",
                        )}
                      >
                        {value == null || value === ""
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
              <div className="text-center text-muted-foreground py-12">
                Select a timeline entry to view details
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
