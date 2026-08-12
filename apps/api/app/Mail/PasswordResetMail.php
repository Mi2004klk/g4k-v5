<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
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
     * Build the message.
     */
    public function build(): self
    {
        $resetUrl = rtrim(config('app.frontend_url', config('app.url')), '/')
                  . '/reset-password?token=' . $this->token . '&email=' . urlencode($this->email);
                  
        return $this->subject('Reset your Games4king password')
                    ->view('emails.password-reset', ['resetUrl' => $resetUrl]);
    }
}
