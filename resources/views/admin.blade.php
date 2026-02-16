<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />

    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="author" content="RAMANANA Thu Ming Thierry">
    <meta name="description" content="MAHAKARAKARA">
    
    <link rel="icon" href="{{ asset('utiles/icon.png') }}" type="image/x-icon">
    <link rel="shortcut icon" href="{{ asset('utiles/icon.png') }}" type="image/x-icon">

    
    <title>MAHAKARAKARA</title>

    @viteReactRefresh()
    @vite('resources/js/admin.jsx')
</head>

<body>
    <div id="admin"></div>
</body>
</html>
