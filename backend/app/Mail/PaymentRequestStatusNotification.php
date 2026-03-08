<?php

namespace App\Mail;

use App\Models\PaymentRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentRequestStatusNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $paymentRequest;
    public $oldStatus;
    public $newStatus;
    public $comment;

    /**
     * Create a new message instance.
     */
    public function __construct(PaymentRequest $paymentRequest, string $oldStatus, string $newStatus, ?string $comment = null)
    {
        $this->paymentRequest = $paymentRequest;
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
            subject: "Update on RFP {$this->paymentRequest->ref_number} [{$this->newStatus}]",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.payment-request-status',
            with: [
                'rfpRef' => $this->paymentRequest->ref_number,
                'title' => $this->paymentRequest->title,
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
