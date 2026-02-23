<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $requisition->ref_number }}</title>
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
            margin-bottom: 30px;
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

        .doc-title {
            text-align: center;
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 30px;
            color: #0f172a;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 10px;
            display: inline-block;
            width: 100%;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
        }

        .meta-table td {
            padding: 8px 12px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
        }

        .meta-table .label {
            background-color: #f8fafc;
            font-weight: 900;
            color: #475569;
            width: 15%;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .meta-table .value {
            width: 35%;
            font-weight: 700;
            color: #0f172a;
        }

        .section-title {
            font-weight: 900;
            font-size: 12px;
            color: #0f172a;
            background: #e2e8f0;
            padding: 8px 12px;
            margin-top: 20px;
            border-radius: 4px;
            letter-spacing: 1px;
        }

        .item-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 30px;
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
            color: #0f172a;
        }

        .total-row td {
            font-weight: 900 !important;
            background-color: #f1f5f9;
            font-size: 12px;
            color: #0f172a;
        }

        .signature-area {
            width: 100%;
            margin-top: 40px;
            border-top: 1px solid #cbd5e1;
            padding-top: 20px;
        }

        .signature-table {
            width: 100%;
            table-layout: fixed;
        }

        .signature-table td {
            vertical-align: top;
            padding: 10px 5px;
        }

        .sign-block {
            margin-top: 10px;
        }

        .sign-line {
            border-top: 1px solid #0f172a;
            width: 90%;
            margin-top: 50px;
            padding-top: 5px;
            font-weight: 700;
            font-size: 11px;
            color: #0f172a;
            text-transform: uppercase;
        }

        .sign-title {
            font-size: 9px;
            color: #64748b;
            font-weight: normal;
            display: block;
            margin-top: 2px;
        }

        .approval-badge {
            display: inline-block;
            padding: 2px 6px;
            background: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 4px;
            letter-spacing: 0.5px;
        }

        .pending-badge {
            display: inline-block;
            padding: 2px 6px;
            background: #fffbeb;
            color: #92400e;
            border: 1px solid #fde68a;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 4px;
            letter-spacing: 0.5px;
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
    <div class="doc-title">PURCHASE REQUISITION</div>

    <table class="meta-table">
        <tr>
            <td class="label">Reference No:</td>
            <td class="value">{{ $requisition->ref_number }}</td>
            <td class="label">Filing Date:</td>
            <td class="value">{{ $requisition->created_at->format('F d, Y') }}</td>
        </tr>
        <tr>
            <td class="label">Department:</td>
            <td class="value">{{ strtoupper($requisition->department->name) }}</td>
            <td class="label">Date Needed:</td>
            <td class="value">{{ $requisition->date_needed->format('M d, Y') }}</td>
        </tr>
        <tr>
            <td class="label">Project / Cost Center:</td>
            <td class="value">{{ $requisition->project->name ?? 'N/A' }} / {{ $requisition->cost_center ?? 'N/A' }}</td>
            <td class="label">Priority Level:</td>
            <td class="value">{{ strtoupper($requisition->priority) }}</td>
        </tr>
        <tr>
            <td class="label">Purpose / Title:</td>
            <td class="value" colspan="3" style="font-size: 13px;">{{ strtoupper($requisition->title) }}</td>
        </tr>
        @if($requisition->particulars)
            <tr>
                <td class="label">Particulars:</td>
                <td class="value" colspan="3" style="font-weight: normal; font-size: 11px;">
                    {{ nl2br(e($requisition->particulars)) }}</td>
            </tr>
        @endif
    </table>

    <div class="section-title">BILL OF QUANTITIES (BOQ)</div>
    <table class="item-table">
        <thead>
            <tr>
                <th width="3%">#</th>
                <th width="42%">Description & Specifications</th>
                <th width="10%">Qty</th>
                <th width="10%">Unit</th>
                <th width="15%">Est. Unit Cost</th>
                <th width="20%">Line Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($requisition->lineItems as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        {{ $item->description }}
                        @if($item->specification)
                            <br><span
                                style="font-weight: normal; color: #64748b; font-size: 10px;">{{ $item->specification }}</span>
                        @endif
                        @if($item->gl_account_code)
                            <br><span style="font-weight: bold; color: #94a3b8; font-size: 9px; letter-spacing: 0.5px;">GL:
                                {{ $item->gl_account_code }}</span>
                        @endif
                    </td>
                    <td>{{ number_format($item->quantity, 2) }}</td>
                    <td>{{ strtoupper($item->unit) }}</td>
                    <td>{{ number_format($item->estimated_unit_cost, 2) }}</td>
                    <td style="font-weight: 700;">{{ number_format($item->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="5" style="text-align: right; padding-right: 15px;">TOTAL ESTIMATED BUDGET (PHP):</td>
                <td style="text-align: center;">{{ number_format($requisition->estimated_total, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="section-title" style="margin-bottom: 5px;">AUTHORIZATIONS</div>
    <div class="signature-area">
        <table class="signature-table">
            <tr>
                <!-- Requester Block -->
                <td>
                    <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Requested
                        By:</div>
                    <div class="sign-block">
                        <div class="sign-line">
                            {{ strtoupper($requisition->requester->name) }}<br>
                            <span class="sign-title">Requisitioner</span>
                            <span class="approval-badge">SUBMITTED ON:
                                {{ $requisition->created_at->format('M d, Y') }}</span>
                        </div>
                    </div>
                </td>

                <!-- Approver Blocks -->
                @foreach($requisition->approvalSteps as $step)
                    <td>
                        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                            {{ $step->step_label }}:</div>
                        <div class="sign-block">
                            <div class="sign-line">
                                {{ $step->action == 'approved' && $step->approver ? strtoupper($step->approver->name) : '____________________' }}<br>
                                <span class="sign-title">Authorized Check & Approval</span>
                                @if($step->action == 'approved')
                                    <span class="approval-badge">APPROVED: {{ $step->actioned_at->format('M d, Y') }}</span>
                                @else
                                    <span class="pending-badge">PENDING APPROVAL</span>
                                @endif
                            </div>
                        </div>
                    </td>

                    @if (($loop->index + 2) % 3 == 0)
                        </tr>
                        <tr>
                    @endif
                @endforeach
            </tr>
        </table>
    </div>

</body>

</html>