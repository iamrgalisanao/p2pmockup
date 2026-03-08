<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

use App\Models\PaymentRequest;
use App\Models\PaymentApproval;
use Illuminate\Support\Facades\URL;

class PaymentRequestApproverNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $paymentRequest;
    public $step;
    public $approveUrl;
    public $rejectUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(PaymentRequest $paymentRequest, PaymentApproval $step)
    {
        $this->paymentRequest = $paymentRequest;
        $this->step = $step;

        // Generate Signed URLs for the email buttons
        // type=payment helps the controller distinguish
        $this->approveUrl = URL::temporarySignedRoute(
            'approval.email.action',
            now()->addHours(48),
            ['step' => $step->id, 'action' => 'approved', 'type' => 'payment']
        );

        $this->rejectUrl = URL::temporarySignedRoute(
            'approval.email.action',
            now()->addHours(48),
            ['step' => $step->id, 'action' => 'rejected', 'type' => 'payment']
        );
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Action Required: Payment Approval for {$this->paymentRequest->ref_number} - {$this->paymentRequest->title}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.payment-request-notification',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
