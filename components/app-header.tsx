"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { canManageUsers } from "@/lib/auth-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const router = useRouter();
  const { data: session } = useSession();

  if (!session) return null;

  const role = session.user.role ?? "viewer";

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            Craftparts Monitor
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sync History
            </Link>
            {canManageUsers(role) && (
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Users
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {session.user.email}
          </span>
          <Badge variant="secondary">{role}</Badge>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
