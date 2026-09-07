"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * /verify-email の中身（docs/08 §4）。
 * - クエリに signature があれば「メールのリンクからの着地」→ POST /bff/email/verify を即実行
 * - 無ければ「案内画面」→ 再送ボタン
 */
export default function VerifyEmailClient({ email }: { email: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const ran = useRef(false);

  const hasLink = Boolean(params.get("signature"));
  const [state, setState] = useState<"idle" | "verifying" | "verified" | "failed" | "sending" | "sent">(
    hasLink ? "verifying" : "idle",
  );

  useEffect(() => {
    if (!hasLink || ran.current) return;
    ran.current = true;

    (async () => {
      const res = await fetch("/bff/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: params.get("id"),
          hash: params.get("hash"),
          expires: params.get("expires"),
          signature: params.get("signature"),
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["session"] });
        setState("verified");
      } else {
        setState("failed");
      }
    })();
  }, [hasLink, params, queryClient]);

  async function resend() {
    setState("sending");
    const res = await fetch("/bff/email/verification-notification", { method: "POST" });
    setState(res.ok ? "sent" : "idle");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-2xl tracking-[0.15em] uppercase">Verify Email</h1>

      {state === "verifying" && <p className="mt-8 text-sm text-graphite">確認中...</p>}

      {state === "verified" && (
        <>
          <p className="mt-8 text-sm text-graphite">メールアドレスの確認が完了しました。</p>
          <button
            type="button"
            onClick={() => {
              router.push("/account");
              router.refresh();
            }}
            className="mt-8 border border-ink px-6 py-3 text-xs tracking-[0.2em] uppercase hover:opacity-60"
          >
            Go to Account
          </button>
        </>
      )}

      {state === "failed" && (
        <>
          <p className="mt-8 text-sm text-graphite">
            このリンクは無効か期限切れです。新しい確認メールを送ってください。
          </p>
          <button
            type="button"
            onClick={resend}
            className="mt-8 border border-ink px-6 py-3 text-xs tracking-[0.2em] uppercase hover:opacity-60"
          >
            Resend
          </button>
        </>
      )}

      {(state === "idle" || state === "sending" || state === "sent") && (
        <>
          <p className="mt-8 text-sm text-graphite">
            {email} に確認メールを送りました。メール内のリンクを開いてください。
          </p>
          {state === "sent" ? (
            <p className="mt-8 text-xs tracking-widest text-graphite uppercase">
              確認メールを再送しました。
            </p>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={state === "sending"}
              className="mt-8 border border-ink px-6 py-3 text-xs tracking-[0.2em] uppercase hover:opacity-60 disabled:opacity-50"
            >
              {state === "sending" ? "..." : "Resend Email"}
            </button>
          )}
        </>
      )}

      <p className="mt-10 text-xs text-graphite">
        <Link href="/account" className="text-ink underline underline-offset-2">
          Back to Account
        </Link>
      </p>
    </div>
  );
}
