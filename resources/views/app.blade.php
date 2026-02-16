<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MAHAKARAKARA</title>

  @viteReactRefresh()
  @vite('resources/js/app.jsx')
</head>
<body>
  <div id="app"></div>
</body>
</html>
