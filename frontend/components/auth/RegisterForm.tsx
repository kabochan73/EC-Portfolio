"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import Field from "@/components/ui/Field";
import { registerSchema, type RegisterFormValues } from "@/lib/schemas/register";
import type { ApiResource, User } from "@/lib/types";

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    const res = await fetch("/bff/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      // Laravel の errors をフィールド下に割り当てる
      if (body?.errors) {
        for (const [field, messages] of Object.entries(body.errors)) {
          setError(field as keyof RegisterFormValues, {
            message: (messages as string[])[0],
          });
        }
      } else {
        setServerError(body?.message ?? "会員登録に失敗しました。");
      }
      return;
    }

    const body = (await res.json()) as ApiResource<User>;
    queryClient.setQueryData(["session"], body);

    router.push(searchParams.get("redirect") || "/account");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-center text-2xl tracking-[0.15em] uppercase">Register</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-12 space-y-6">
        <Field
          label="Name"
          id="name"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
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
          {isSubmitting ? "..." : "Register"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-graphite">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline underline-offset-2">
          Login
        </Link>
      </p>
    </div>
  );
}
