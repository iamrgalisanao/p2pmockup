<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

use App\Models\Requisition;
use App\Models\ApprovalStep;
use Illuminate\Support\Facades\URL;

class ApproverNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $requisition;
    public $step;
    public $approveUrl;
    public $rejectUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(Requisition $requisition, ApprovalStep $step)
    {
        $this->requisition = $requisition;
        $this->step = $step;

        // Generate Signed URLs for the email buttons
        // These will expire in 48 hours
        $this->approveUrl = URL::temporarySignedRoute(
            'approval.email.action',
            now()->addHours(48),
            ['step' => $step->id, 'action' => 'approved']
        );

        $this->rejectUrl = URL::temporarySignedRoute(
            'approval.email.action',
            now()->addHours(48),
            ['step' => $step->id, 'action' => 'rejected']
        );
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Action Required: Approval for {$this->requisition->ref_number} - {$this->requisition->title}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.approver-notification',
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
