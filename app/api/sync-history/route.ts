import { NextRequest, NextResponse } from "next/server";
import { getLatestPerDescription } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const search = searchParams.get("search") ?? "";

  try {
    const result = await getLatestPerDescription(page, limit, search);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch sync history:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync history" },
      { status: 500 }
    );
  }
}
