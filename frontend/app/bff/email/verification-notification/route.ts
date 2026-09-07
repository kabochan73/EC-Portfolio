// ブラウザ → POST /bff/email/verification-notification → Laravel（検証メール再送）。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { getSessionToken, resendVerificationEmail } from "@/lib/auth";

export async function POST() {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    await resendVerificationEmail(token);
    return new NextResponse(null, { status: 202 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
