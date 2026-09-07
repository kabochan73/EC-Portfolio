<?php

namespace App\Actions\Auth;

use App\Models\User;

/**
 * 氏名・メールの更新（docs/03-api.md PUT /api/me）。
 * メールが変わったら email_verified_at を null に戻し、新アドレスへ再認証メールを送る。
 */
final class UpdateProfile
{
    public function execute(User $user, string $name, string $email): User
    {
        $emailChanged = $email !== $user->email;

        $user->name = $name;
        $user->email = $email;

        if ($emailChanged) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return $user;
    }
}
