"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { normalizeEmail } from "@/lib/domain";
import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function ForgotPasswordForm({
  locale,
  available,
}: {
  locale: Locale;
  available: boolean;
}) {
  const copy = getCopy(locale);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!available) {
    return (
      <div className="password-recovery-result password-recovery-result-error">
        <span aria-hidden="true">!</span>
        <h2>{copy.forgotPasswordUnavailable}</h2>
        <Link href={`/${locale}/access`}>{copy.resetPasswordSignIn}</Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="password-recovery-result" role="status">
        <span aria-hidden="true">✓</span>
        <h2>{copy.forgotPasswordSuccessTitle}</h2>
        <p className="rich-copy">{copy.forgotPasswordSuccess}</p>
        <Link href={`/${locale}/access`}>{copy.resetPasswordSignIn}</Link>
      </div>
    );
  }

  return (
    <form
      className="password-recovery-form"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        startTransition(async () => {
          try {
            const response = await fetch("/api/auth/password/forgot", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: normalizeEmail(email),
                locale,
              }),
            });
            const payload = (await response.json().catch(() => null)) as
              | { error?: string }
              | null;

            if (!response.ok) {
              setMessage(
                payload?.error === "INVALID_EMAIL"
                  ? copy.emailInvalid
                  : copy.forgotPasswordUnavailable,
              );
              return;
            }

            setSent(true);
          } catch {
            setMessage(copy.forgotPasswordUnavailable);
          }
        });
      }}
    >
      <label htmlFor="recovery-email">{copy.accessEmailLabel}</label>
      <input
        id="recovery-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        placeholder={locale === "fr" ? "vous@exemple.com" : "you@example.com"}
        required
      />
      {message ? <p className="password-recovery-error">{message}</p> : null}
      <button type="submit" className="btn-solid" disabled={pending}>
        {pending ? copy.forgotPasswordPending : copy.forgotPasswordButton}
      </button>
      <Link href={`/${locale}/access`} className="password-recovery-back">
        {copy.resetPasswordSignIn}
      </Link>
    </form>
  );
}

export function ResetPasswordForm({
  locale,
  requestId,
  token,
}: {
  locale: Locale;
  requestId: string;
  token: string;
}) {
  const copy = getCopy(locale);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(
    requestId && token ? null : copy.resetPasswordInvalid,
  );
  const [complete, setComplete] = useState(false);
  const [pending, startTransition] = useTransition();
  const hasResetCredentials = Boolean(requestId && token);

  useEffect(() => {
    if (hasResetCredentials) {
      window.history.replaceState(
        null,
        "",
        `/${locale}/reset-password`,
      );
    }
  }, [hasResetCredentials, locale]);

  if (complete) {
    return (
      <div className="password-recovery-result" role="status">
        <span aria-hidden="true">✓</span>
        <h2>{copy.resetPasswordSuccessTitle}</h2>
        <p className="rich-copy">{copy.resetPasswordSuccess}</p>
        <Link href={`/${locale}/access`}>{copy.resetPasswordSignIn}</Link>
      </div>
    );
  }

  if (!hasResetCredentials) {
    return (
      <div className="password-recovery-result password-recovery-result-error">
        <span aria-hidden="true">!</span>
        <h2>{copy.resetPasswordInvalid}</h2>
        <Link href={`/${locale}/forgot-password`}>
          {copy.resetPasswordRequestAgain}
        </Link>
      </div>
    );
  }

  return (
    <form
      className="password-recovery-form"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);

        if (password !== confirmPassword) {
          setMessage(copy.passwordMismatch);
          return;
        }

        startTransition(async () => {
          try {
            const response = await fetch("/api/auth/password/reset", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                requestId,
                token,
                password,
                confirmPassword,
              }),
            });
            const payload = (await response.json().catch(() => null)) as
              | { error?: string }
              | null;

            if (!response.ok) {
              const nextMessage =
                payload?.error === "PASSWORD_MISMATCH"
                  ? copy.passwordMismatch
                  : payload?.error === "INVALID_PASSWORD"
                    ? copy.passwordInvalid
                    : payload?.error === "RESET_LINK_EXPIRED"
                      ? copy.resetPasswordExpired
                      : copy.resetPasswordInvalid;
              setMessage(nextMessage);
              return;
            }

            setComplete(true);
          } catch {
            setMessage(copy.forgotPasswordUnavailable);
          }
        });
      }}
    >
      <label htmlFor="new-password">{copy.accessPasswordLabel}</label>
      <input
        id="new-password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        minLength={8}
        maxLength={72}
        autoComplete="new-password"
        required
      />
      <label htmlFor="confirm-new-password">
        {copy.accessPasswordConfirmLabel}
      </label>
      <input
        id="confirm-new-password"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        minLength={8}
        maxLength={72}
        autoComplete="new-password"
        required
      />
      <p className="password-recovery-help">{copy.accessPasswordHelp}</p>
      {message ? <p className="password-recovery-error">{message}</p> : null}
      <button type="submit" className="btn-solid" disabled={pending}>
        {pending ? copy.resetPasswordPending : copy.resetPasswordButton}
      </button>
    </form>
  );
}
