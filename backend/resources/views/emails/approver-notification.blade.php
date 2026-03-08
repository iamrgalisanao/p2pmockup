<x-mail::message>
    # Approval Required: {{ $requisition->ref_number }}

    Hello,

    A procurement requisition requires your approval. Please review the details below:

    **Title:** {{ $requisition->title }}
    **Department:** {{ $requisition->department->name }}
    **Requested By:** {{ $requisition->creator->name }}
    **Date Needed:** {{ $requisition->date_needed->format('M d, Y') }}
    **Estimated Total:** PHP {{ number_format($requisition->estimated_total, 2) }}

    ### Line Items
    <x-mail::table>
        | Description | Qty | Unit | Total |
        | :--- | :--- | :--- | :--- |
        @foreach($requisition->lineItems as $item)
            | {{ $item->description }} | {{ $item->quantity }} | {{ $item->unit }} | PHP
            {{ number_format($item->line_total, 2) }} |
        @endforeach
    </x-mail::table>

    **Current Step:** {{ $step->step_label }}

    You can take action directly from this email by clicking one of the buttons below.

    <x-mail::button :url="$approveUrl" color="success">
        Approve Requisition
    </x-mail::button>

    <x-mail::button :url="$rejectUrl" color="error">
        Reject / Return
    </x-mail::button>

    *Note: These buttons use secure, time-limited links. If they expire, please log in to the P2P Portal to action the
    request.*

    If you need more details, you can [view the full requisition
    here]({{ config('app.frontend_url') }}/requisitions/{{ $requisition->id }}).

    Thanks,<br>
    {{ config('app.name') }}
</x-mail::message>