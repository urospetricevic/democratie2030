"use client";

import Link from "next/link";
import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { type Locale } from "@/lib/types";
import { getCopy } from "@/lib/i18n";

interface AuthControlsProps {
  locale: Locale;
  isAuthenticated: boolean;
  googleEnabled: boolean;
  alias: string | null;
  compact?: boolean;
}

export function AuthControls({
  locale,
  isAuthenticated,
  googleEnabled,
  alias,
  compact = false,
}: AuthControlsProps) {
  const dictionary = getCopy(locale);
  const pathname = usePathname() || `/${locale}`;
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={clsx(
        "flex items-center gap-3",
        compact ? "justify-start" : "justify-end",
      )}
    >
      {isAuthenticated ? (
        <>
          <span className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
            {alias ?? "citizen"}
          </span>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await signOut({ callbackUrl: `/${locale}` });
              })
            }
            className="btn-secondary"
            disabled={pending}
          >
            {dictionary.signOut}
          </button>
        </>
      ) : (
        <div className="flex flex-col items-end gap-2">
          <Link
            href={`/${locale}/access?next=${encodeURIComponent(pathname)}`}
            className="btn-solid"
          >
            {dictionary.signIn}
          </Link>
          <span className="text-xs font-medium text-[var(--color-muted-strong)]">
            {googleEnabled
              ? `${dictionary.accessGuestTitle} + Google ${dictionary.accessOptional.toLowerCase()}`
              : dictionary.accessGuestTitle}
          </span>
        </div>
      )}
    </div>
  );
}
