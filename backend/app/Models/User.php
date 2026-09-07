<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Jobs\SendEmailVerificationJob;
use App\Jobs\SendPasswordResetJob;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** @var list<string> */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /** @var list<string> */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    /**
     * 検証メールは自前 Mailable（docs/10-email.md）。標準の Notification 経路ではなく
     * キュージョブで送る。
     */
    public function sendEmailVerificationNotification(): void
    {
        SendEmailVerificationJob::dispatch($this->id);
    }

    /**
     * パスワード再設定通知も自前 Mailable（docs/10-email.md）。Password broker から呼ばれる。
     */
    public function sendPasswordResetNotification($token): void
    {
        SendPasswordResetJob::dispatch($this->id, $token);
    }

    /** @return HasMany<Address, $this> */
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
