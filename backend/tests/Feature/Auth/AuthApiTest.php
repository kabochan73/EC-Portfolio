<?php

use App\Enums\UserRole;
use App\Models\User;

it('registers a customer and returns a token', function () {
    $this->postJson('/api/register', [
        'name' => 'Aoi Tanaka',
        'email' => 'aoi@example.com',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
    ])
        ->assertCreated()
        ->assertJsonPath('data.email', 'aoi@example.com')
        ->assertJsonPath('data.role', 'customer')
        ->assertJsonStructure(['data' => ['id', 'name', 'email', 'role'], 'token']);

    $user = User::where('email', 'aoi@example.com')->firstOrFail();
    expect($user->role)->toBe(UserRole::Customer)
        ->and($user->tokens()->count())->toBe(1);
});

it('rejects registration with a duplicate email', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/register', [
        'name' => 'X',
        'email' => 'taken@example.com',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('email');
});

it('rejects registration with an unconfirmed or short password', function () {
    $this->postJson('/api/register', [
        'name' => 'X', 'email' => 'x@example.com',
        'password' => 'short', 'password_confirmation' => 'nope',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('password');
});

it('logs in with correct credentials', function () {
    User::factory()->create(['email' => 'me@example.com', 'password' => bcrypt('correct-horse')]);

    $this->postJson('/api/login', ['email' => 'me@example.com', 'password' => 'correct-horse'])
        ->assertOk()
        ->assertJsonPath('data.email', 'me@example.com')
        ->assertJsonStructure(['data', 'token']);
});

it('rejects login with a wrong password', function () {
    User::factory()->create(['email' => 'me@example.com', 'password' => bcrypt('correct-horse')]);

    $this->postJson('/api/login', ['email' => 'me@example.com', 'password' => 'wrong'])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('email');
});

it('rejects login for an unknown email without leaking existence', function () {
    $this->postJson('/api/login', ['email' => 'ghost@example.com', 'password' => 'whatever'])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('email');
});

it('throttles repeated failed logins', function () {
    User::factory()->create(['email' => 'me@example.com', 'password' => bcrypt('correct-horse')]);

    foreach (range(1, 5) as $ignored) {
        $this->postJson('/api/login', ['email' => 'me@example.com', 'password' => 'wrong'])
            ->assertStatus(422);
    }

    $this->postJson('/api/login', ['email' => 'me@example.com', 'password' => 'wrong'])
        ->assertStatus(429);
});

it('returns the current user from /api/me', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id);
});

it('rejects /api/me without a token', function () {
    $this->getJson('/api/me')->assertUnauthorized();
});

it('revokes the current token on logout', function () {
    $user = User::factory()->create();
    $token = $user->createToken('bff')->plainTextToken;

    $this->withToken($token)->postJson('/api/logout')->assertNoContent();

    expect($user->tokens()->count())->toBe(0);
});

it('rejects a token older than the expiration (30 days)', function () {
    $token = User::factory()->create()->createToken('bff')->plainTextToken;

    $this->travel(31)->days();

    $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
});

it('throttles registrations per client IP', function () {
    foreach (range(1, 5) as $i) {
        $this->postJson('/api/register', [
            'name' => "User {$i}",
            'email' => "user{$i}@example.com",
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();
    }

    $this->postJson('/api/register', [
        'name' => 'User 6',
        'email' => 'user6@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertStatus(429);
});

it('rate-limits by the client IP forwarded by the BFF, not the BFF itself', function () {
    $forgot = fn (string $ip, string $secret = 'bff_test_secret') => $this->postJson(
        '/api/forgot-password',
        ['email' => 'nobody@example.com'],
        ['X-Client-IP' => $ip, 'X-BFF-Secret' => $secret],
    );

    foreach (range(1, 6) as $ignored) {
        $forgot('203.0.113.1')->assertOk();
    }
    $forgot('203.0.113.1')->assertStatus(429);

    // 別のクライアントは BFF が同じでも制限されない
    $forgot('203.0.113.2')->assertOk();
});

it('ignores a forwarded client IP without the shared secret', function () {
    foreach (range(1, 6) as $i) {
        $this->postJson('/api/forgot-password', ['email' => 'nobody@example.com'],
            ['X-Client-IP' => "203.0.113.{$i}", 'X-BFF-Secret' => 'wrong'])->assertOk();
    }

    // IP を偽っても接続元 IP で数えられるので 7 回目は制限される
    $this->postJson('/api/forgot-password', ['email' => 'nobody@example.com'],
        ['X-Client-IP' => '203.0.113.99', 'X-BFF-Secret' => 'wrong'])->assertStatus(429);
});
