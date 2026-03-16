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
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
    <TableRow>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant={roleBadgeVariant(user.role)}>
          {userRole}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
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
    return <div className="text-muted-foreground">Loading users...</div>;
  }

  const users = data?.users ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">User Management</h2>
        <CreateUserDialog currentRole={currentRole} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableCell colSpan={5} className="text-center text-muted-foreground">
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
