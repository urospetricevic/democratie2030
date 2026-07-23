"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { formatDateTime, getCopy } from "@/lib/i18n";
import type { CommentRecord, Locale } from "@/lib/types";

interface CommentsSectionProps {
  locale: Locale;
  debateId: string;
  comments: CommentRecord[];
  isAuthenticated: boolean;
  hasAlias: boolean;
}

export function CommentsSection({
  locale,
  debateId,
  comments,
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
    if (!isAuthenticated) {
      router.push(`/${locale}/access?next=${encodeURIComponent(pathname)}`);
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
    <section className="discussion-section">
      <div>
        <div className="discussion-heading">
          <p className="section-label">
            {dictionary.commentsTitle}
          </p>
          <h2>
            {dictionary.commentsTitle}
          </h2>
          <p>
            {dictionary.commentsSubtitle}
          </p>
        </div>

        <div className="comment-composer">
          <label>
            {dictionary.addComment}
          </label>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={dictionary.commentPlaceholder}
            className="comment-textarea"
          />
          <div className="composer-actions">
            <span>
              {body.trim().length}/1200
            </span>
            <button
              type="button"
              onClick={() => void publishComment()}
              disabled={pending}
              className="btn-solid"
            >
              {dictionary.publishComment}
            </button>
          </div>
        </div>

        {message ? (
          <p className="text-sm font-medium text-[var(--color-no)]">{message}</p>
        ) : null}

        <div className="discussion-feed">
          {comments.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] px-5 py-8 text-center text-sm text-[var(--color-muted)]">
              {dictionary.noCommentsYet}
            </div>
          ) : (
            comments.map((comment) => (
              <article
                key={comment.id}
                className="discussion-row"
              >
                <div className="discussion-meta">
                  <div>
                    <p className="discussion-alias">
                      {comment.alias}
                    </p>
                    <p className="discussion-date">
                      {formatDateTime(locale, comment.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void upvote(comment.id)}
                    disabled={pending}
                    className={clsx(
                      "discussion-support",
                    )}
                  >
                    {dictionary.upvote} · {comment.upvoteCount}
                  </button>
                </div>
                <p className="discussion-body rich-copy">
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
