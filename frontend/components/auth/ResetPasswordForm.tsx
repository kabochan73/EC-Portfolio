"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import Field from "@/components/ui/Field";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/schemas/resetPassword";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const linkInvalid = !token || !email;

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);

    const res = await fetch("/bff/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, ...values }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const firstError = body?.errors ? (Object.values(body.errors)[0] as string[])?.[0] : undefined;
      setServerError(firstError ?? body?.message ?? "パスワードを再設定できませんでした。");
      return;
    }

    router.push("/login?reset=1");
  }

  if (linkInvalid) {
    return (
      <div className="mx-auto max-w-sm px-6 py-24 text-center">
        <h1 className="text-2xl tracking-[0.15em] uppercase">Reset Password</h1>
        <p className="mt-12 text-sm text-graphite">
          リンクが正しくありません。もう一度パスワード再設定をリクエストしてください。
        </p>
        <p className="mt-8 text-xs text-graphite">
          <Link href="/forgot-password" className="text-ink underline underline-offset-2">
            Request New Link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-center text-2xl tracking-[0.15em] uppercase">Reset Password</h1>
      <p className="mt-4 text-center text-xs tracking-widest text-graphite uppercase">{email}</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-12 space-y-6">
        <Field
          label="New Password"
          id="password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Field
          label="Confirm Password"
          id="password_confirmation"
          type="password"
          autoComplete="new-password"
          error={errors.password_confirmation?.message}
          {...register("password_confirmation")}
        />

        {serverError && <p className="text-xs text-graphite">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-ink py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isSubmitting ? "..." : "Set New Password"}
        </button>
      </form>
    </div>
  );
}
