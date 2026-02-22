<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>{{ $requisition->ref_number }}</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            font-size: 12px;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #444;
            padding-bottom: 10px;
        }

        .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-top: 20px;
            border-bottom: 1px solid #ddd;
        }

        .meta-table {
            width: 100%;
            margin-top: 10px;
        }

        .meta-table td {
            padding: 4px;
            vertical-align: top;
        }

        .label {
            font-weight: bold;
            width: 120px;
        }

        .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .item-table th,
        .item-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        .item-table th {
            background-color: #f5f5f5;
            font-weight: bold;
        }

        .total-row td {
            font-weight: bold;
            background-color: #fafafa;
        }

        .footer {
            margin-top: 50px;
        }

        .signature-box {
            display: inline-block;
            width: 30%;
            margin-right: 3%;
            text-align: center;
            border-top: 1px solid #444;
            padding-top: 5px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>PURCHASE REQUISITION</h1>
        <div><strong>{{ config('app.name') }}</strong></div>
    </div>

    <table class="meta-table">
        <tr>
            <td class="label">Reference No:</td>
            <td>{{ $requisition->ref_number }}</td>
            <td class="label">Date Created:</td>
            <td>{{ $requisition->created_at->format('M d, Y') }}</td>
        </tr>
        <tr>
            <td class="label">Department:</td>
            <td>{{ $requisition->department->name }}</td>
            <td class="label">Date Needed:</td>
            <td>{{ $requisition->date_needed->format('M d, Y') }}</td>
        </tr>
        <tr>
            <td class="label">Project:</td>
            <td>{{ $requisition->project->name ?? 'N/A' }}</td>
            <td class="label">Priority:</td>
            <td style="text-transform: uppercase;">{{ $requisition->priority }}</td>
        </tr>
        <tr>
            <td class="label">Purpose:</td>
            <td colspan="3">{{ $requisition->title }}</td>
        </tr>
    </table>

    <div class="section-title">BILL OF QUANTITIES (BOQ)</div>
    <table class="item-table">
        <thead>
            <tr>
                <th width="5%">#</th>
                <th>Description</th>
                <th width="10%">Qty</th>
                <th width="10%">Unit</th>
                <th width="15%">Est. Unit Cost</th>
                <th width="15%">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($requisition->lineItems as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>
                        <strong>{{ $item->description }}</strong><br>
                        <small>{{ $item->specification }}</small>
                    </td>
                    <td>{{ number_format($item->quantity, 2) }}</td>
                    <td>{{ $item->unit }}</td>
                    <td>{{ number_format($item->estimated_unit_cost, 2) }}</td>
                    <td>{{ number_format($item->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="5" style="text-align: right;">ESTIMATED GRAND TOTAL:</td>
                <td>{{ number_format($requisition->estimated_total, 2) }}</td>
            </tr>
        </tfoot>
    </table>

    <div class="section-title">APPROVALS</div>
    <div class="footer">
        <div class="signature-box">
            Requested By:<br><br><br>
            <strong>{{ $requisition->requester->name }}</strong><br>
            <small>Requester</small>
        </div>

        @foreach($requisition->approvalSteps as $step)
            <div class="signature-box">
                {{ $step->step_label }}:<br><br><br>
                <strong>{{ $step->approver->name ?? '________________' }}</strong><br>
                <small>{{ $step->action == 'approved' ? 'Approved on ' . $step->actioned_at->format('M d, Y') : 'Pending' }}</small>
            </div>
        @endforeach
    </div>
</body>

</html>