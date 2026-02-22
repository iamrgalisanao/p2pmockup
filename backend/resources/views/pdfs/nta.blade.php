<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>NTA_{{ $nta->ref_number }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.5;
        }

        .header {
            margin-bottom: 40px;
            text-align: center;
        }

        .nta-meta {
            margin-bottom: 20px;
        }

        .clearfix {
            clear: both;
        }

        .section-title {
            font-weight: bold;
            font-size: 14px;
            text-decoration: underline;
            margin-bottom: 10px;
        }

        .content {
            margin-top: 20px;
            text-align: justify;
        }

        .signature-area {
            margin-top: 60px;
        }

        .sign {
            display: inline-block;
            width: 45%;
            margin-top: 40px;
        }

        .sent-stamp {
            position: fixed;
            bottom: 20px;
            right: 20px;
            color: #ccc;
            border: 2px solid #ccc;
            padding: 5px 10px;
            transform: rotate(-15deg);
            font-weight: bold;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1 style="margin-bottom: 5px;">NOTICE TO AWARD</h1>
        <div style="font-size: 12px; font-weight: bold;">{{ config('app.name') }}</div>
        <div>Procurement Department</div>
    </div>

    <div class="nta-meta">
        <strong>Reference No:</strong> {{ $nta->ref_number }}<br>
        <strong>Date:</strong> {{ $nta->issued_at->format('M d, Y') }}<br>
        <strong>Subject:</strong> {{ $nta->requisition->title }}
    </div>

    <div class="vendor-info" style="margin-top: 20px;">
        To: <strong>{{ $nta->vendor->name }}</strong><br>
        Attn: {{ $nta->vendor->contact_person ?? 'Manager' }}<br>
        {{ $nta->vendor->address }}
    </div>

    <div class="content">
        <p>Dear Sir/Madam,</p>

        <p>We are pleased to inform you that your quotation for
            <strong>&quot;{{ $nta->requisition->title }}&quot;</strong>
            with Reference No. <strong>{{ $nta->requisition->ref_number }}</strong> has been accepted by our Bids and
            Awards Committee / Procurement Team.</p>

        <p>The contract is hereby awarded to your company as the
            <strong>{{ $nta->award_basis === 'lowest_responsive_bid' ? 'Lowest Responsive Bidder' : 'Authorized Sourced Vendor' }}</strong>
            at a total contract price of <strong>PHP {{ number_format($nta->awardedQuote->grand_total, 2) }}</strong>.
        </p>

        <p>You are requested to coordinate with our procurement department for the signing of the formal
            contract/purchase order.
            Please note that no work shall commence until the official Purchase Order (PO) or Job Order (JO) has been
            issued.</p>

        <p>We look forward to a successful collaboration.</p>
    </div>

    <div class="signature-area">
        <div class="sign">
            Very truly yours,<br><br><br>
            <strong>{{ $nta->issuedBy->name }}</strong><br>
            Procurement Officer
        </div>

        <div class="sign" style="float: right;">
            Conforme:<br><br><br>
            __________________________<br>
            Authorized Representative
        </div>
    </div>

    @if($nta->sent_at)
        <div class="sent-stamp">
            SENT VIA SYSTEM<br>
            {{ $nta->sent_at->format('Y-m-d H:i') }}
        </div>
    @endif
</body>

</html>