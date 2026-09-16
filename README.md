# BossnuGrokXAI

Foundation + Create Mode + Deploy Guard

## Quick start

```bash
pnpm install
pnpm dev
```

## Create Mode API

```bash
curl -X POST http://localhost:3000/api/create \
  -H "Content-Type: application/json" \
  -d '{"action":"createAndPreview","name":"My App","template":"nextjs"}'
```

## Deploy

Connected to Vercel. Push to main to deploy.
