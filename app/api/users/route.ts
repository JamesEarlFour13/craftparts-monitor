import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { canManageUsers, canCreateRole } from "@/lib/auth-utils";

export async function GET() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await auth.api.listUsers({
      headers: reqHeaders,
      query: { limit: 100, offset: 0, sortBy: "createdAt", sortDirection: "desc" },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list users:", error);
    return NextResponse.json(
      { error: "Failed to list users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, name, role } = body;

  if (!email || !password || !name || !role) {
    return NextResponse.json(
      { error: "email, password, name, and role are required" },
      { status: 400 }
    );
  }

  if (!canCreateRole(session.user.role ?? "", role)) {
    return NextResponse.json(
      { error: "You do not have permission to create this role" },
      { status: 403 }
    );
  }

  try {
    const newUser = await auth.api.createUser({
      headers: reqHeaders,
      body: { email, password, name, role },
    });
    return NextResponse.json(newUser);
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
