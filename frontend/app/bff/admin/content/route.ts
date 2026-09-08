// ブラウザ → GET /bff/admin/content → Laravel /api/admin/content（4 キーの生 data）。

import { NextResponse } from "next/server";

import { fetchAdminContent } from "@/lib/admin/content";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    return NextResponse.json({ data: await fetchAdminContent(token) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
