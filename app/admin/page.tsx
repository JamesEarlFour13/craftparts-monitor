"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { canManageUsers } from "@/lib/auth-utils";
import { UserManagementTable } from "@/components/user-management-table";
import { useEffect } from "react";

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session && !canManageUsers(session.user.role)) {
      router.push("/");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (!session || !canManageUsers(session.user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <UserManagementTable />
      </div>
    </div>
  );
}
