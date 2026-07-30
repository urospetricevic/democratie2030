import {
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { isEmailValid, normalizeEmail } from "./domain";
import {
  appEnv,
  isPasswordResetEmailConfigured,
} from "./env";
import {
  createPasswordResetRecord,
  discardPasswordResetRecord,
  resetPasswordWithToken,
} from "./repository";
import type { Locale } from "./types";

const RESET_TOKEN_LIFETIME_MS = 30 * 60 * 1000;

export function createResetRequestId(emailNormalized: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`dbyle-password-reset:${emailNormalized}`)
    .digest("hex");
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildResetUrl(
  appUrl: string,
  locale: Locale,
  requestId: string,
  token: string,
) {
  const url = new URL(`/${locale}/reset-password`, appUrl);
  url.searchParams.set("request", requestId);
  url.searchParams.set("token", token);
  return url.toString();
}

function passwordResetEmail(locale: Locale, resetUrl: string) {
  if (locale === "fr") {
    return {
      subject: "Réinitialisez votre mot de passe DBYLE",
      text: [
        "Vous avez demandé un nouveau mot de passe pour votre compte DBYLE.",
        "",
        `Réinitialisez-le ici : ${resetUrl}`,
        "",
        "Ce lien expire dans 30 minutes et ne peut être utilisé qu’une seule fois.",
        "Si vous n’avez pas fait cette demande, vous pouvez ignorer ce message.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;line-height:1.65">
          <p style="font-size:13px;font-weight:700;letter-spacing:.16em;color:#0b5cff">DBYLE</p>
          <h1 style="font-size:28px;line-height:1.2">Réinitialisez votre mot de passe</h1>
          <p>Vous avez demandé un nouveau mot de passe pour votre compte DBYLE.</p>
          <p style="margin:28px 0"><a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:white;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700">Choisir un nouveau mot de passe</a></p>
          <p style="font-size:14px;color:#475569">Ce lien expire dans 30 minutes et ne peut être utilisé qu’une seule fois. Si vous n’avez pas fait cette demande, ignorez ce message.</p>
        </div>
      `,
    };
  }

  return {
    subject: "Reset your DBYLE password",
    text: [
      "You requested a new password for your DBYLE account.",
      "",
      `Reset it here: ${resetUrl}`,
      "",
      "This link expires in 30 minutes and can only be used once.",
      "If you did not request this, you can ignore this message.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;line-height:1.65">
        <p style="font-size:13px;font-weight:700;letter-spacing:.16em;color:#0b5cff">DBYLE</p>
        <h1 style="font-size:28px;line-height:1.2">Reset your password</h1>
        <p>You requested a new password for your DBYLE account.</p>
        <p style="margin:28px 0"><a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:white;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:700">Choose a new password</a></p>
        <p style="font-size:14px;color:#475569">This link expires in 30 minutes and can only be used once. If you did not request this, ignore this message.</p>
      </div>
    `,
  };
}

async function deliverPasswordResetEmail(
  email: string,
  locale: Locale,
  resetUrl: string,
) {
  if (appEnv.passwordResetTestMode) {
    return;
  }

  const content = passwordResetEmail(locale, resetUrl);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appEnv.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: appEnv.resetEmailFrom,
      to: [email],
      subject: content.subject,
      text: content.text,
      html: content.html,
    }),
  });

  if (!response.ok) {
    throw new Error("PASSWORD_RESET_DELIVERY_FAILED");
  }
}

export async function requestPasswordReset(
  rawEmail: string,
  locale: Locale,
) {
  if (!isPasswordResetEmailConfigured()) {
    throw new Error("PASSWORD_RESET_UNAVAILABLE");
  }

  const emailNormalized = normalizeEmail(rawEmail);
  if (!isEmailValid(emailNormalized)) {
    throw new Error("INVALID_EMAIL");
  }

  const requestId = createResetRequestId(
    emailNormalized,
    appEnv.authSecret,
  );
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(
    Date.now() + RESET_TOKEN_LIFETIME_MS,
  ).toISOString();
  const result = await createPasswordResetRecord(
    emailNormalized,
    requestId,
    tokenHash,
    expiresAt,
  );

  if (result.status !== "created") {
    return { accepted: true as const };
  }

  const resetUrl = buildResetUrl(
    appEnv.appUrl,
    locale,
    requestId,
    token,
  );

  try {
    await deliverPasswordResetEmail(emailNormalized, locale, resetUrl);
  } catch (error) {
    await discardPasswordResetRecord(requestId, tokenHash);
    throw error;
  }

  return {
    accepted: true as const,
    ...(appEnv.passwordResetTestMode ? { testResetUrl: resetUrl } : {}),
  };
}

export async function completePasswordReset(
  requestId: string,
  token: string,
  newPassword: string,
) {
  if (!/^[a-f0-9]{64}$/.test(requestId) || token.length < 32) {
    return "invalid" as const;
  }

  return resetPasswordWithToken(
    requestId,
    hashResetToken(token),
    newPassword,
  );
}
