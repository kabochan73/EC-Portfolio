# トランザクションメール（R3）

## 方針

- **ローカル = Mailpit（SMTP）** / **本番 = Resend**。切り替えは `MAIL_MAILER` のみ。
- Laravel Mail + **Markdown Mailable**（`resources/views/mail/*.blade.php`）。デザインはモノトーンで簡素（Laravel 標準の Markdown コンポーネントの色を上書き）。
- 送信は**キュー経由**（`ShouldQueue` な Job から）。リクエストを待たせない。worker が落ちてもメールが遅延するだけ。
- 宛先は常に実ユーザーのメール。ポートフォリオなので実運用の宛先は自分だけ。**Resend は無料枠・検証済みドメインからの送信のみ**。

## Mailable 一覧

| クラス | トリガ | 内容 | キュー |
|---|---|---|---|
| `VerifyEmailMail` | 登録時 / メールアドレス変更時 / `/verify-email` の再送 | 署名付き検証リンク（`${FRONTEND_URL}/verify-email?id=..&hash=..&expires=..&signature=..`） | `SendEmailVerificationJob` |
| `ResetPasswordMail` | `POST /api/forgot-password` | リセットリンク（`${FRONTEND_URL}/reset-password?token=..&email=..`）。有効期限を明記 | `Password` broker が queue で送る |
| `OrderConfirmationMail` | Webhook `payment_intent.succeeded` → `MarkOrderPaid` | 注文番号・明細・送料・合計・配送先・`VIEW ORDER` リンク | `SendOrderConfirmationJob` |
| `OrderShippedMail` | admin が `paid → shipped` | 注文番号・「発送しました」・配送先・`VIEW ORDER` リンク（追跡番号は R3 では持たない） | `SendOrderShippedJob` |

## Laravel 標準通知のカスタム

`User` は `MustVerifyEmail`。ただしメール本文を自前 Mailable にするため:

```php
// User.php
public function sendEmailVerificationNotification(): void
{
    SendEmailVerificationJob::dispatch($this->id);
}
```

`SendEmailVerificationJob::handle()`:
```php
$user = User::findOrFail($this->userId);
if ($user->hasVerifiedEmail()) return;
$url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
    'id' => $user->id,
    'hash' => sha1($user->getEmailForVerification()),
]);
// ↑ ただし署名 URL の host は API 側。フロント向けに組み替える:
$frontUrl = config('app.frontend_url').'/verify-email?'.Str::after($url, '?').'&id='.$user->id.'&hash='.sha1(...);
Mail::to($user->email)->send(new VerifyEmailMail($frontUrl));
```

実装をシンプルに保つため、`AppServiceProvider::boot()` で:
```php
VerifyEmail::createUrlUsing(fn ($notifiable) => /* frontend URL を返す */);
ResetPassword::createUrlUsing(fn ($notifiable, $token) =>
    config('app.frontend_url')."/reset-password?token={$token}&email=".urlencode($notifiable->email));
```
を設定し、標準の `Notification` 経路に乗せる方式でも可。**R3 は Mailable + Job で統一**（4 通の見た目を揃えたいので `Notification` は使わず全部 `Mail::to()->send()`）。

パスワードリセットだけは `Password` broker の都合で `Notification`（`ResetPassword`）を使うが、`toMail` を override して `VerifyEmailMail` と同じレイアウトの Mailable を返す。

## `config/mail.php` / `config/services.php`

```php
// config/mail.php
'default' => env('MAIL_MAILER', 'log'),
'mailers' => [
    'smtp' => [ /* Mailpit。host=mailpit port=1025 encryption=null auth なし */ ],
    'resend' => ['transport' => 'resend'],
    'log' => ['transport' => 'log', 'channel' => 'stderr'],
],
'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'noreply@ec-portfolio.example.jp'),
    'name' => env('MAIL_FROM_NAME', 'EC-PORTFOLIO'),
],
```

Resend トランスポート: `composer require resend/resend-php resend/resend-laravel`。`config/services.php` に `'resend' => ['key' => env('RESEND_API_KEY')]`。

`RESEND_API_KEY` 未設定・`MAIL_MAILER=log` でも全フローが動く（メールはログに出るだけ）。ローカルは Mailpit を既定にする。

## メールのトーン・デザイン

- 件名: `[EC-PORTFOLIO] ご注文ありがとうございます (EC-20260907-0001)` のような形。全部日本語。
- 本文: Markdown。`php artisan vendor:publish --tag=laravel-mail` でコンポーネントを取り出し、`resources/views/vendor/mail/html/themes/default.css` をモノトーン化（プライマリボタンを黒背景・白文字・角丸なし、リンクは黒下線、パネルはボーダーのみ）。
- ロゴ画像は使わず `EC-PORTFOLIO` のテキスト。
- フッターにダミーの問い合わせ先（`docs/01` のフッターと同じ `example.jp`）。

## キュー（`docs/06` §5 と対）

- `QUEUE_CONNECTION=database`。Job は `implements ShouldQueue`, `use Queueable`。
- Job のペイロードは **ID のみ**（`userId` / `orderId`）。`handle()` でモデルを引く。
- `--tries=3`。失敗は `failed_jobs`。`failed()` で `Log::warning`（注文自体は成立しているのでメール失敗は致命的でない）。
- テスト: `Mail::fake()` + `Queue::fake()`。
  - 「登録すると検証メールがキューに載る」
  - 「Webhook succeeded で `SendOrderConfirmationJob` が push される」
  - 「`OrderConfirmationMail` が正しい宛先・件名・注文番号を含む」（`Mail::assertQueued(fn ($mail) => $mail->hasTo($user->email) && ...)`）

## セキュリティ・運用メモ

- `forgot-password` のレスポンスは常に成功文言（アカウント存在を漏らさない）。メールが飛ぶかどうかで差が出ないよう、存在しないアドレスでも同じ 200 + 遅延なし。
- 検証・リセットリンクは署名 / トークン付き・60 分（検証）/ 60 分（リセット、`config/auth.php` の `passwords.users.expire`）。
- メール本文に生のトークンが載る以上、Mailpit / Resend のログ管理に注意（ポートフォリオなので許容）。
- バウンス・苦情処理はしない（実顧客がいない）。
