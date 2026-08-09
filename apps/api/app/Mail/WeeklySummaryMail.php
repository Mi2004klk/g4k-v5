<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WeeklySummaryMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $metrics;

    public function __construct(User $user, array $metrics)
    {
        $this->user = $user;
        $this->metrics = $metrics;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Weekly Organization Productivity & Summary Report',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.weekly-summary',
        );
    }
}
