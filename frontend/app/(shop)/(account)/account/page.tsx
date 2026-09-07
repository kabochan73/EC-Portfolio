import { requireAuth } from "@/lib/auth";

// マイページ ダッシュボード。Step 41 でメニュー（ORDERS / ADDRESSES / PROFILE / LOGOUT）
// と VerifyEmailBanner を作り込む。いまは認証ガードの動作確認用の最小版。
export default async function AccountPage() {
  const { user } = await requireAuth("/account");

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-medium tracking-[0.15em] uppercase">Account</h1>
      <p className="mt-4 text-sm text-graphite">ようこそ、{user.name} さん</p>
    </div>
  );
}
