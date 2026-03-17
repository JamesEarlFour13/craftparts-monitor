import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const globalForMail = globalThis as unknown as { transporter: Transporter };

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: parseInt(process.env.SMTP_PORT ?? "587", 10),
    secure: process.env.SMTP_PORT === "465",
    ...(process.env.SMTP_USER && {
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }),
  });
}

export const transporter =
  globalForMail.transporter ?? createTransporter();

if (process.env.NODE_ENV !== "production")
  globalForMail.transporter = transporter;

const from = process.env.SMTP_FROM ?? "monitor@craftparts.com";

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string
) {
  return transporter.sendMail({ from, to, subject, html });
}

export async function sendSyncAlertEmail(
  to: string[],
  errorRecords: Array<{
    extern_description: string;
    status: string;
    last_error_message: string | null;
    connector_type: string;
    last_operation_ts: string;
  }>
) {
  const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const count = errorRecords.length;

  const rows = errorRecords
    .map(
      (r) => `<tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${r.extern_description}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">
          <span style="background: ${r.status === "Failed" ? "#fecaca" : "#fed7aa"}; color: ${r.status === "Failed" ? "#991b1b" : "#9a3412"}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${r.status}</span>
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; color: #666; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${(r.last_error_message ?? "—").slice(0, 200)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px;">${r.connector_type}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; color: #888;">${r.last_operation_ts ?? "—"}</td>
      </tr>`
    )
    .join("");

  const html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto;">
    <div style="background: #dc2626; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="margin: 0; font-size: 18px;">Craftparts Monitor — Sync Errors Detected</h2>
    </div>
    <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
      <p style="margin: 0 0 16px; color: #374151;">${count} connector(s) reported errors in the last hour.</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Description</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Status</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Error</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Connector</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Last Operation</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <a href="${appUrl}" style="color: #2563eb; text-decoration: none; font-size: 14px;">View in Craftparts Monitor →</a>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">Sent at ${new Date().toISOString()}</p>
    </div>
  </div>`;

  return sendEmail(
    to,
    `Craftparts Monitor — ${count} Sync Error(s) Detected`,
    html
  );
}

export async function sendTestEmail(to: string) {
  return sendEmail(
    to,
    "Craftparts Monitor — Test Email",
    `<div style="font-family: sans-serif; max-width: 480px;">
      <h2 style="margin: 0 0 8px;">Craftparts Monitor</h2>
      <p style="color: #555;">This is a test email to confirm your SMTP configuration is working correctly.</p>
      <p style="color: #999; font-size: 13px;">Sent at ${new Date().toISOString()}</p>
    </div>`
  );
}
