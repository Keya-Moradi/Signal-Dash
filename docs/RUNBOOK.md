# Runbook — Signal Dash

## Local Setup

```bash
docker compose up -d
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Common Issues

### Postgres connection errors

- Check `.env` values
- Ensure docker container is running: `docker compose ps`

### Empty dashboard

- Run `npm run db:seed` to populate demo data

### Migration errors

- Check that Postgres is accessible
- Verify DATABASE_URL in `.env`
- Ensure migrations folder contains SQL files

## Deploy Notes (Optional Later)

- Use a single container for the app
- Use managed Postgres (Render/Supabase/Railway)
- Set env vars in hosting dashboard
