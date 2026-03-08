<x-mail::message>
    # RFP Status Update: {{ $rfpRef }}

    Hello,

    The status of your Request for Payment (RFP) **"{{ $title }}"** has been updated.

    **New Status:** {{ strtoupper(str_replace('_', ' ', $newStatus)) }}
    **Previous Status:** {{ strtoupper(str_replace('_', ' ', $oldStatus)) }}

    @if($commentText)
        **Comment:** {{ $commentText }}
    @endif

    <x-mail::button :url="config('app.frontend_url') . '/payments/' . $paymentRequest->id">
        View RFP Details
    </x-mail::button>

    Thanks,<br>
    {{ config('app.name') }}
</x-mail::message>