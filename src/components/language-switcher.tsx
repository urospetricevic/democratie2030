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
    <div className="language-switcher">
      {SUPPORTED_LOCALES.map((option) => (
        <Link
          key={option}
          href={buildHref(pathname, option)}
          className={clsx(
            "px-3 py-2 text-sm font-bold transition",
            option === locale
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-muted-strong)] hover:text-[var(--color-ink)]",
          )}
        >
          {option.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
