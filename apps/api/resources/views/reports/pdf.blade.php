<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Report {{ strtoupper($key) }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        h2 { text-transform: uppercase; color: #4f46e5; margin-bottom: 5px; }
        .meta { font-size: 10px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9fafb; }
    </style>
</head>
<body>
    <h2>Report: {{ strtoupper($key) }}</h2>
    <div class="meta">Generated at: {{ now()->toDayDateTimeString() }}</div>

    @if(count($rows) > 0)
        <table>
            <thead>
                <tr>
                    @foreach(array_keys($rows[0]) as $col)
                        <th>{{ $col }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($rows as $row)
                    <tr>
                        @foreach($row as $val)
                            <td>{{ $val }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p>No records found.</p>
    @endif
</body>
</html>
