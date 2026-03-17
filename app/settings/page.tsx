"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { canManageUsers } from "@/lib/auth-utils";
import { NotificationSettings } from "@/components/notification-settings";
import { useEffect } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session && !canManageUsers(session.user.role)) {
      router.push("/");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-center py-20 text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !canManageUsers(session.user.role)) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <NotificationSettings />
      </div>
    </div>
  );
}
