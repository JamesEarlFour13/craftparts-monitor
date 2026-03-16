import { SyncHistoryTable } from "@/components/sync-history-table";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold mb-6">Craftparts Sync Monitor</h1>
        <SyncHistoryTable />
      </div>
    </div>
  );
}
