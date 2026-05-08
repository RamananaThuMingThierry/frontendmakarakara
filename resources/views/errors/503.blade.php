@include('errors.minimal', [
    'status' => 503,
    'badge' => 'Service indisponible',
    'title' => 'Service temporairement indisponible',
    'message' => "Une maintenance ou une indisponibilite temporaire empeche l'affichage de cette page.",
    'accent' => '#8f2d2d',
])
