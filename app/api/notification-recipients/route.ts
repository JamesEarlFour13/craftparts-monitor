import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/auth-utils";
import {
  getNotificationRecipients,
  createNotificationRecipient,
  getSuperAdminUsers,
} from "@/lib/db";

export async function GET() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [recipients, superAdmins] = await Promise.all([
      getNotificationRecipients(),
      getSuperAdminUsers(),
    ]);
    return NextResponse.json({ recipients, superAdmins });
  } catch (error) {
    console.error("Failed to list notification recipients:", error);
    return NextResponse.json(
      { error: "Failed to list notification recipients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, name } = body;

  if (!email) {
    return NextResponse.json(
      { error: "email is required" },
      { status: 400 }
    );
  }

  try {
    const recipient = await createNotificationRecipient(email, name ?? "");
    return NextResponse.json(recipient);
  } catch (error) {
    console.error("Failed to create notification recipient:", error);
    return NextResponse.json(
      { error: "Failed to create notification recipient" },
      { status: 500 }
    );
  }
}
