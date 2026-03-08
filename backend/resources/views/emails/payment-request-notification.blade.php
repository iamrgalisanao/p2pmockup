<x-mail::message>
    # Payment Approval Required: {{ $paymentRequest->ref_number }}

    Hello,

    A Request for Payment (RFP) requires your approval. Please review the details below:

    **Title:** {{ $paymentRequest->title }}
    **Payee:** {{ $paymentRequest->vendor ? $paymentRequest->vendor->name : $paymentRequest->payee_name }}
    **Amount:** PHP {{ number_format($paymentRequest->amount, 2) }}
    **Due Date:** {{ $paymentRequest->due_date ? $paymentRequest->due_date->format('M d, Y') : 'N/A' }}

    ### Payment Items
    <x-mail::table>
        | Description | Qty | Unit | Total |
        | :--- | :--- | :--- | :--- |
        @foreach($paymentRequest->lineItems as $item)
            | {{ $item->description }} | {{ $item->quantity }} | {{ $item->unit }} | PHP
            {{ number_format($item->line_total, 2) }} |
        @endforeach
    </x-mail::table>

    **Current Step:** {{ $step->step_label }}

    You can take action directly from this email by clicking one of the buttons below.

    <x-mail::button :url="$approveUrl" color="success">
        Approve Payment
    </x-mail::button>

    <x-mail::button :url="$rejectUrl" color="error">
        Reject / Return
    </x-mail::button>

    *Note: These buttons use secure, time-limited links. If they expire, please log in to the P2P Portal to action the
    request.*

    If you need more details, you can [view the full RFP
    here]({{ config('app.frontend_url') }}/payments/{{ $paymentRequest->id }}).

    Thanks,<br>
    {{ config('app.name') }}
</x-mail::message>