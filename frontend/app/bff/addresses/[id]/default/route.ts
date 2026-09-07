// ブラウザ → POST /bff/addresses/{id}/default → Laravel POST /api/addresses/{id}/default。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { setDefaultAddress } from "@/lib/addresses";
import { getSessionToken } from "@/lib/auth";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;

  try {
    return NextResponse.json({ data: await setDefaultAddress(token, Number(id)) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
