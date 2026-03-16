import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { canChangeRole, canDeleteUser } from "@/lib/auth-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || !canChangeRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { role } = body;

  if (!role) {
    return NextResponse.json({ error: "role is required" }, { status: 400 });
  }

  if (role === "superAdmin") {
    return NextResponse.json(
      { error: "Cannot promote users to superAdmin" },
      { status: 403 }
    );
  }

  try {
    await auth.api.setRole({
      headers: reqHeaders,
      body: { userId: id, role },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Get the target user to check their role
  const targetUser = await auth.api.getUser({
    headers: reqHeaders,
    query: { id },
  }).catch(() => null);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!canDeleteUser(session.user.role ?? "", targetUser.role ?? "viewer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await auth.api.removeUser({
      headers: reqHeaders,
      body: { userId: id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
