<?php

namespace App\Actions\Auth;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * 会員登録（docs/03-api.md POST /api/register）。作成後に検証メールを dispatch。
 */
final class RegisterUser
{
    public function execute(string $name, string $email, string $password): User
    {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => UserRole::Customer,
        ]);

        $user->sendEmailVerificationNotification();

        return $user;
    }
}
