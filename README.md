# DBYLE

Don't believe your lying eyes.

Bilingual civic debate prototype built with Next.js, Auth.js, Firestore, and Cloud Run.

## Local

```bash
npm install
npm run dev
```

Without Firestore, the UI falls back to a bundled debate seed in read-only mode.
The participation flow uses an email + password account, with a public alias shown in the debate.
Password recovery emails are delivered through Resend.

## Deploy

1. Build and deploy the container to Cloud Run.
2. Configure `NEXTAUTH_URL`, `APP_URL`, `AUTH_SECRET`, `SEED_SECRET`, `RESEND_API_KEY`, and `RESET_EMAIL_FROM`.
3. Trigger the seed endpoint once the service is live.

## Test

```bash
npm run lint
npm run test
npm run build
```
