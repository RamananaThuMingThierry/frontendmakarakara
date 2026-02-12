<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />

    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="author" content="RAMANANA Thu Ming Thierry">
    <meta name="description" content="MAHAKARAKARA">

    <link href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&amp;display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Allura&amp;display=swap" rel="stylesheet">
  
    <link rel="stylesheet" href="{{ asset('website/css/plugins/swiper.min.css') }}">
    <link rel="stylesheet" href="{{ asset('website/css/style.css') }}">
    <link rel="stylesheet" href="{{ asset('website/css/custom.css') }}">
    <link rel="icon" href="{{ asset('utiles/icon.png') }}" type="image/x-icon">
    <link rel="shortcut icon" href="{{ asset('utiles/icon.png') }}" type="image/x-icon">

    
    <title>MAHAKARAKARA</title>

    @viteReactRefresh()
    @vite('resources/js/website.jsx')
</head>

<body class="gradient-bg">

    <div id="website"></div>

    <script src="{{ asset('website/js/plugins/jquery.min.js') }}"></script>
    <script src="{{ asset('website/js/plugins/bootstrap.bundle.min.js') }}"></script>
    <script src="{{ asset('website/js/plugins/swiper.min.js') }}"></script>
    <script src="{{ asset('website/js/theme.js') }}"></script>
</body>
</html>
