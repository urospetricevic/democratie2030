"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { getCopy } from "@/lib/i18n";
import type { Locale, VoteSide } from "@/lib/types";

interface VotePanelProps {
  locale: Locale;
  debateId: string;
  authEnabled: boolean;
  isAuthenticated: boolean;
  hasAlias: boolean;
  currentVote: VoteSide | null;
}

export function VotePanel({
  locale,
  debateId,
  authEnabled,
  isAuthenticated,
  hasAlias,
  currentVote,
}: VotePanelProps) {
  const dictionary = getCopy(locale);
  const pathname = usePathname() || `/${locale}/debates/${debateId}`;
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleVote(side: VoteSide) {
    setMessage(null);

    if (!authEnabled) {
      setMessage(dictionary.authUnavailable);
      return;
    }

    if (!isAuthenticated) {
      await signIn("google", { callbackUrl: pathname });
      return;
    }

    if (!hasAlias) {
      router.push(`/${locale}/welcome?next=${encodeURIComponent(pathname)}`);
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/debates/${debateId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ side }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setMessage(payload?.error ?? "Vote failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="space-y-2">
        <p className="eyebrow text-xs font-bold text-[var(--color-muted)]">
          {dictionary.voteLabel}
        </p>
        <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
          {dictionary.voteLabel}
        </h2>
        <p className="text-sm leading-7 text-[var(--color-muted)]">
          {isAuthenticated && hasAlias
            ? dictionary.participationLine
            : authEnabled
              ? dictionary.authPrompt
              : dictionary.authUnavailable}
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {(["yes", "no"] as const).map((side) => {
          const active = currentVote === side;
          const isYes = side === "yes";
          return (
            <button
              key={side}
              type="button"
              onClick={() => void handleVote(side)}
              disabled={pending}
              className={clsx(
                "rounded-[1.4rem] border px-4 py-4 text-left transition",
                active
                  ? "border-transparent text-white shadow-lg"
                  : "border-[var(--color-border)] bg-white hover:bg-[var(--color-paper-strong)]",
              )}
              style={
                active
                  ? {
                      backgroundColor: isYes
                        ? "var(--color-yes)"
                        : "var(--color-no)",
                    }
                  : undefined
              }
            >
              <span className="block text-xs font-bold uppercase tracking-[0.22em] opacity-80">
                {dictionary.currentVote}
              </span>
              <span className="mt-1 block text-base font-semibold">
                {isYes ? dictionary.voteYes : dictionary.voteNo}
              </span>
            </button>
          );
        })}
      </div>

      {message ? (
        <p className="mt-4 text-sm font-medium text-[var(--color-no)]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
