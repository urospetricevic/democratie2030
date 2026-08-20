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
  alias: string | null;
  compact?: boolean;
}

export function AuthControls({
  locale,
  isAuthenticated,
  alias,
  compact = false,
}: AuthControlsProps) {
  const dictionary = getCopy(locale);
  const pathname = usePathname() || `/${locale}`;
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={clsx(
        "auth-controls flex items-center gap-3",
        compact ? "justify-start" : "justify-end",
      )}
    >
      {isAuthenticated ? (
        <>
          <Link
            href={`/${locale}/portal`}
            title={dictionary.portal.navLabel}
            className="account-portal-link"
          >
            <span aria-hidden="true">▦</span>
            <span>
              <strong>{dictionary.portal.navLabel}</strong>
              <small>@{alias ?? "citizen"}</small>
            </span>
          </Link>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await signOut({ callbackUrl: `/${locale}` });
              })
            }
            className="account-signout btn-secondary"
            disabled={pending}
          >
            <span className="account-signout-label">{dictionary.signOut}</span>
            <span className="account-signout-icon" aria-hidden="true">↗</span>
          </button>
        </>
      ) : (
        <div className="flex items-center">
          <Link
            href={`/${locale}/access?next=${encodeURIComponent(pathname)}`}
            className="btn-solid"
          >
            {dictionary.signIn}
          </Link>
        </div>
      )}
    </div>
  );
}
