const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ??
  process.env.GCLOUD_PROJECT ??
  process.env.GCP_PROJECT ??
  "";

export const appEnv = {
  projectId,
  appUrl:
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    "",
  authSecret: process.env.AUTH_SECRET ?? "local-democratie2030-secret",
  googleAuthEnabled: (process.env.AUTH_GOOGLE_ENABLED ?? "false") === "true",
  googleClientId: process.env.AUTH_GOOGLE_ID ?? "",
  googleClientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
  seedSecret: process.env.SEED_SECRET ?? "",
  adminSeedEnabled: (process.env.ADMIN_SEED_ENABLED ?? "true") !== "false",
};

export function isGoogleAuthConfigured() {
  return Boolean(
    appEnv.googleAuthEnabled &&
      appEnv.authSecret &&
      appEnv.googleClientId &&
      appEnv.googleClientSecret,
  );
}

export function isFirestoreConfigured() {
  return Boolean(appEnv.projectId);
}
