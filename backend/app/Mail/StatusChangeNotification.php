<?php

namespace App\Mail;

use App\Models\Requisition;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StatusChangeNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $requisition;
    public $oldStatus;
    public $newStatus;
    public $comment;

    /**
     * Create a new message instance.
     */
    public function __construct(Requisition $requisition, string $oldStatus, string $newStatus, ?string $comment = null)
    {
        $this->requisition = $requisition;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->comment = $comment;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Update on Requisition {$this->requisition->ref_number} [{$this->newStatus}]",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.status.change',
            with: [
                'prRef' => $this->requisition->ref_number,
                'title' => $this->requisition->title,
                'oldStatus' => $this->oldStatus,
                'newStatus' => $this->newStatus,
                'commentText' => $this->comment,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
