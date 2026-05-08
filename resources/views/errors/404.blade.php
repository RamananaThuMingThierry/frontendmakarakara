@include('errors.minimal', [
    'status' => 404,
    'badge' => 'Page introuvable',
    'title' => "Cette page n'existe pas",
    'message' => "Le lien demande est introuvable ou n'est plus disponible.",
    'accent' => '#8b6a16',
])
