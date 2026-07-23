"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { getCopy } from "@/lib/i18n";
import type { Locale, VoteSide } from "@/lib/types";

interface VotePanelProps {
  locale: Locale;
  debateId: string;
  isAuthenticated: boolean;
  hasAlias: boolean;
  currentVote: VoteSide | null;
}

export function VotePanel({
  locale,
  debateId,
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

    if (!isAuthenticated) {
      router.push(`/${locale}/access?next=${encodeURIComponent(pathname)}`);
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
    <section className="debate-vote-panel">
      <div>
        <p className="section-label">
          {dictionary.voteLabel}
        </p>
        <p className="vote-prompt rich-copy">
          {isAuthenticated && hasAlias
            ? dictionary.participationLine
            : dictionary.authPrompt}
        </p>
      </div>

      <div className="vote-actions">
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
                "debate-vote-button",
                active
                  ? "is-active"
                  : "",
                isYes ? "is-yes" : "is-no",
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
              <span className="vote-icon" aria-hidden="true">{isYes ? "↑" : "↓"}</span>
              <span>
                {isYes ? dictionary.voteYes : dictionary.voteNo}
              </span>
            </button>
          );
        })}
      </div>

      {message ? (
        <p className="vote-message">
          {message}
        </p>
      ) : null}
    </section>
  );
}
