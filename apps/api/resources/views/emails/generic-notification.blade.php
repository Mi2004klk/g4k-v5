<!DOCTYPE html>
<html>
<head>
    <title>{{ $title }}</title>
</head>
<body>
    <h1>{{ $title }}</h1>
    <p>{{ $body }}</p>
    
    @if($link)
        <p>
            <a href="{{ config('app.frontend_url') }}{{ $link }}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:5px;">
                View Details
            </a>
        </p>
    @endif
</body>
</html>
