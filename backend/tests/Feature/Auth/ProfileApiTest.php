<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('updates the name without touching verification', function () {
    $user = User::factory()->create(['name' => 'Old', 'email' => 'keep@example.com']);

    $this->actingAs($user)
        ->putJson('/api/me', ['name' => 'New Name', 'email' => 'keep@example.com'])
        ->assertOk()
        ->assertJsonPath('data.name', 'New Name')
        ->assertJsonPath('data.email_verified', true);

    expect($user->fresh()->email_verified_at)->not->toBeNull();
});

it('resets email verification when the email changes', function () {
    $user = User::factory()->create(['email' => 'before@example.com']);

    $this->actingAs($user)
        ->putJson('/api/me', ['name' => $user->name, 'email' => 'after@example.com'])
        ->assertOk()
        ->assertJsonPath('data.email', 'after@example.com')
        ->assertJsonPath('data.email_verified', false);

    expect($user->fresh()->email_verified_at)->toBeNull();
});

it('rejects an email already used by another user', function () {
    User::factory()->create(['email' => 'taken@example.com']);
    $user = User::factory()->create(['email' => 'mine@example.com']);

    $this->actingAs($user)
        ->putJson('/api/me', ['name' => $user->name, 'email' => 'taken@example.com'])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('email');
});

it('allows keeping the same email (unique ignores self)', function () {
    $user = User::factory()->create(['email' => 'same@example.com']);

    $this->actingAs($user)
        ->putJson('/api/me', ['name' => 'Renamed', 'email' => 'same@example.com'])
        ->assertOk();
});

it('changes the password when the current one is correct', function () {
    $user = User::factory()->create(['password' => Hash::make('old-password')]);

    $this->actingAs($user)
        ->putJson('/api/me/password', [
            'current_password' => 'old-password',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertNoContent();

    expect(Hash::check('brand-new-password', $user->fresh()->password))->toBeTrue();
});

it('rejects a password change with the wrong current password', function () {
    $user = User::factory()->create(['password' => Hash::make('old-password')]);

    $this->actingAs($user)
        ->putJson('/api/me/password', [
            'current_password' => 'not-it',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('current_password');
});

it('rejects a new password identical to the current one', function () {
    $user = User::factory()->create(['password' => Hash::make('same-password')]);

    $this->actingAs($user)
        ->putJson('/api/me/password', [
            'current_password' => 'same-password',
            'password' => 'same-password',
            'password_confirmation' => 'same-password',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('password');
});

it('requires authentication for profile endpoints', function () {
    $this->putJson('/api/me', ['name' => 'X', 'email' => 'x@example.com'])->assertUnauthorized();
    $this->putJson('/api/me/password', [])->assertUnauthorized();
});
