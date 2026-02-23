<?php

namespace App\Mail;

use App\Models\ApprovalStep;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SlaBreachNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $step;

    /**
     * Create a new message instance.
     */
    public function __construct(ApprovalStep $step)
    {
        $this->step = $step;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'URGENT: SLA Breach Notification - PR ' . $this->step->requisition->ref_number,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.sla.breach',
            with: [
                'stepLabel' => $this->step->step_label,
                'prRef' => $this->step->requisition->ref_number,
                'deadline' => $this->step->sla_deadline->toFormattedDateString(),
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
