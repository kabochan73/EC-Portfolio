<?php

namespace App\Jobs;

use App\Mail\VerifyEmailMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

/**
 * メールアドレス確認メールの送信（docs/10-email.md）。
 * ペイロードは user_id のみ。モデルは handle 内で引く。
 */
class SendEmailVerificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $userId) {}

    public function handle(): void
    {
        $user = User::find($this->userId);

        if ($user === null || $user->hasVerifiedEmail()) {
            return;
        }

        Mail::to($user->email)->send(new VerifyEmailMail($user->name, $this->verifyUrl($user)));
    }

    /**
     * フロント（Next.js）の /verify-email 宛の署名付き URL。
     * absolute:false で相対 URL を作り、ホスト非依存の署名にする（signed:relative で検証）。
     */
    private function verifyUrl(User $user): string
    {
        $hash = sha1($user->getEmailForVerification());

        $signedPath = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->getKey(), 'hash' => $hash],
            absolute: false,
        );

        $query = Str::after($signedPath, '?'); // expires=...&signature=...

        return rtrim(config('app.frontend_url'), '/')
            ."/verify-email?id={$user->getKey()}&hash={$hash}&{$query}";
    }
}
