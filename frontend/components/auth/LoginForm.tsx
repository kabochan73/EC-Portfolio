"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import Field from "@/components/ui/Field";
import { loginSchema, type LoginFormValues } from "@/lib/schemas/login";
import type { ApiResource, User } from "@/lib/types";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    const res = await fetch("/bff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.message ?? "ログインに失敗しました。");
      return;
    }

    // 取得済みの user で AccountLink の ["session"] キャッシュを直接更新
    const body = (await res.json()) as ApiResource<User>;
    queryClient.setQueryData(["session"], body);

    router.push(searchParams.get("redirect") || "/account");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-center text-2xl tracking-[0.15em] uppercase">Login</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-12 space-y-6">
        <Field
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          label="Password"
          id="password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {serverError && <p className="text-xs text-graphite">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-ink py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isSubmitting ? "..." : "Login"}
        </button>
      </form>

      <div className="mt-8 space-y-2 text-center text-xs text-graphite">
        <p>
          <Link href="/forgot-password" className="text-ink underline underline-offset-2">
            Forgot your password?
          </Link>
        </p>
        <p>
          No account?{" "}
          <Link href="/register" className="text-ink underline underline-offset-2">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
