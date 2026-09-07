import type { Metadata } from "next";
import { Suspense } from "react";

import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Login" };

// LoginForm は useSearchParams（?redirect=）を使う Client Component なので Suspense で包む。
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
