import type { ArgumentCard, Locale } from "@/lib/types";
import { getCopy } from "@/lib/i18n";

interface ArgumentAccordionProps {
  locale: Locale;
  argument: ArgumentCard;
  tone: "yes" | "no";
}

export function ArgumentAccordion({
  locale,
  argument,
  tone,
}: ArgumentAccordionProps) {
  const dictionary = getCopy(locale);

  return (
    <details
      className="group rounded-[1.75rem] border border-[var(--color-border-strong)] bg-white/88 p-5 transition duration-200 open:bg-white hover:border-[var(--color-highlight)]"
      open={false}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <span
              className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.24em]"
              style={{
                backgroundColor:
                  tone === "yes"
                    ? "var(--color-yes-soft)"
                    : "var(--color-no-soft)",
                color: tone === "yes" ? "var(--color-yes)" : "var(--color-no)",
              }}
            >
              {tone === "yes" ? dictionary.sideYes : dictionary.sideNo}
            </span>
            <h3 className="text-xl font-semibold leading-tight text-[var(--color-ink)]">
              {argument.title[locale]}
            </h3>
            <p className="text-sm leading-7 text-[var(--color-muted-strong)]">
              {argument.summary[locale]}
            </p>
          </div>
          <span className="pt-1 text-sm font-semibold text-[var(--color-highlight-strong)]">
            {dictionary.details}
          </span>
        </div>
      </summary>
      <p className="rich-copy mt-4 border-t border-[var(--color-border)] pt-4 text-base leading-8 text-[var(--color-ink)]">
        {argument.details[locale]}
      </p>
    </details>
  );
}
