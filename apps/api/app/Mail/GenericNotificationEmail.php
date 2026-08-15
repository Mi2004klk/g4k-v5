<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GenericNotificationEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $title;
    public $body;
    public $link;

    public function __construct(string $title, string $body, ?string $link = null)
    {
        $this->title = $title;
        $this->body = $body;
        $this->link = $link;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->title,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.generic-notification',
        );
    }
}
