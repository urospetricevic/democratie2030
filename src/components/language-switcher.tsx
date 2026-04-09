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
    <div className="inline-flex rounded-full border border-[var(--color-border)] bg-white/60 p-1">
      {SUPPORTED_LOCALES.map((option) => (
        <Link
          key={option}
          href={buildHref(pathname, option)}
          className={clsx(
            "rounded-full px-3 py-1 text-sm font-semibold transition",
            option === locale
              ? "bg-[var(--color-ink)] text-white"
              : "text-[var(--color-muted)] hover:text-[var(--color-ink)]",
          )}
        >
          {option.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
