// ブラウザ → GET/POST /bff/addresses → Laravel /api/addresses（本人のもののみ）。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { createAddress, getAddresses } from "@/lib/addresses";
import { getSessionToken } from "@/lib/auth";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    return NextResponse.json({ data: await getAddresses(token) });
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
    return NextResponse.json({ data: await createAddress(token, body) }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
