@include('errors.minimal', [
    'status' => 500,
    'badge' => 'Erreur serveur',
    'title' => "Une erreur interne s'est produite",
    'message' => "Le serveur n'a pas pu traiter la demande correctement.",
    'accent' => '#8f2d2d',
])
