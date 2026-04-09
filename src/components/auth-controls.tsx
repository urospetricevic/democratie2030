"use client";

import { useTransition } from "react";
import { signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { type Locale } from "@/lib/types";
import { getCopy } from "@/lib/i18n";

interface AuthControlsProps {
  locale: Locale;
  isAuthenticated: boolean;
  authEnabled: boolean;
  alias: string | null;
  compact?: boolean;
}

export function AuthControls({
  locale,
  isAuthenticated,
  authEnabled,
  alias,
  compact = false,
}: AuthControlsProps) {
  const dictionary = getCopy(locale);
  const pathname = usePathname() || `/${locale}`;
  const [pending, startTransition] = useTransition();

  if (!authEnabled) {
    return (
      <p className="max-w-xs text-sm text-[var(--color-muted)]">
        {dictionary.authUnavailable}
      </p>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-3",
        compact ? "justify-start" : "justify-end",
      )}
    >
      {isAuthenticated ? (
        <>
          <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-medium text-[var(--color-ink)]">
            {alias ?? "citizen"}
          </span>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await signOut({ callbackUrl: `/${locale}` });
              })
            }
            className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-white"
            disabled={pending}
          >
            {dictionary.signOut}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              await signIn("google", {
                callbackUrl: pathname,
              });
            })
          }
          className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          disabled={pending}
        >
          {dictionary.signIn}
        </button>
      )}
    </div>
  );
}
