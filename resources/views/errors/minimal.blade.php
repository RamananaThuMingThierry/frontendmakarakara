<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Erreur' }} | MAHAKARAKARA</title>
    <style>
        :root {
            color-scheme: light;
            --bg: #f7f0df;
            --bg-alt: #fbf7ef;
            --panel: #ffffff;
            --text: #2d2417;
            --muted: #65553b;
            --accent: {{ $accent ?? '#8b6a16' }};
            --border: rgba(93, 74, 27, 0.12);
            --shadow: rgba(93, 74, 27, 0.16);
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            font-family: Arial, Helvetica, sans-serif;
            color: var(--text);
            background:
                radial-gradient(circle at top left, rgba(201, 177, 88, 0.2), transparent 32%),
                radial-gradient(circle at bottom right, rgba(77, 38, 23, 0.14), transparent 30%),
                linear-gradient(180deg, var(--bg) 0%, var(--bg-alt) 45%, #f2eadb 100%);
        }

        .panel {
            width: min(760px, 100%);
            background: rgba(255, 255, 255, 0.88);
            border: 1px solid var(--border);
            border-radius: 28px;
            padding: 48px 32px;
            text-align: center;
            box-shadow: 0 28px 72px var(--shadow);
        }

        .badge {
            display: inline-block;
            padding: 8px 14px;
            border-radius: 999px;
            border: 1px solid var(--border);
            background: #fff;
            color: var(--accent);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: .08em;
            text-transform: uppercase;
        }

        .code {
            margin: 18px 0 0;
            color: var(--accent);
            font-size: clamp(64px, 15vw, 120px);
            line-height: .9;
            font-weight: 800;
        }

        h1 {
            margin: 16px 0 0;
            font-size: clamp(32px, 4vw, 52px);
            line-height: 1.1;
        }

        p {
            margin: 16px auto 0;
            max-width: 560px;
            color: var(--muted);
            line-height: 1.7;
            font-size: 17px;
        }

        .actions {
            margin-top: 28px;
        }

        a {
            display: inline-block;
            padding: 13px 22px;
            border-radius: 999px;
            background: #1e1e1e;
            color: #fff;
            text-decoration: none;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <main class="panel">
        <div class="badge">{{ $badge ?? 'Erreur' }}</div>
        <div class="code">{{ $status ?? 500 }}</div>
        <h1>{{ $title ?? 'Une erreur est survenue' }}</h1>
        <p>{{ $message ?? "Nous n'avons pas pu afficher cette page correctement." }}</p>
        <div class="actions">
            <a href="{{ url('/') }}">Retour a l'accueil</a>
        </div>
    </main>
</body>
</html>
