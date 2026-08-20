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
            title={`${dictionary.portal.navLabel} — @${alias ?? "citizen"}`}
            className="account-portal-link"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="3" y="3" width="5" height="5" rx="1" />
              <rect x="12" y="3" width="5" height="5" rx="1" />
              <rect x="3" y="12" width="5" height="5" rx="1" />
              <rect x="12" y="12" width="5" height="5" rx="1" />
            </svg>
            <strong>{dictionary.portal.navLabel}</strong>
          </Link>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await signOut({ callbackUrl: `/${locale}` });
              })
            }
            className="account-signout btn-secondary"
            aria-label={dictionary.signOut}
            title={dictionary.signOut}
            disabled={pending}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M8 4H5.75A1.75 1.75 0 0 0 4 5.75v8.5C4 15.22 4.78 16 5.75 16H8" />
              <path d="M11.5 6.5 15 10l-3.5 3.5M7.5 10H15" />
            </svg>
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
