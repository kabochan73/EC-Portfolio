<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * パスワード変更（docs/03-api.md PUT /api/me/password）。
 * 現パスワードの確認は UpdatePasswordRequest（current_password ルール）が行う。
 */
final class UpdatePassword
{
    public function execute(User $user, string $newPassword): void
    {
        $user->password = Hash::make($newPassword);
        $user->save();
    }
}
