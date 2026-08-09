<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background-color: #f4f5f7; padding: 20px; }
        .card { background: white; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; }
        h2 { color: #4f46e5; }
        .metric { font-size: 24px; font-weight: bold; color: #111827; }
        .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
        .box { background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Weekly Summary Report</h2>
        <p>Hello {{ $user->name }},</p>
        <p>Here is your weekly organization performance summary:</p>

        <div class="grid">
            <div class="box">
                <div class="label">Completed Tasks</div>
                <div class="metric">{{ $metrics['tasks_completed'] ?? 0 }}</div>
            </div>
            <div class="box">
                <div class="label">Active Projects</div>
                <div class="metric">{{ $metrics['active_projects'] ?? 0 }}</div>
            </div>
        </div>

        <p>Log in to your dashboard to review detailed analytics.</p>
    </div>
</body>
</html>
