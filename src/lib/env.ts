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
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resetEmailFrom: process.env.RESET_EMAIL_FROM ?? "",
  passwordResetTestMode:
    process.env.NODE_ENV !== "production" &&
    process.env.PASSWORD_RESET_TEST_MODE === "true",
  seedSecret: process.env.SEED_SECRET ?? "",
  adminSeedEnabled: (process.env.ADMIN_SEED_ENABLED ?? "true") !== "false",
  vertexImageLocation: process.env.VERTEX_IMAGE_LOCATION ?? "us-central1",
};

export function isPasswordResetEmailConfigured() {
  return Boolean(
    appEnv.passwordResetTestMode ||
      (appEnv.appUrl && appEnv.resendApiKey && appEnv.resetEmailFrom),
  );
}

export function isFirestoreConfigured() {
  return Boolean(appEnv.projectId);
}
