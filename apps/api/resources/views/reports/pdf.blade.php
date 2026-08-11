<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Report Export - {{ ucfirst($key) }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; margin: 20px; }
        h1 { color: #333; text-transform: capitalize; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>{{ $key }} Report</h1>
    <p>Generated on: {{ now()->toDateTimeString() }}</p>
    
    @if(count($rows) > 0)
        <table>
            <thead>
                <tr>
                    @foreach(array_keys($rows[0]) as $header)
                        <th>{{ $header }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($rows as $row)
                    <tr>
                        @foreach($row as $cell)
                            <td>{{ $cell }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p>No data available for this report.</p>
    @endif
</body>
</html>
