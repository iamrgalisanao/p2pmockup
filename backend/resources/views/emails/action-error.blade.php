<!DOCTYPE html>
<html>

<head>
    <title>Action Error</title>
    <style>
        body {
            font-family: sans-serif;
            display: flex;
            align-items: center;
            justifyContent: center;
            height: 100vh;
            margin: 0;
            background: #fef2f2;
        }

        .card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            text-align: center;
            max-width: 400px;
        }

        .error-icon {
            color: #ef4444;
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
        <div class="error-icon">⚠</div>
        <h1>Action Failed</h1>
        <p>{{ $message }}</p>
        <p>Please try logging into the P2P Portal to action this request manually.</p>
    </div>
</body>

</html>