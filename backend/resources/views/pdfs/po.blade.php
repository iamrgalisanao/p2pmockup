<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>PO_{{ $po->ref_number }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            font-size: 11px;
            color: #333;
        }

        .header {
            margin-bottom: 30px;
        }

        .logo-section {
            float: left;
            width: 50%;
        }

        .po-meta {
            float: right;
            width: 40%;
            text-align: right;
        }

        .clearfix {
            clear: both;
        }

        .section-title {
            font-weight: bold;
            background: #eee;
            padding: 5px;
            margin-top: 15px;
        }

        .address-box {
            width: 100%;
            margin-top: 15px;
        }

        .address-col {
            display: inline-block;
            width: 48%;
            vertical-align: top;
        }

        .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .item-table th,
        .item-table td {
            border: 1px solid #ccc;
            padding: 6px;
            text-align: left;
        }

        .item-table th {
            background: #f0f0f0;
        }

        .totals {
            margin-top: 20px;
            float: right;
            width: 30%;
        }

        .totals-row {
            border-bottom: 1px solid #ddd;
            padding: 5px 0;
        }

        .grand-total {
            font-weight: bold;
            font-size: 13px;
            border-bottom: 2px solid #333;
        }

        .terms {
            margin-top: 40px;
            border-top: 1px dashed #ccc;
            padding-top: 10px;
        }

        .signature-area {
            margin-top: 60px;
        }

        .sign {
            display: inline-block;
            width: 30%;
            border-top: 1px solid #000;
            text-align: center;
            padding-top: 5px;
            margin-right: 3%;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="logo-section">
            <h2 style="color: #2c3e50;">{{ strtoupper($po->type == 'purchase_order' ? 'Purchase Order' : 'Job Order') }}
            </h2>
            <strong>{{ config('app.name') }}</strong><br>
            Procurement Department
        </div>
        <div class="po-meta">
            <h3 style="margin: 0;">{{ $po->ref_number }}</h3>
            Date: {{ $po->issued_at->format('M d, Y') }}<br>
            PR Ref: {{ $po->requisition->ref_number }}
        </div>
        <div class="clearfix"></div>
    </div>

    <div class="address-box">
        <div class="address-col">
            <strong>VENDOR:</strong><br>
            {{ $po->vendor->name }}<br>
            {{ $po->vendor->address ?? 'No address provided' }}<br>
            Attn: {{ $po->vendor->contact_person ?? 'N/A' }}<br>
            Phone: {{ $po->vendor->phone ?? 'N/A' }}
        </div>
        <div class="address-col">
            <strong>DELIVERY TO:</strong><br>
            {{ $po->requisition->department->name }}<br>
            {{ $po->site_address ?? 'Main Office' }}<br>
            Terms: {{ $po->delivery_terms ?? 'F.O.B Destination' }}<br>
            Payment: {{ $po->payment_terms ?? 'Net 30' }}
        </div>
    </div>

    @if($po->type == 'job_order')
        <div class="section-title">SCOPE OF WORK</div>
        <div style="padding: 10px; border: 1px solid #eee;">
            {{ $po->scope_of_work }}<br>
            <strong>Completion Date:</strong>
            {{ $po->completion_date ? $po->completion_date->format('M d, Y') : 'As agreed' }}
        </div>
    @endif

    <table class="item-table">
        <thead>
            <tr>
                <th width="5%">Item</th>
                <th>Description / Specification</th>
                <th width="10%">Qty</th>
                <th width="10%">Unit</th>
                <th width="15%">Unit Price</th>
                <th width="15%">Line Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($po->lineItems as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->description }}</td>
                    <td>{{ number_format($item->quantity, 2) }}</td>
                    <td>{{ $item->unit }}</td>
                    <td>{{ number_format($item->unit_price, 2) }}</td>
                    <td>{{ number_format($item->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-row">Subtotal: <span style="float: right;">{{ number_format($po->subtotal, 2) }}</span></div>
        <div class="totals-row">Tax: <span style="float: right;">{{ number_format($po->tax, 2) }}</span></div>
        <div class="totals-row grand-total">GRAND TOTAL: <span
                style="float: right;">{{ number_format($po->grand_total, 2) }}</span></div>
    </div>
    <div class="clearfix"></div>

    <div class="terms">
        <strong>Terms & Conditions:</strong><br>
        1. Please include the PO number on all invoices and correspondence.<br>
        2. Goods are subject to inspection and approval upon delivery.<br>
        3. Standard 30-day payment terms apply unless otherwise specified above.
    </div>

    <div class="signature-area">
        <div class="sign">
            {{ $po->issuedBy->name }}<br>
            <small>Procurement Officer</small>
        </div>
        <div class="sign" style="float: right;">
            Client Authorized Signature<br>
            <small>Director / Finance Head</small>
        </div>
    </div>
</body>

</html>