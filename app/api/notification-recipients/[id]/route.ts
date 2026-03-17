import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/auth-utils";
import {
  updateNotificationRecipient,
  deleteNotificationRecipient,
} from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { email, name, active } = body;

  try {
    const recipient = await updateNotificationRecipient(parseInt(id, 10), {
      ...(email !== undefined && { email }),
      ...(name !== undefined && { name }),
      ...(active !== undefined && { active }),
    });
    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(recipient);
  } catch (error) {
    console.error("Failed to update notification recipient:", error);
    return NextResponse.json(
      { error: "Failed to update notification recipient" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await deleteNotificationRecipient(parseInt(id, 10));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification recipient:", error);
    return NextResponse.json(
      { error: "Failed to delete notification recipient" },
      { status: 500 }
    );
  }
}
