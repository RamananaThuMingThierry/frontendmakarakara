<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <meta name="author" content="RAMANANA Thu Ming Thierry">
  <meta name="description" content="MAKARAKARA">

  <link rel="icon" href="/utiles/icon.png" type="image/x-icon">
  <link rel="shortcut icon" href="/utiles/icon.png" type="image/x-icon">

  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>MAKARAKARA</title>
    @viteReactRefresh
    @vite('resources/js/app.jsx')
</head>
<body>
    <div id="root"></div>
</body>
</html>
