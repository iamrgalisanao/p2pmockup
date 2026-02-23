<x-mail::message>
    # URGENT: SLA Breach Notification

    Attention,

    The approval step **{{ $stepLabel }}** for Requisition **{{ $prRef }}** has breached its SLA deadline.

    **Details:**
    - **Requisition Reference:** {{ $prRef }}
    - **Approval Step:** {{ $stepLabel }}
    - **Deadline Was:** {{ $deadline }}

    Please take immediate action to resolve this bottleneck.

    <x-mail::button :url="config('app.frontend_url') . '/requisitions/' . $prRef">
        View Requisition
    </x-mail::button>

    Thanks,<br>
    {{ config('app.name') }}
</x-mail::message>