// ブラウザ → PUT/DELETE /bff/addresses/{id} → Laravel /api/addresses/{id}。
// 他人の id は Laravel が 404。

import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api";
import { deleteAddress, updateAddress } from "@/lib/addresses";
import { getSessionToken } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    return NextResponse.json({ data: await updateAddress(token, Number(id), body) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteAddress(token, Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
