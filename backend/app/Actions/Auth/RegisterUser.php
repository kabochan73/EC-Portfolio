<?php

namespace App\Actions\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * 会員登録（docs/03-api.md POST /api/register）。
 * 検証メールの送信は Step 16（メール認証フロー）で dispatch を足す。
 */
final class RegisterUser
{
    public function execute(string $name, string $email, string $password): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => UserRole::Customer,
        ]);
    }
}
