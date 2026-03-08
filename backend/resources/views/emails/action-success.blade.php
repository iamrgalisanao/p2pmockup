<!DOCTYPE html>
<html>

<head>
    <title>Action Successful</title>
    <style>
        body {
            font-family: sans-serif;
            display: flex;
            align-items: center;
            justifyContent: center;
            height: 100vh;
            margin: 0;
            background: #f8fafc;
        }

        .card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            text-align: center;
            max-width: 400px;
        }

        .success-icon {
            color: #10b981;
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        h1 {
            color: #1e293b;
            margin-top: 0;
        }

        p {
            color: #64748b;
            line-height: 1.5;
        }
    </style>
</head>

<body>
    <div class="card">
        <div class="success-icon">✓</div>
        <h1>Action Recorded</h1>
        <p>Your action <strong>{{ strtoupper($action) }}</strong> on requisition
            <strong>{{ $requisition->ref_number }}</strong> has been successfully processed.</p>
        <p>You may now close this window.</p>
    </div>
</body>

</html>