<x-mail::message>
    # Status Update: {{ $prRef }}

    Hello,

    The status of Requisition **{{ $prRef }}** ("{{ $title }}") has changed.

    **Previous Status:** {{ $oldStatus }}
    **New Status:** {{ $newStatus }}

    @if($commentText)
        **Comment given:**
        > {{ $commentText }}
    @endif

    <x-mail::button :url="config('app.frontend_url') . '/requisitions/' . $prRef">
        View Requisition
    </x-mail::button>

    Thanks,<br>
    {{ config('app.name') }}
</x-mail::message>