<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public $token;
    public $email;

    /**
     * Create a new message instance.
     */
    public function __construct($token, $email)
    {
        $this->token = $token;
        $this->email = $email;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Password Reset Mail',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'view.name',
        );
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        $resetLink = rtrim($frontendUrl, '/') . "/reset-password?token={$this->token}&email=" . urlencode($this->email);

        return $this->subject('Password Reset Request')
            ->html("
                <h2>Password Reset</h2>
                <p>You are receiving this email because we received a password reset request for your account.</p>
                <p><a href=\"{$resetLink}\">Click here to reset your password</a></p>
                <p>This password reset link will expire in 60 minutes.</p>
                <p>If you did not request a password reset, no further action is required.</p>
            ");
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
