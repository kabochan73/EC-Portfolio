"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * メール未認証のとき /account・/checkout の上部に出す注意バナー。
 * 再送は 60 秒スロットル（連打防止）。認証済みかどうかは呼び出し元が判定して出し分ける。
 */
export default function VerifyEmailBanner({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "cooldown" | "error">("idle");

  async function resend() {
    setState("sending");
    const res = await fetch("/bff/email/verification-notification", { method: "POST" });
    if (res.ok) {
      setState("sent");
      setTimeout(() => setState("cooldown"), 100);
      setTimeout(() => setState("idle"), 60_000);
    } else {
      setState("error");
    }
  }

  return (
    <div className="border-b border-ink bg-mist px-6 py-3 text-xs tracking-widest uppercase">
      <span>メールアドレスが未確認です（{email}）。</span>{" "}
      {state === "sent" || state === "cooldown" ? (
        <span className="text-graphite">確認メールを送信しました。</span>
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={state === "sending"}
          className="underline underline-offset-2 disabled:opacity-50"
        >
          {state === "sending" ? "送信中..." : "確認メールを再送"}
        </button>
      )}{" "}
      <Link href="/verify-email" className="underline underline-offset-2">
        詳細
      </Link>
      {state === "error" && <span className="ml-2 text-graphite">送信に失敗しました。</span>}
    </div>
  );
}
