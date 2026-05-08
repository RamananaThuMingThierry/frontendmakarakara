@include('errors.minimal', [
    'status' => 429,
    'badge' => 'Trop de requetes',
    'title' => 'Veuillez patienter un instant',
    'message' => "Trop de requetes ont ete envoyees en peu de temps. Reessayez dans quelques instants.",
    'accent' => '#8b6a16',
])
