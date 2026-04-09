"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { normalizeAlias } from "@/lib/domain";
import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const GUEST_ID_STORAGE_KEY = "democratie2030.guest-id";
const GUEST_ALIAS_STORAGE_KEY = "democratie2030.guest-alias";

interface GuestAccessFormProps {
  locale: Locale;
  nextPath: string;
  googleEnabled: boolean;
}

export function GuestAccessForm({
  locale,
  nextPath,
  googleEnabled,
}: GuestAccessFormProps) {
  const dictionary = getCopy(locale);
  const router = useRouter();
  const [alias, setAlias] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(GUEST_ALIAS_STORAGE_KEY) ?? "";
  });
  const [guestId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const storedGuestId = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
    if (storedGuestId) {
      return storedGuestId;
    }

    const nextGuestId = window.crypto.randomUUID();
    window.localStorage.setItem(GUEST_ID_STORAGE_KEY, nextGuestId);
    return nextGuestId;
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function persistAlias(rawAlias: string) {
    const nextAlias = normalizeAlias(rawAlias);
    window.localStorage.setItem(GUEST_ALIAS_STORAGE_KEY, nextAlias);
    return nextAlias;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[2rem] border border-[var(--color-border-strong)] bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(30,41,59,0.94))] p-6 text-white shadow-[0_32px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-highlight)]">
            {dictionary.accessRecommended}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Alias
          </span>
        </div>
        <h3 className="mt-5 text-3xl font-semibold">{dictionary.accessGuestTitle}</h3>
        <p className="mt-3 max-w-xl text-sm leading-7 text-white/78">
          {dictionary.accessGuestBody}
        </p>
        <p className="mt-4 text-sm leading-7 text-white/65">
          {dictionary.accessGuestHint}
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(null);

            startTransition(async () => {
              const nextAlias = persistAlias(alias);
              const result = await signIn("guest", {
                alias: nextAlias,
                guestId,
                callbackUrl: nextPath,
                redirect: false,
              });

              if (!result || result.error) {
                setMessage(`${dictionary.aliasInvalid} ${dictionary.aliasExists}`);
                return;
              }

              router.push(nextPath);
              router.refresh();
            });
          }}
        >
          <div className="space-y-2">
            <label
              htmlFor="guest-alias"
              className="block text-xs font-bold uppercase tracking-[0.18em] text-white/70"
            >
              {dictionary.aliasPlaceholder}
            </label>
            <input
              id="guest-alias"
              value={alias}
              onChange={(event) => setAlias(event.target.value)}
              placeholder="citoyen2030"
              className="w-full rounded-[1.25rem] border border-white/14 bg-white/8 px-4 py-3 text-base text-white outline-none transition focus:border-[var(--color-highlight)] focus:bg-white/10"
            />
          </div>
          {message ? (
            <p className="text-sm font-medium text-[var(--color-danger-soft)]">
              {message}
            </p>
          ) : null}
          <button type="submit" className="btn-hero" disabled={pending || !guestId}>
            {dictionary.accessGuestButton}
          </button>
        </form>
      </div>

      <div className="panel rounded-[2rem] p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-[var(--color-highlight-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-highlight-strong)]">
            {dictionary.accessOptional}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">
            External
          </span>
        </div>
        <h3 className="mt-5 text-2xl font-semibold text-[var(--color-ink)]">
          {dictionary.accessGoogleTitle}
        </h3>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted-strong)]">
          {dictionary.accessGoogleBody}
        </p>
        {googleEnabled ? (
          <button
            type="button"
            onClick={() => {
              void signIn("google", {
                callbackUrl: nextPath,
              });
            }}
            className="btn-secondary mt-6 w-full justify-center"
          >
            {dictionary.accessGoogleButton}
          </button>
        ) : (
          <div className="mt-6 rounded-[1.4rem] border border-dashed border-[var(--color-border-strong)] bg-white/70 px-4 py-4 text-sm leading-7 text-[var(--color-muted-strong)]">
            {dictionary.accessGoogleBody}
          </div>
        )}
      </div>
    </div>
  );
}
