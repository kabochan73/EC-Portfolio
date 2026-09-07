// ブラウザ → GET /bff/orders → Laravel GET /api/orders（本人の注文一覧）。
// POST（注文作成）は Step 44（チェックアウト）で追加する。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";
import { getMyOrders } from "@/lib/orders";

export async function GET() {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    const orders = await getMyOrders(token);
    return NextResponse.json({ data: orders });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
