import Link from "next/link";

import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";

/**
 * 管理画面の共通レイアウト（docs/05-admin.md）。
 * ストアフロントの (shop) とは別系統で、Header/Footer を持たず
 * サイドバー付きの機能優先レイアウトにする。
 * requireAdmin() で「未ログイン → /login」「非 admin → /」を弾く。
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin("/admin");

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 flex-none border-r border-ink px-6 py-8">
        <p className="mb-8 text-xs tracking-[0.15em] uppercase">EC-Portfolio Admin</p>
        <AdminNav />
        <div className="mt-10 border-t border-mist pt-4 text-[11px] text-graphite">
          <p className="mb-2">{user.name}</p>
          <div className="flex flex-col gap-1">
            <Link href="/account" className="underline hover:text-ink">
              My Account
            </Link>
            <Link href="/" className="underline hover:text-ink">
              Back to Store
            </Link>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
