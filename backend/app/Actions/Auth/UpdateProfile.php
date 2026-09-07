<?php

namespace App\Actions\Auth;

use App\Models\User;

/**
 * 氏名・メールの更新（docs/03-api.md PUT /api/me）。
 * メールが変わったら email_verified_at を null に戻す
 * （再認証メールの dispatch は Step 16 でここに足す）。
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

        return $user;
    }
}
