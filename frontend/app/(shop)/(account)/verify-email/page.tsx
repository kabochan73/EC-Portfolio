import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import VerifyEmailClient from "@/components/auth/VerifyEmailClient";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "Verify Email" };

/**
 * メール認証の案内・着地（docs/01-sitemap-pages.md）。要ログイン。
 * 認証済みなら /account へ戻す。実処理（署名 URL の検証・再送）は VerifyEmailClient。
 */
export default async function VerifyEmailPage() {
  const { user } = await requireAuth("/verify-email");

  if (user.email_verified) {
    redirect("/account");
  }

  return (
    <Suspense>
      <VerifyEmailClient email={user.email} />
    </Suspense>
  );
}
