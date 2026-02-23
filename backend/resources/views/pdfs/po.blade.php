<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ strtoupper($po->type == 'purchase_order' ? 'PO' : 'JO') }}_{{ $po->ref_number }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #334155;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }

        .letterhead {
            width: 100%;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }

        .letterhead table {
            width: 100%;
            border-collapse: collapse;
        }

        .logo-cell {
            width: 70px;
            vertical-align: middle;
        }

        .logo-circle {
            width: 55px;
            height: 55px;
            background-color: #0f172a;
            color: #ffffff;
            border-radius: 50%;
            text-align: center;
            line-height: 55px;
            font-weight: 900;
            font-size: 24px;
            font-family: serif;
        }

        .info-cell {
            vertical-align: middle;
            text-align: left;
        }

        .company-name {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 1px;
            margin: 0 0 4px 0;
            text-transform: uppercase;
        }

        .company-details {
            font-size: 10px;
            color: #64748b;
            margin: 0;
            line-height: 1.4;
        }

        .doc-title-container {
            width: 100%;
            margin-bottom: 30px;
            overflow: hidden;
        }

        .doc-title-area {
            float: left;
            width: 50%;
        }

        .doc-title {
            text-align: left;
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #0f172a;
            margin: 0;
            padding: 5px 0;
            border-bottom: 2px solid #0f172a;
            display: inline-block;
        }

        .po-meta {
            float: right;
            width: 45%;
            text-align: right;
        }

        .po-meta table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }

        .po-meta td {
            text-align: left;
            padding: 2px;
        }

        .po-meta td:first-child {
            text-align: right;
            font-weight: 700;
            color: #475569;
            width: 40%;
            padding-right: 10px;
        }

        .po-meta td:last-child {
            font-weight: 900;
            color: #0f172a;
        }

        .address-box {
            width: 100%;
            margin-bottom: 30px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
        }

        .address-box table {
            width: 100%;
            border-collapse: collapse;
        }

        .address-col {
            width: 50%;
            vertical-align: top;
            padding: 15px;
            background-color: #f8fafc;
        }

        .address-col:first-child {
            border-right: 1px solid #cbd5e1;
        }

        .address-header {
            font-size: 10px;
            font-weight: 900;
            color: #94a3b8;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 8px;
            border-bottom: 1px dashed #e2e8f0;
            padding-bottom: 4px;
        }

        .address-content {
            font-size: 12px;
            color: #1e293b;
            line-height: 1.5;
        }

        .section-title {
            font-weight: 900;
            font-size: 12px;
            color: #0f172a;
            background: #e2e8f0;
            padding: 8px 12px;
            margin-top: 20px;
            margin-bottom: 15px;
            border-radius: 4px;
            letter-spacing: 1px;
        }

        .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
        }

        .item-table th,
        .item-table td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: center;
        }

        .item-table th {
            background-color: #334155;
            color: #ffffff;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .item-table td:nth-child(2) {
            text-align: left;
            font-weight: 700;
        }

        .item-table td:first-child,
        .item-table th:first-child {
            width: 5%;
        }

        .totals-container {
            width: 100%;
            margin-top: 20px;
            overflow: hidden;
        }

        .totals {
            float: right;
            width: 40%;
            margin-bottom: 30px;
        }

        .totals table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals td {
            padding: 6px 10px;
            border-bottom: 1px solid #e2e8f0;
        }

        .totals td:first-child {
            font-weight: 700;
            color: #475569;
            text-align: left;
        }

        .totals td:last-child {
            text-align: right;
            font-weight: normal;
        }

        .totals .grand-total td {
            background-color: #f1f5f9;
            font-weight: 900;
            font-size: 14px;
            color: #0f172a;
            border-bottom: 2px solid #0f172a;
            padding: 10px;
        }

        .terms {
            margin-top: 40px;
            border-left: 3px solid #0f172a;
            padding-left: 15px;
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 0 8px 8px 0;
            font-size: 10px;
            clear: both;
            color: #475569;
        }

        .signature-area {
            margin-top: 60px;
            width: 100%;
        }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
        }

        .signature-table td {
            width: 45%;
            vertical-align: top;
        }

        .sign-line {
            border-top: 1px solid #000;
            width: 90%;
            margin-top: 60px;
            padding-top: 5px;
            font-weight: 700;
            font-size: 11px;
            color: #0f172a;
        }

        .sign-title {
            font-size: 10px;
            color: #64748b;
            font-weight: normal;
        }

        .sent-stamp {
            position: absolute;
            top: 250px;
            right: 20px;
            color: #dc2626;
            border: 3px solid #dc2626;
            padding: 10px 20px;
            transform: rotate(-15deg);
            font-weight: 900;
            font-size: 16px;
            letter-spacing: 2px;
            opacity: 0.6;
            border-radius: 8px;
            text-align: center;
        }
    </style>
</head>

<body>
    <!-- Corporate Letterhead -->
    <div class="letterhead">
        <table>
            <tr>
                <td class="logo-cell">
                    <div class="logo-circle">AE</div>
                </td>
                <td class="info-cell">
                    <h1 class="company-name">Apex Enterprises, Inc.</h1>
                    <p class="company-details">
                        39th Floor, Apex Tower, McKinley Parkway, BGC, Taguig 1634<br>
                        Phone: (+632) 8123-4567 | Email: procurement@apex.com.ph<br>
                        TIN: 000-123-456-000 | Web: www.apex-enterprises.com.ph
                    </p>
                </td>
            </tr>
        </table>
    </div>

    <!-- Document Info & Title -->
    <div class="doc-title-container">
        <div class="doc-title-area">
            <h2 class="doc-title">{{ strtoupper($po->type == 'purchase_order' ? 'PURCHASE ORDER' : 'JOB ORDER') }}</h2>
        </div>
        <div class="po-meta">
            <table>
                <tr>
                    <td>C.O. No.:</td>
                    <td style="font-size: 14px; background: #f1f5f9; padding: 4px;">{{ $po->ref_number }}</td>
                </tr>
                <tr>
                    <td>Date:</td>
                    <td>{{ $po->issued_at->format('F d, Y') }}</td>
                </tr>
                <tr>
                    <td>PR Reference:</td>
                    <td>{{ $po->requisition->ref_number }}</td>
                </tr>
                <tr>
                    <td>Terms:</td>
                    <td>{{ $po->payment_terms ?? 'NET 30 DAYS' }}</td>
                </tr>
            </table>
        </div>
    </div>

    @if($po->sent_at)
        <div class="sent-stamp">
            RELEASED<br>
            <span style="font-size: 10px;">{{ $po->sent_at->format('Y-m-d H:i') }}</span>
        </div>
    @endif

    <!-- Addresses Block -->
    <div class="address-box">
        <table>
            <tr>
                <td class="address-col">
                    <div class="address-header">SUPPLIER / VENDOR:</div>
                    <div class="address-content">
                        <strong>{{ strtoupper($po->vendor->name) }}</strong><br>
                        {{ $po->vendor->address ?? 'Address not specified' }}<br>
                        @if($po->vendor->contact_person)
                            <br>Attn: {{ $po->vendor->contact_person }}<br>
                        @endif
                        @if($po->vendor->phone)
                            Phone: {{ $po->vendor->phone }}
                        @endif
                    </div>
                </td>
                <td class="address-col">
                    <div class="address-header">DELIVER TO:</div>
                    <div class="address-content">
                        <strong>{{ strtoupper($po->requisition->department->name) }}</strong><br>
                        {{ $po->site_address ?? 'Apex Enterprises, Inc. - Main Office' }}<br>
                        <br>
                        Deliver Date:
                        {{ $po->requisition->date_needed ? date('M d, Y', strtotime($po->requisition->date_needed)) : 'ASAP' }}<br>
                        Requested By: {{ $po->requisition->requester->name }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    @if($po->type == 'job_order')
        <div class="section-title">SCOPE OF WORK / SERVICE AGREEMENT</div>
        <div style="padding: 15px; border: 1px solid #cbd5e1; background: #f8fafc; margin-bottom: 20px; line-height: 1.6;">
            {{ $po->scope_of_work ?? 'Service execution according to the attached terms and referenced quotation.' }}<br>
            <br>
            <strong style="color:#0f172a;">Target Completion:</strong>
            {{ $po->completion_date ? $po->completion_date->format('M d, Y') : 'Per agreed milestone schedule.' }}
        </div>
    @endif

    <!-- Line Items Table -->
    <table class="item-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Particulars / Specifications</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Unit Price (PHP)</th>
                <th>Total (PHP)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($po->lineItems as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->description }}</td>
                    <td>{{ number_format($item->quantity, 2) }}</td>
                    <td>{{ strtoupper($item->unit) }}</td>
                    <td>{{ number_format($item->unit_price, 2) }}</td>
                    <td style="font-weight: 700;">{{ number_format($item->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals-container">
        <div class="totals">
            <table>
                <tr>
                    <td>Gross Amount:</td>
                    <td>{{ number_format($po->subtotal ?? $po->lineItems->sum('line_total'), 2) }}</td>
                </tr>
                <tr>
                    <td>Value Added Tax (VAT):</td>
                    <td>{{ number_format($po->tax ?? 0, 2) }}</td>
                </tr>
                <tr class="grand-total">
                    <td>TOTAL AMOUNT:</td>
                    <td>PHP {{ number_format($po->grand_total ?? $po->lineItems->sum('line_total'), 2) }}</td>
                </tr>
            </table>
        </div>
    </div>

    <!-- Terms and Signatures -->
    <div class="terms">
        <strong style="color:#0f172a; font-size: 11px; margin-bottom: 5px; display: block;">GENERAL TERMS AND
            CONDITIONS:</strong>
        1. Please state this {{ $po->type == 'purchase_order' ? 'Purchase' : 'Job' }} Order number on all invoices,
        delivery receipts, and correspondence.<br>
        2. Items delivered are subject to physical inspection and quality validation by the end-user prior to
        acceptance.<br>
        3. Payment processing begins upon receipt of the original complete billing documents (Invoice, DR, and PO
        copy).<br>
        4. Supplier agrees to comply with all applicable corporate policies on standard business ethics and guidelines.
    </div>

    <div class="signature-area">
        <table class="signature-table">
            <tr>
                <td>
                    PREPARED & APPROVED BY:<br>
                    <div class="sign-line">
                        {{ strtoupper($po->issuedBy->name) }}<br>
                        <span class="sign-title">Procurement Officer</span><br>
                        <span class="sign-title">Apex Enterprises, Inc.</span>
                    </div>
                </td>
                <td style="padding-left: 20px;">
                    ACKNOWLEDGED & CONFORME BY:<br>
                    <div class="sign-line">
                        {{ strtoupper($po->vendor->name) }}<br>
                        <span class="sign-title">Authorized Representative Signature</span><br>
                        <span class="sign-title">Date: ________________________</span>
                    </div>
                </td>
            </tr>
        </table>
    </div>

</body>

</html>