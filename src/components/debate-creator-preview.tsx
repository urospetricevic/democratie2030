"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function DebateCreatorPreview({
  locale,
  isAuthenticated,
}: {
  locale: Locale;
  isAuthenticated: boolean;
}) {
  const copy = getCopy(locale);
  const communityCopy = copy.communityDebate;
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<string>(copy.creatorCategories[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const previewQuestion = question.trim() || copy.creatorExampleQuestion;
  const previewContext = context.trim() || copy.creatorExampleContext;

  async function submitDebate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isAuthenticated) {
      router.push(
        `/${locale}/access?next=${encodeURIComponent(`/${locale}/create`)}`,
      );
      return;
    }
    if (question.trim().length < 12) {
      setError(communityCopy.questionTooShort);
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/community-debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context, category, locale }),
      });
      const payload = (await response.json()) as {
        id?: string;
        error?: string;
      };
      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? "CREATE_FAILED");
      }
      router.push(`/${locale}/community/${payload.id}`);
      router.refresh();
    } catch {
      setError(communityCopy.createError);
      setPending(false);
    }
  }

  return (
    <div className="creator-studio">
      <form className="creator-form" onSubmit={submitDebate}>
        <div className="creator-form-intro">
          <p className="section-label">{copy.creatorStepLabel}</p>
          <h2>{copy.creatorFormTitle}</h2>
          <p>{copy.creatorFormIntro}</p>
        </div>

        <label className="creator-field">
          <span>{copy.creatorQuestionLabel}</span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={copy.creatorQuestionPlaceholder}
            maxLength={180}
          />
          <small>{question.length} / 180</small>
        </label>

        <label className="creator-field">
          <span>{copy.creatorContextLabel}</span>
          <textarea
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder={copy.creatorContextPlaceholder}
            maxLength={600}
          />
          <small>{context.length} / 600</small>
        </label>

        <label className="creator-field">
          <span>{copy.creatorCategoryLabel}</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {copy.creatorCategories.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>

        <label className="creator-ai-option">
          <span className="creator-private-icon" aria-hidden="true">↗</span>
          <span>
            <strong>{communityCopy.privateAudience}</strong>
            <small>{communityCopy.privatePromise}</small>
          </span>
        </label>

        <div className="creator-form-footer">
          <p><span>{copy.previewLabel}</span>{copy.creatorPublishNote}</p>
          {isAuthenticated ? (
            <button
              type="submit"
              className="landing-primary-cta"
              disabled={pending}
            >
              {pending ? communityCopy.creating : communityCopy.createButton}
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <Link
              href={`/${locale}/access?next=${encodeURIComponent(`/${locale}/create`)}`}
              className="landing-primary-cta"
            >
              {communityCopy.signInToCreate}<span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
        {error ? <p className="creator-error" role="alert">{error}</p> : null}
      </form>

      <aside className="creator-preview-panel">
        <div className="creator-preview-browser">
          <span /><span /><span />
          <p>dbyle.com/{locale}/community/...</p>
        </div>
        <div className="creator-preview-content">
          <div className="creator-preview-topline">
            <span>{copy.previewLabel}</span>
            <span>{communityCopy.privateAudience}</span>
          </div>
          <p className="section-label">{category}</p>
          <h3>{previewQuestion}</h3>
          <p className="rich-copy">{previewContext}</p>
          <div className="creator-preview-sides">
            <div><strong>{copy.sideYes}</strong><span>{copy.creatorPreviewSide}</span></div>
            <div><strong>{copy.sideNo}</strong><span>{copy.creatorPreviewSide}</span></div>
          </div>
          <div className="creator-preview-ai">
            <span aria-hidden="true">✦</span>
            <p><strong>{copy.creatorPreviewAiTitle}</strong>{copy.creatorPreviewAiBody}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
