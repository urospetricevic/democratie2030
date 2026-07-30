"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { normalizeEmail } from "@/lib/domain";
import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface AccountAccessFormProps {
  locale: Locale;
  nextPath: string;
  googleEnabled: boolean;
}

function translateError(
  code: string | null | undefined,
  dictionary: ReturnType<typeof getCopy>,
) {
  switch (code) {
    case "EMAIL_TAKEN":
      return dictionary.emailExists;
    case "INVALID_EMAIL":
      return dictionary.emailInvalid;
    case "INVALID_PASSWORD":
      return dictionary.passwordInvalid;
    case "PASSWORD_MISMATCH":
      return dictionary.passwordMismatch;
    case "INVALID_ALIAS":
      return `${dictionary.aliasInvalid} ${dictionary.aliasHelp}`;
    case "ALIAS_TAKEN":
      return dictionary.aliasExists;
    case "INVALID_REGISTRATION":
      return dictionary.registrationInvalid;
    case "AUTH_UNAVAILABLE":
      return dictionary.authUnavailable;
    case "REGISTRATION_FAILED":
      return dictionary.registrationFailed;
    default:
      return null;
  }
}

export function AccountAccessForm({
  locale,
  nextPath,
  googleEnabled,
}: AccountAccessFormProps) {
  const dictionary = getCopy(locale);
  const router = useRouter();
  const emailPlaceholder =
    locale === "fr" ? "vous@exemple.com" : "you@example.com";
  const accountBadge = locale === "fr" ? "Compte" : "Account";
  const [registerPending, startRegisterTransition] = useTransition();
  const [loginPending, startLoginTransition] = useTransition();
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({
    alias: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="rounded-[2rem] border border-[var(--color-border-strong)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(15,118,110,0.94))] p-6 text-white shadow-[0_32px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-highlight)]">
            {dictionary.accessRecommended}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
            Email
          </span>
        </div>
        <h3 className="mt-5 text-3xl font-semibold">
          {dictionary.accessAccountTitle}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-7 text-white/82">
          {dictionary.accessAccountBody}
        </p>
        <p className="mt-4 text-sm leading-7 text-white/68">
          {dictionary.accessAccountHint}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setRegisterMessage(null);

            if (registerForm.password !== registerForm.confirmPassword) {
              setRegisterMessage(dictionary.passwordMismatch);
              return;
            }

            startRegisterTransition(async () => {
              try {
                const response = await fetch("/api/auth/register", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    alias: registerForm.alias,
                    email: normalizeEmail(registerForm.email),
                    password: registerForm.password,
                    confirmPassword: registerForm.confirmPassword,
                  }),
                });

                if (!response.ok) {
                  const payload = (await response.json().catch(() => null)) as
                    | { error?: string }
                    | null;
                  setRegisterMessage(
                    translateError(payload?.error, dictionary) ??
                      dictionary.registrationFailed,
                  );
                  return;
                }

                const result = await signIn("account", {
                  email: normalizeEmail(registerForm.email),
                  password: registerForm.password,
                  callbackUrl: nextPath,
                  redirect: false,
                });

                if (!result || result.error) {
                  setRegisterMessage(dictionary.accessAutoLoginFallback);
                  setLoginForm({
                    email: normalizeEmail(registerForm.email),
                    password: "",
                  });
                  return;
                }

                router.push(nextPath);
                router.refresh();
              } catch {
                setRegisterMessage(dictionary.registrationFailed);
              }
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="register-alias"
                className="block text-xs font-bold uppercase tracking-[0.18em] text-white/72"
              >
                {dictionary.accessAliasLabel}
              </label>
              <input
                id="register-alias"
                value={registerForm.alias}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    alias: event.target.value,
                  }))
                }
                placeholder="citoyen2030"
                minLength={3}
                maxLength={24}
                autoComplete="nickname"
                required
                className="w-full rounded-[1.25rem] border border-white/14 bg-white/8 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/45 focus:border-[var(--color-highlight)] focus:bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="register-email"
                className="block text-xs font-bold uppercase tracking-[0.18em] text-white/72"
              >
                {dictionary.accessEmailLabel}
              </label>
              <input
                id="register-email"
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder={emailPlaceholder}
                autoComplete="email"
                required
                className="w-full rounded-[1.25rem] border border-white/14 bg-white/8 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/45 focus:border-[var(--color-highlight)] focus:bg-white/10"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="register-password"
                className="block text-xs font-bold uppercase tracking-[0.18em] text-white/72"
              >
                {dictionary.accessPasswordLabel}
              </label>
              <input
                id="register-password"
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
                className="w-full rounded-[1.25rem] border border-white/14 bg-white/8 px-4 py-3 text-base text-white outline-none transition focus:border-[var(--color-highlight)] focus:bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="register-password-confirm"
                className="block text-xs font-bold uppercase tracking-[0.18em] text-white/72"
              >
                {dictionary.accessPasswordConfirmLabel}
              </label>
              <input
                id="register-password-confirm"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
                className="w-full rounded-[1.25rem] border border-white/14 bg-white/8 px-4 py-3 text-base text-white outline-none transition focus:border-[var(--color-highlight)] focus:bg-white/10"
              />
            </div>
          </div>

          <p className="text-xs leading-6 text-white/62">
            {dictionary.accessPasswordHelp}
          </p>

          {registerMessage ? (
            <p className="text-sm font-medium text-[var(--color-danger-soft)]">
              {registerMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-hero w-full justify-center"
            disabled={registerPending || loginPending}
          >
            {dictionary.accessAccountButton}
          </button>
        </form>
      </div>

      <div className="panel rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-[var(--color-highlight-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-highlight-strong)]">
            {dictionary.accessSignInTitle}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">
            {accountBadge}
          </span>
        </div>
        <h3 className="mt-5 text-2xl font-semibold text-[var(--color-ink)]">
          {dictionary.accessSignInTitle}
        </h3>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted-strong)]">
          {dictionary.accessSignInBody}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setLoginMessage(null);

            startLoginTransition(async () => {
              try {
                const result = await signIn("account", {
                  email: normalizeEmail(loginForm.email),
                  password: loginForm.password,
                  callbackUrl: nextPath,
                  redirect: false,
                });

                if (!result || result.error) {
                  setLoginMessage(dictionary.loginInvalid);
                  return;
                }

                router.push(nextPath);
                router.refresh();
              } catch {
                setLoginMessage(dictionary.loginFailed);
              }
            });
          }}
        >
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block text-sm font-semibold text-[var(--color-ink)]"
            >
              {dictionary.accessEmailLabel}
            </label>
            <input
              id="login-email"
              type="email"
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder={emailPlaceholder}
              autoComplete="email"
              required
              className="w-full rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold text-[var(--color-ink)]"
            >
              {dictionary.accessPasswordLabel}
            </label>
            <input
              id="login-password"
              type="password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              autoComplete="current-password"
              required
              className="w-full rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
            />
          </div>

          {loginMessage ? (
            <p className="text-sm font-medium text-[var(--color-no)]">
              {loginMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn-solid w-full justify-center"
            disabled={registerPending || loginPending}
          >
            {dictionary.accessSignInButton}
          </button>
        </form>

        {googleEnabled ? (
          <div className="mt-6 border-t border-[var(--color-border)] pt-6">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {dictionary.accessGoogleTitle}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted-strong)]">
              {dictionary.accessGoogleBody}
            </p>
            <button
              type="button"
              onClick={() => {
                void signIn("google", {
                  callbackUrl: nextPath,
                });
              }}
              className="btn-secondary mt-4 w-full justify-center"
            >
              {dictionary.accessGoogleButton}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
