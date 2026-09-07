<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * メール＋パスワードでの認証（docs/03-api.md POST /api/login）。
 * 失敗は 422（ValidationException）で email フィールドにメッセージを付ける。
 * ユーザーの有無で応答を変えない（タイミング差を減らすため常に Hash::check する）。
 */
final class AuthenticateUser
{
    public function execute(string $email, string $password): User
    {
        $user = User::where('email', $email)->first();

        if ($user === null || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        return $user;
    }
}
