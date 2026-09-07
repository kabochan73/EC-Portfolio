import type { Metadata } from "next";
import { Suspense } from "react";

import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset Password" };

// ResetPasswordForm は useSearchParams（token / email）を使うので Suspense で包む。
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
