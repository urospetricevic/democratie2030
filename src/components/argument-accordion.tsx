import type { ArgumentCard, Locale } from "@/lib/types";

interface ArgumentAccordionProps {
  locale: Locale;
  argument: ArgumentCard;
  tone: "yes" | "no";
  index: number;
}

export function ArgumentAccordion({
  locale,
  argument,
  tone,
  index,
}: ArgumentAccordionProps) {
  return (
    <details
      className="argument-row group"
      open={false}
    >
      <summary className="argument-summary">
        <span className="argument-number" data-tone={tone}>{index + 1}</span>
        <div className="argument-copy">
            <h3>
              {argument.title[locale]}
            </h3>
            <p>
              {argument.summary[locale]}
            </p>
        </div>
        <span className="argument-chevron" aria-hidden="true">⌄</span>
      </summary>
      <p className="argument-details rich-copy">
        {argument.details[locale]}
      </p>
    </details>
  );
}
