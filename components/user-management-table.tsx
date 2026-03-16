"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import {
  useUsers,
  useCreateUser,
  useUpdateUserRole,
  useDeleteUser,
} from "@/lib/api";
import type { User } from "@/lib/api";
import { ROLES, canCreateRole, canChangeRole, canDeleteUser } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function roleBadgeVariant(role: string | null) {
  switch (role) {
    case ROLES.superAdmin:
      return "destructive" as const;
    case ROLES.admin:
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

function CreateUserDialog({ currentRole }: { currentRole: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(ROLES.viewer);
  const [error, setError] = useState("");
  const createUser = useCreateUser();

  const availableRoles = Object.values(ROLES).filter((r) =>
    canCreateRole(currentRole, r)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createUser.mutateAsync({ name, email, password, role });
      setOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole(ROLES.viewer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        Create User
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(val) => { if (val) setRole(val); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={createUser.isPending}>
            {createUser.isPending ? "Creating..." : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserRow({
  user,
  currentRole,
  currentUserId,
}: {
  user: User;
  currentRole: string;
  currentUserId: string;
}) {
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const isSelf = user.id === currentUserId;
  const userRole = user.role ?? "viewer";

  return (
    <TableRow className="transition-colors hover:bg-primary/5">
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
          {userRole}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {new Date(user.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {canChangeRole(currentRole) && !isSelf && (
            <Select
              value={userRole}
              onValueChange={(newRole) => {
                if (newRole) updateRole.mutate({ id: user.id, role: newRole });
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).filter((r) => r !== ROLES.superAdmin).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!isSelf && canDeleteUser(currentRole, userRole) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteUser.mutate(user.id)}
              disabled={deleteUser.isPending}
            >
              Delete
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function UserManagementTable() {
  const { data: session } = useSession();
  const { data, isLoading } = useUsers();

  const currentRole = session?.user.role ?? "viewer";
  const currentUserId = session?.user.id ?? "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm">Loading users...</span>
        </div>
      </div>
    );
  }

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage user accounts and roles
          </p>
        </div>
        <CreateUserDialog currentRole={currentRole} />
      </div>
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: User) => (
              <UserRow
                key={user.id}
                user={user}
                currentRole={currentRole}
                currentUserId={currentUserId}
              />
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
