"use client";

import { useState } from "react";
import {
  useNotificationRecipients,
  useCreateNotificationRecipient,
  useUpdateNotificationRecipient,
  useDeleteNotificationRecipient,
  useSendTestEmail,
  useAppSettings,
  useUpdateAppSettings,
  useUsers,
} from "@/lib/api";
import type { NotificationRecipient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

function AddRecipientDialog({
  existingEmails,
  superAdminEmails,
}: {
  existingEmails: string[];
  superAdminEmails: string[];
}) {
  const [open, setOpen] = useState(false);
  const createRecipient = useCreateNotificationRecipient();
  const { data: usersData } = useUsers();

  const excludedEmails = new Set([...existingEmails, ...superAdminEmails]);
  const availableUsers = (usersData?.users ?? []).filter(
    (u) => !excludedEmails.has(u.email)
  );

  function handleSelect(userId: string) {
    const user = availableUsers.find((u) => u.id === userId);
    if (!user) return;
    createRecipient.mutate({ email: user.email, name: user.name });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add Recipient</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Notification Recipient</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select a user</Label>
            {availableUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                All users are already recipients
              </p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {availableUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user.id)}
                    className="w-full flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {user.email}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {user.role}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecipientRow({ recipient }: { recipient: NotificationRecipient }) {
  const updateRecipient = useUpdateNotificationRecipient();
  const deleteRecipient = useDeleteNotificationRecipient();
  const sendTest = useSendTestEmail();
  const [testStatus, setTestStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function handleToggleActive() {
    updateRecipient.mutate({
      id: recipient.id,
      active: !recipient.active,
    });
  }

  async function handleSendTest() {
    setTestStatus("sending");
    try {
      await sendTest.mutateAsync(recipient.email);
      setTestStatus("sent");
      setTimeout(() => setTestStatus("idle"), 3000);
    } catch {
      setTestStatus("error");
      setTimeout(() => setTestStatus("idle"), 3000);
    }
  }

  return (
    <TableRow className="transition-colors hover:bg-primary/5">
      <TableCell className="font-medium">
        {recipient.name || (
          <span className="text-muted-foreground italic">No name</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{recipient.email}</TableCell>
      <TableCell>
        <button
          onClick={handleToggleActive}
          className="cursor-pointer"
        >
          <Badge variant={recipient.active ? "default" : "secondary"}>
            {recipient.active ? "Active" : "Inactive"}
          </Badge>
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTest}
            disabled={testStatus === "sending"}
          >
            {testStatus === "sending"
              ? "Sending..."
              : testStatus === "sent"
                ? "Sent!"
                : testStatus === "error"
                  ? "Failed"
                  : "Test Email"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteRecipient.mutate(recipient.id)}
          >
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SuperAdminRow({ admin }: { admin: { name: string; email: string } }) {
  return (
    <TableRow className="transition-colors hover:bg-primary/5 bg-muted/30">
      <TableCell className="font-medium">{admin.name}</TableCell>
      <TableCell className="text-muted-foreground">{admin.email}</TableCell>
      <TableCell>
        <Badge variant="outline" className="border-primary/40 text-primary">
          Always Active
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">Super Admin</span>
      </TableCell>
    </TableRow>
  );
}

function GlobalNotificationToggle() {
  const { data, isLoading } = useAppSettings();
  const updateSettings = useUpdateAppSettings();

  const enabled = data?.notificationsEnabled ?? true;

  function handleToggle(checked: boolean) {
    updateSettings.mutate({ notificationsEnabled: checked });
  }

  if (isLoading) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Email Notifications</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {enabled
              ? "All active recipients will receive error alerts"
              : "Disabled — only Super Admin users will receive alerts"}
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
}

export function NotificationSettings() {
  const { data, isLoading } = useNotificationRecipients();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  const recipients = data?.recipients ?? [];
  const superAdmins = data?.superAdmins ?? [];

  return (
    <div className="space-y-6">
      <GlobalNotificationToggle />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Notification Recipients
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage who receives email notifications
          </p>
        </div>
        <AddRecipientDialog
          existingEmails={recipients.map((r) => r.email)}
          superAdminEmails={superAdmins.map((a) => a.email)}
        />
      </div>
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {superAdmins.map((admin) => (
              <SuperAdminRow key={admin.email} admin={admin} />
            ))}
            {recipients.map((recipient: NotificationRecipient) => (
              <RecipientRow key={recipient.id} recipient={recipient} />
            ))}
            {recipients.length === 0 && superAdmins.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-12"
                >
                  No notification recipients configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
