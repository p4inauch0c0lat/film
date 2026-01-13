# film

Bot Discord pour fournir un embed de catalogue de streaming.

## Démarrage rapide

```bash
npm install
npm start
```

## Variables d'environnement

- `DISCORD_TOKEN` (obligatoire)
- `FILM_COUNT`
- `SERIES_COUNT`
- `SEASONS_COUNT`
- `EPISODES_COUNT`
- `TOTAL_LINKS`
- `STATUS_URL`
- `DISCORD_OWNER_IDS` (optionnel, liste d'IDs séparés par des virgules pour limiter les commandes d'ajout)

## Utilisation

Envoyez `!catalogue` dans un salon où le bot est présent pour obtenir l'embed principal.

### Ajout interactif

Envoyez `!ajouter` pour démarrer l'ajout interactif (film, série ou animé). Le bot posera les questions dans le salon pour construire la fiche.
