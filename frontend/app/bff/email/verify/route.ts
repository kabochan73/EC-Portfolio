// ブラウザ（/verify-email 着地）→ POST /bff/email/verify {id,hash,expires,signature}
//   → Laravel GET /api/email/verify/{id}/{hash}?expires=&signature=（Bearer 付き）
// 署名検証は Laravel の signed:relative ミドルウェア。ここは中継のみ。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { getSessionToken, verifyEmail } from "@/lib/auth";

export async function POST(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id, hash, expires, signature } = await request.json();

  if (!id || !hash || !expires || !signature) {
    return NextResponse.json({ message: "Invalid verification link." }, { status: 422 });
  }

  try {
    await verifyEmail(token, {
      id: String(id),
      hash: String(hash),
      expires: String(expires),
      signature: String(signature),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
