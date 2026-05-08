@include('errors.minimal', [
    'status' => 401,
    'badge' => 'Acces refuse',
    'title' => 'Authentification requise',
    'message' => "Vous devez vous connecter pour acceder a cette page.",
    'accent' => '#7c4d14',
])
