"use client";

import Link from "next/link";
import { useState } from "react";
import { getCopy } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function DebateCreatorPreview({ locale }: { locale: Locale }) {
  const copy = getCopy(locale);
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState<string>(copy.creatorCategories[0]);
  const [visibility, setVisibility] = useState("public");
  const previewQuestion = question.trim() || copy.creatorExampleQuestion;
  const previewContext = context.trim() || copy.creatorExampleContext;

  return (
    <div className="creator-studio">
      <form className="creator-form" onSubmit={(event) => event.preventDefault()}>
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

        <div className="creator-field-row">
          <label className="creator-field">
            <span>{copy.creatorCategoryLabel}</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {copy.creatorCategories.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label className="creator-field">
            <span>{copy.creatorVisibilityLabel}</span>
            <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
              <option value="public">{copy.creatorVisibilityPublic}</option>
              <option value="community">{copy.creatorVisibilityCommunity}</option>
            </select>
          </label>
        </div>

        <label className="creator-ai-option">
          <input type="checkbox" defaultChecked />
          <span className="creator-ai-check" aria-hidden="true">✓</span>
          <span>
            <strong>{copy.creatorAiLabel}</strong>
            <small>{copy.creatorAiBody}</small>
          </span>
        </label>

        <div className="creator-form-footer">
          <p><span>{copy.previewLabel}</span>{copy.creatorPublishNote}</p>
          <Link
            href={`/${locale}/access?next=${encodeURIComponent(`/${locale}/create`)}`}
            className="landing-primary-cta"
          >
            {copy.creatorJoinBeta}<span aria-hidden="true">→</span>
          </Link>
        </div>
      </form>

      <aside className="creator-preview-panel">
        <div className="creator-preview-browser">
          <span /><span /><span />
          <p>dbyle.com/{locale}/debates/...</p>
        </div>
        <div className="creator-preview-content">
          <div className="creator-preview-topline">
            <span>{copy.previewLabel}</span>
            <span>{visibility === "public" ? copy.creatorVisibilityPublic : copy.creatorVisibilityCommunity}</span>
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
