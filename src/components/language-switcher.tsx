"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/types";

interface LanguageSwitcherProps {
  locale: Locale;
}

function buildHref(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/");
  if (segments.length > 1) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}`;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname() || `/${locale}`;

  return (
    <div className="inline-flex rounded-full border border-[var(--color-border-strong)] bg-white/78 p-1 shadow-[0_14px_32px_rgba(15,23,42,0.05)]">
      {SUPPORTED_LOCALES.map((option) => (
        <Link
          key={option}
          href={buildHref(pathname, option)}
          className={clsx(
            "rounded-full px-4 py-2 text-sm font-bold transition",
            option === locale
              ? "bg-[var(--color-ink)] text-white shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
              : "text-[var(--color-muted-strong)] hover:text-[var(--color-ink)]",
          )}
        >
          {option.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
