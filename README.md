# Democratie2030

Bilingual civic debate prototype built with Next.js, Auth.js, Firestore, and Cloud Run.

## Local

```bash
npm install
npm run dev
```

Without Firestore, the UI falls back to a bundled debate seed in read-only mode.
The participation flow uses a real email + password account by default, with a public alias shown in the debate. Google auth is optional and only enabled when `AUTH_GOOGLE_ENABLED=true`.

## Deploy

1. Build and deploy the container to Cloud Run.
2. Configure `NEXTAUTH_URL`, `APP_URL`, `AUTH_SECRET`, `SEED_SECRET`, and optionally `AUTH_GOOGLE_ENABLED`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
3. Trigger the seed endpoint once the service is live.

## Test

```bash
npm run lint
npm run test
npm run build
```
