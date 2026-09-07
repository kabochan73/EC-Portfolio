// ブラウザ → GET /bff/orders → Laravel GET /api/orders（本人の注文一覧）。
// ブラウザ → POST /bff/orders → Laravel POST /api/orders（チェックアウトで pending 注文を作成）。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";
import { createOrder, getMyOrders } from "@/lib/orders";

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

export async function POST(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const order = await createOrder(token, body);
    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
