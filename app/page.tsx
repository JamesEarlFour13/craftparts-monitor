import { SyncHistoryTable } from "@/components/sync-history-table";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SyncHistoryTable />
      </div>
    </div>
  );
}
