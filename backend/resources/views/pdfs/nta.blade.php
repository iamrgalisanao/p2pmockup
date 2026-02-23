<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>NTA_{{ $nta->ref_number }}</title>
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

        .nta-meta {
            margin-bottom: 30px;
            width: 100%;
        }

        .nta-meta td {
            padding: 4px 0;
            vertical-align: top;
        }

        .nta-meta-label {
            width: 120px;
            font-weight: 700;
            color: #475569;
        }

        .vendor-info {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 30px;
        }

        .vendor-info strong {
            color: #0f172a;
            font-size: 12px;
        }

        .content {
            margin-top: 20px;
            text-align: justify;
            font-size: 12px;
            line-height: 1.8;
            color: #1e293b;
        }

        .amount-highlight {
            font-size: 14px;
            font-weight: 900;
            color: #0f172a;
            background-color: #f1f5f9;
            padding: 2px 8px;
            border-radius: 4px;
        }

        .signature-area {
            margin-top: 80px;
            width: 100%;
        }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
        }

        .signature-table td {
            width: 50%;
            vertical-align: top;
        }

        .sign-block {
            margin-top: 40px;
        }

        .sign-line {
            border-top: 1px solid #000;
            width: 80%;
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
            top: 150px;
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

    <div class="doc-title">NOTICE OF AWARD</div>

    @if($nta->sent_at)
        <div class="sent-stamp">
            RELEASED<br>
            <span style="font-size: 10px;">{{ $nta->sent_at->format('Y-m-d H:i') }}</span>
        </div>
    @endif

    <table class="nta-meta">
        <tr>
            <td class="nta-meta-label">Reference No:</td>
            <td><strong>{{ $nta->ref_number }}</strong></td>
        </tr>
        <tr>
            <td class="nta-meta-label">Date Issued:</td>
            <td>{{ $nta->issued_at->format('F d, Y') }}</td>
        </tr>
        <tr>
            <td class="nta-meta-label">Project / Subject:</td>
            <td><strong>{{ strtoupper($nta->requisition->title) }}</strong> (PR: {{ $nta->requisition->ref_number }})
            </td>
        </tr>
    </table>

    <div class="vendor-info">
        <table style="width: 100%;">
            <tr>
                <td style="width: 60px; color: #64748b; font-weight: 700;">TO:</td>
                <td><strong>{{ strtoupper($nta->vendor->name) }}</strong></td>
            </tr>
            <tr>
                <td></td>
                <td>{{ $nta->vendor->address ?? 'Address not specified' }}</td>
            </tr>
            @if($nta->vendor->contact_person)
                <tr>
                    <td style="padding-top: 10px; color: #64748b; font-weight: 700;">ATTN:</td>
                    <td style="padding-top: 10px;">{{ strtoupper($nta->vendor->contact_person) }}</td>
                </tr>
            @endif
        </table>
    </div>

    <div class="content">
        <p>Dear Sir/Madam,</p>

        <p>We are pleased to inform you that your quotation/proposal for the project
            <strong>"{{ $nta->requisition->title }}"</strong> has been unconditionally accepted and approved by the
            Procurement Committee.</p>

        <p>The contract is hereby awarded to your organization as the
            <strong>{{ $nta->award_basis === 'lowest_responsive_bid' ? 'Lowest Calculated Responsive Bidder' : 'Authorized Sourced Vendor' }}</strong>
            at a total contract price of <span class="amount-highlight">PHP
                {{ number_format($nta->awardedQuote->grand_total, 2) }}</span>, inclusive of all applicable taxes and
            fees.</p>

        <p>You are hereby required to coordinate with our Procurement Department immediately upon receipt of this notice
            for the preparation and execution of the formal Contract / Purchase Order. Please be reminded that no goods
            shall be delivered and no services shall commence until the official Purchase Order (PO) or Job Order (JO)
            has been duly transmitted to and acknowledged by your representative.</p>

        <p>Failure to enter into the said contract shall constitute a sufficient ground for the cancellation of this
            award.</p>

        <p>We look forward to a mutually beneficial partnership.</p>
    </div>

    <div class="signature-area">
        <p style="margin-bottom: 20px;">Very truly yours,</p>

        <table class="signature-table">
            <tr>
                <td>
                    <div class="sign-block">
                        <div class="sign-line">
                            {{ strtoupper($nta->issuedBy->name) }}<br>
                            <span class="sign-title">Authorized Procurement Officer</span><br>
                            <span class="sign-title">Apex Enterprises, Inc.</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="sign-block">
                        <div style="font-weight: 700; color: #475569; margin-bottom: 60px;">CONFORME:</div>
                        <div class="sign-line" style="width: 90%;">
                            <br>
                            <span class="sign-title">Signature over Printed Name</span><br>
                            <span class="sign-title">Authorized Representative</span><br>
                            <span class="sign-title">Date: ________________________</span>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>

</html>