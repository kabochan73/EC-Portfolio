<?php

use App\Jobs\SendEmailVerificationJob;
use App\Mail\VerifyEmailMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;

function verifyUrlFor(User $user, ?string $hash = null): string
{
    return URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->getKey(), 'hash' => $hash ?? sha1($user->getEmailForVerification())],
        absolute: false,
    );
}

it('queues a verification job on registration', function () {
    Queue::fake();

    $this->postJson('/api/register', [
        'name' => 'Aoi', 'email' => 'aoi@example.com',
        'password' => 'secret-password', 'password_confirmation' => 'secret-password',
    ])->assertCreated();

    Queue::assertPushed(SendEmailVerificationJob::class);
});

it('sends the mail with a frontend link when the job runs', function () {
    Mail::fake();
    $user = User::factory()->unverified()->create(['email' => 'aoi@example.com', 'name' => 'Aoi']);

    (new SendEmailVerificationJob($user->id))->handle();

    Mail::assertSent(VerifyEmailMail::class, function (VerifyEmailMail $mail) {
        return $mail->hasTo('aoi@example.com')
            && str_starts_with($mail->verifyUrl, config('app.frontend_url').'/verify-email?')
            && str_contains($mail->verifyUrl, 'signature=');
    });
});

it('does not send the mail if the user is already verified', function () {
    Mail::fake();
    $user = User::factory()->create(); // verified

    (new SendEmailVerificationJob($user->id))->handle();

    Mail::assertNothingSent();
});

it('verifies the email with a valid signed link', function () {
    $user = User::factory()->unverified()->create();

    $this->getJson(verifyUrlFor($user))->assertNoContent();

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('rejects a link whose hash does not match the current email', function () {
    $user = User::factory()->unverified()->create();

    $this->getJson(verifyUrlFor($user, hash: sha1('someone-else@example.com')))
        ->assertForbidden();

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('rejects an expired link', function () {
    $user = User::factory()->unverified()->create();
    $url = URL::temporarySignedRoute(
        'verification.verify',
        now()->subMinute(),
        ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())],
        absolute: false,
    );

    $this->getJson($url)->assertForbidden();
});

it('rejects an unsigned link', function () {
    $user = User::factory()->unverified()->create();

    $this->getJson("/api/email/verify/{$user->id}/".sha1($user->email))
        ->assertForbidden();
});

it('is a no-op (204) when verifying an already verified email', function () {
    $user = User::factory()->create();

    $this->getJson(verifyUrlFor($user))->assertNoContent();
});

it('resends the verification mail for an unverified user', function () {
    Queue::fake();
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->postJson('/api/email/verification-notification')
        ->assertStatus(202);

    Queue::assertPushed(SendEmailVerificationJob::class);
});

it('returns 204 without queuing when resend is called by a verified user', function () {
    Queue::fake();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/email/verification-notification')
        ->assertNoContent();

    Queue::assertNotPushed(SendEmailVerificationJob::class);
});

it('requires authentication to resend', function () {
    $this->postJson('/api/email/verification-notification')->assertUnauthorized();
});

it('queues a re-verification when the profile email changes', function () {
    Queue::fake();
    $user = User::factory()->create(['email' => 'before@example.com']);

    $this->actingAs($user)
        ->putJson('/api/me', ['name' => $user->name, 'email' => 'after@example.com'])
        ->assertOk();

    Queue::assertPushed(SendEmailVerificationJob::class);
});
