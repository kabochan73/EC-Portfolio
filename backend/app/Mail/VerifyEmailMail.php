<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * メールアドレス確認（docs/10-email.md）。
 * 装飾のモノトーン化は Phase 5（メール送信基盤）で。
 */
class VerifyEmailMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $recipientName,
        public string $verifyUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[EC-PORTFOLIO] メールアドレスの確認',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.verify-email',
        );
    }
}
