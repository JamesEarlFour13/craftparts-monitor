import { NextRequest, NextResponse } from "next/server";
import {
  getRecentFailedRecords,
  isNotificationsEnabled,
  getActiveNotificationRecipients,
  getSuperAdminEmails,
} from "@/lib/db";
import { sendSyncAlertEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const errorRecords = await getRecentFailedRecords(60);

    if (errorRecords.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No errors found",
        timestamp: new Date().toISOString(),
      });
    }

    // SuperAdmins always receive notifications
    const superAdminEmails = await getSuperAdminEmails();

    // Other recipients only if global toggle is on
    const notificationsEnabled = await isNotificationsEnabled();
    let recipientEmails = [...superAdminEmails];

    if (notificationsEnabled) {
      const activeRecipients = await getActiveNotificationRecipients();
      recipientEmails.push(...activeRecipients.map((r) => r.email));
    }

    // Deduplicate
    recipientEmails = [...new Set(recipientEmails)];

    if (recipientEmails.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No recipients configured",
        timestamp: new Date().toISOString(),
      });
    }

    await sendSyncAlertEmail(recipientEmails, errorRecords);

    return NextResponse.json({
      ok: true,
      message: "Notifications sent",
      recipientCount: recipientEmails.length,
      errorCount: errorRecords.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron check-sync failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
