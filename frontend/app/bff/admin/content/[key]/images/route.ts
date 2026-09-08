// ブラウザ → POST /bff/admin/content/{key}/images（multipart）→ Laravel の同パス。
// 画像を保存して { url: "/media/content/{key}/..." } を返す。
// この時点ではまだ data に反映されないので revalidate はしない（セクション保存時に飛ぶ）。

import { NextResponse } from "next/server";

import { uploadContentImage, type ContentKey } from "@/lib/admin/content";
import { apiErrorResponse } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type Context = { params: Promise<{ key: string }> };

export async function POST(request: Request, { params }: Context) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { key } = await params;
  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "画像ファイルを選択してください。" }, { status: 422 });
  }

  try {
    const url = await uploadContentImage(token, key as ContentKey, file);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
