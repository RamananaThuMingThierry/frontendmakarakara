@include('errors.minimal', [
    'status' => 505,
    'badge' => 'Erreur serveur',
    'title' => 'Version HTTP non prise en charge',
    'message' => "Le serveur ne prend pas en charge la version HTTP utilisee pour cette requete.",
    'accent' => '#8f2d2d',
])
