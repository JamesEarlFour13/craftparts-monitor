import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getHistoryByExternDescription } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const externDescription = request.nextUrl.searchParams.get("externDescription");

  if (!externDescription) {
    return NextResponse.json(
      { error: "externDescription query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const records = await getHistoryByExternDescription(externDescription);
    return NextResponse.json(records);
  } catch (error) {
    console.error("Failed to fetch timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}
