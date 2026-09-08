// ブラウザ → PUT /bff/admin/orders/{orderNumber}/status → Laravel の同パス。
// 不正遷移（422）・在庫不足でキャンセルできない等はそのまま中継する。

import { NextResponse } from "next/server";

import { updateOrderStatus } from "@/lib/admin/orders";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Context = { params: Promise<{ orderNumber: string }> };

export async function PUT(request: Request, { params }: Context) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { orderNumber } = await params;
  const body = await request.json();

  try {
    const order = await updateOrderStatus(token, orderNumber, body.status);
    return NextResponse.json({ data: order });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
