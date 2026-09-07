// ブラウザ → GET /bff/orders/{number} → Laravel GET /api/orders/{order_number}（本人の詳細）。
// /account/orders/[number] と /checkout/complete のポーリングから使う。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";
import { getMyOrder } from "@/lib/orders";

export async function GET(_request: Request, { params }: { params: Promise<{ number: string }> }) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { number } = await params;

  try {
    const order = await getMyOrder(token, number);
    if (!order) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ data: order });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
