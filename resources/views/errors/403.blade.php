@include('errors.minimal', [
    'status' => 403,
    'badge' => 'Acces refuse',
    'title' => "Vous n'avez pas l'autorisation",
    'message' => "Cette page existe, mais vous n'avez pas les droits necessaires pour l'ouvrir.",
    'accent' => '#8b5a2b',
])
