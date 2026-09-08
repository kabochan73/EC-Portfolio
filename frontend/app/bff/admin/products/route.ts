// ブラウザ → GET/POST /bff/admin/products → Laravel /api/admin/products。

import { NextResponse } from "next/server";

import { createProduct, fetchAdminProducts } from "@/lib/admin/products";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";
import { revalidate, tags } from "@/lib/revalidate";

export async function GET(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const url = new URL(request.url);
  const params = {
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined,
  };

  try {
    return NextResponse.json(await fetchAdminProducts(token, params));
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
    const product = await createProduct(token, body);
    revalidate(tags.products, tags.categories);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
