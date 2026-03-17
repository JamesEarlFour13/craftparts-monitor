import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/auth-utils";
import { isNotificationsEnabled, setAppSetting } from "@/lib/db";

export async function GET() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const notificationsEnabled = await isNotificationsEnabled();
    return NextResponse.json({ notificationsEnabled });
  } catch (error) {
    console.error("Failed to get settings:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { notificationsEnabled } = body;

  if (typeof notificationsEnabled !== "boolean") {
    return NextResponse.json(
      { error: "notificationsEnabled must be a boolean" },
      { status: 400 }
    );
  }

  try {
    await setAppSetting(
      "notifications_enabled",
      String(notificationsEnabled)
    );
    return NextResponse.json({ notificationsEnabled });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
