import { NextRequest, NextResponse } from "next/server";
import { getHistoryByExternDescription } from "@/lib/db";

export async function GET(request: NextRequest) {
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
