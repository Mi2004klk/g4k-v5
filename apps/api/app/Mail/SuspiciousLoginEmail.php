<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Address;

class SuspiciousLoginEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $ipAddress;
    public $userAgent;

    /**
     * Create a new message instance.
     */
    public function __construct(string $ipAddress, string $userAgent)
    {
        $this->ipAddress = $ipAddress;
        $this->userAgent = $userAgent;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Login Detected - Games4king Workplace OS',
        );
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->html("
            <h2>New Login Detected</h2>
            <p>We detected a new login to your Games4king Workplace OS account from a new location or device.</p>
            <ul>
                <li><strong>IP Address:</strong> {$this->ipAddress}</li>
                <li><strong>Device/Browser:</strong> {$this->userAgent}</li>
                <li><strong>Time:</strong> " . now()->toDayDateTimeString() . "</li>
            </ul>
            <p>If this was you, you can safely ignore this email.</p>
            <p>If this wasn't you, please reset your password immediately or contact your administrator.</p>
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
