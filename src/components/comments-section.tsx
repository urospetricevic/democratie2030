"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { formatDateTime, getCopy } from "@/lib/i18n";
import type { CommentRecord, Locale } from "@/lib/types";

interface CommentsSectionProps {
  locale: Locale;
  debateId: string;
  comments: CommentRecord[];
  authEnabled: boolean;
  isAuthenticated: boolean;
  hasAlias: boolean;
}

export function CommentsSection({
  locale,
  debateId,
  comments,
  authEnabled,
  isAuthenticated,
  hasAlias,
}: CommentsSectionProps) {
  const dictionary = getCopy(locale);
  const pathname = usePathname() || `/${locale}/debates/${debateId}`;
  const router = useRouter();
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function requireAuthOrAlias() {
    if (!authEnabled) {
      setMessage(dictionary.authUnavailable);
      return false;
    }
    if (!isAuthenticated) {
      await signIn("google", { callbackUrl: pathname });
      return false;
    }
    if (!hasAlias) {
      router.push(`/${locale}/welcome?next=${encodeURIComponent(pathname)}`);
      return false;
    }
    return true;
  }

  async function publishComment() {
    setMessage(null);
    if (!(await requireAuthOrAlias())) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/debates/${debateId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setMessage(payload?.error ?? "Comment failed.");
        return;
      }

      setBody("");
      router.refresh();
    });
  }

  async function upvote(commentId: string) {
    setMessage(null);
    if (!(await requireAuthOrAlias())) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/comments/${commentId}/upvote`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setMessage(payload?.error ?? "Support failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="flex flex-col gap-5">
        <div>
          <p className="eyebrow text-xs font-bold text-[var(--color-muted)]">
            {dictionary.commentsTitle}
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
            {dictionary.commentsTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
            {dictionary.commentsSubtitle}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/90 p-4">
          <label className="mb-3 block text-sm font-semibold text-[var(--color-ink)]">
            {dictionary.addComment}
          </label>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={dictionary.commentPlaceholder}
            className="min-h-32 w-full rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-paper-strong)] px-4 py-3 text-sm leading-7 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--color-muted)]">
              {body.trim().length}/1200
            </span>
            <button
              type="button"
              onClick={() => void publishComment()}
              disabled={pending}
              className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {dictionary.publishComment}
            </button>
          </div>
        </div>

        {message ? (
          <p className="text-sm font-medium text-[var(--color-no)]">{message}</p>
        ) : null}

        <div className="grid gap-4">
          {comments.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] px-5 py-8 text-center text-sm text-[var(--color-muted)]">
              {dictionary.noCommentsYet}
            </div>
          ) : (
            comments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/85 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      {comment.alias}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {formatDateTime(locale, comment.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void upvote(comment.id)}
                    disabled={pending}
                    className={clsx(
                      "rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold transition",
                      "hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
                    )}
                  >
                    {dictionary.upvote} · {comment.upvoteCount}
                  </button>
                </div>
                <p className="rich-copy mt-4 text-base leading-8 text-[var(--color-ink)]">
                  {comment.body}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
