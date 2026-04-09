"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

interface AliasFormProps {
  locale: Locale;
  nextPath: string;
}

export function AliasForm({ locale, nextPath }: AliasFormProps) {
  const dictionary = getCopy(locale);
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);

        startTransition(async () => {
          const response = await fetch("/api/profile/alias", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ alias }),
          });

          if (!response.ok) {
            if (response.status === 409) {
              setMessage(dictionary.aliasExists);
              return;
            }
            if (response.status === 400) {
              setMessage(dictionary.aliasInvalid);
              return;
            }

            const payload = (await response.json().catch(() => null)) as
              | { error?: string }
              | null;
            setMessage(payload?.error ?? "Alias update failed.");
            return;
          }

          router.push(nextPath);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <label
          htmlFor="alias"
          className="block text-sm font-semibold text-[var(--color-ink)]"
        >
          {dictionary.aliasPlaceholder}
        </label>
        <input
          id="alias"
          value={alias}
          onChange={(event) => setAlias(event.target.value)}
          placeholder="citoyen2030"
          className="w-full rounded-[1.25rem] border border-[var(--color-border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--color-accent)]"
        />
        <p className="text-xs text-[var(--color-muted)]">{dictionary.aliasHelp}</p>
      </div>
      {message ? (
        <p className="text-sm font-medium text-[var(--color-no)]">{message}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {dictionary.aliasSubmit}
      </button>
    </form>
  );
}
