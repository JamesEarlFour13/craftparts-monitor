import { SyncHistoryTable } from "@/components/sync-history-table";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <SyncHistoryTable />
      </div>
    </div>
  );
}
