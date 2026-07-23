import Link from "next/link";
import { CSSProperties } from "react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { formatDateTime, formatNumber, formatPercent, getCopy, isLocale } from "@/lib/i18n";
import { DEBATE_SLUG, type Locale } from "@/lib/types";
import { getDebatePageData } from "@/lib/repository";
import { VotePanel } from "@/components/vote-panel";
import { CommentsSection } from "@/components/comments-section";
import { ArgumentAccordion } from "@/components/argument-accordion";

export const dynamic = "force-dynamic";

export default async function DebatePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale) || slug !== DEBATE_SLUG) notFound();

  const locale = rawLocale as Locale;
  const copy = getCopy(locale);
  const session = await getServerSession(authOptions);
  const data = await getDebatePageData(slug, session?.user?.id);

  if (session?.user?.id && data.source === "firestore" && !data.viewer.hasAlias) {
    redirect(`/${locale}/welcome?next=${encodeURIComponent(`/${locale}/debates/${slug}`)}`);
  }

  return (
    <div className="debate-page">
      <section className="debate-opening">
        <div className="debate-question-column">
          <div className="debate-disclosure">
            <span aria-hidden="true">ⓘ</span>
            {data.pulse.isSimulated ? copy.simulatedDataLabel : copy.liveBadge}
          </div>
          <p className="section-label">{copy.debateQuestionLabel}</p>
          <h2>{data.debate.question[locale]}</h2>
          <p className="debate-intro rich-copy">{data.debate.intro[locale]}</p>
          <Link href={`/${locale}`} className="debate-back-link">
            <span aria-hidden="true">←</span>{copy.backToDebate}
          </Link>
        </div>

        <aside className="debate-decision-rail">
          <div className="debate-pulse">
            <p className="section-label">{copy.pulseTitle}</p>
            <div className="debate-pulse-results">
              <div className="debate-pulse-score is-yes">
                <strong>{formatPercent(locale, data.pulse.yesPercent)}<small>%</small></strong>
                <span>{copy.sideYes}</span>
              </div>
              <div className="debate-pulse-score is-no">
                <strong>{formatPercent(locale, data.pulse.noPercent)}<small>%</small></strong>
                <span>{copy.sideNo}</span>
              </div>
            </div>
            <div
              className="debate-pulse-bar"
              style={{ "--yes-width": `${data.pulse.yesPercent}%` } as CSSProperties}
            />
            <div className="debate-pulse-metrics">
              <div><strong>{formatNumber(locale, data.pulse.voterCount)}</strong><span>{copy.participants}</span></div>
              <div><strong>{formatNumber(locale, data.pulse.commentCount)}</strong><span>{copy.comments}</span></div>
              <div><strong>{formatNumber(locale, data.pulse.upvoteCount)}</strong><span>{copy.upvotes}</span></div>
            </div>
          </div>

          <VotePanel
            locale={locale}
            debateId={slug}
            isAuthenticated={Boolean(session?.user?.id)}
            hasAlias={data.viewer.hasAlias}
            currentVote={data.viewer.voteSide}
          />
        </aside>
      </section>

      <section className="arguments-section">
        <div className="debate-section-heading">
          <p className="section-label">{copy.debateArgumentsLabel}</p>
          <h2 className="rich-copy">{copy.exploreBothSides}</h2>
        </div>
        <div className="argument-columns">
          <div className="argument-side" data-tone="yes">
            <div className="argument-side-heading">
              <span>{copy.sideYes}</span>
              <h3>{data.debate.yesLabel[locale]}</h3>
            </div>
            {data.debate.yesArguments.map((argument, index) => (
              <ArgumentAccordion key={argument.id} locale={locale} argument={argument} tone="yes" index={index} />
            ))}
          </div>
          <div className="argument-side" data-tone="no">
            <div className="argument-side-heading">
              <span>{copy.sideNo}</span>
              <h3>{data.debate.noLabel[locale]}</h3>
            </div>
            {data.debate.noArguments.map((argument, index) => (
              <ArgumentAccordion key={argument.id} locale={locale} argument={argument} tone="no" index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="top-voices-section">
        <div className="top-voices-heading">
          <p className="section-label">{copy.topComments}</p>
          <h2 className="rich-copy">{copy.topComments}</h2>
        </div>
        <div className="top-voices-grid">
          {data.topComments.length === 0 ? (
            <p className="empty-state">{copy.noCommentsYet}</p>
          ) : data.topComments.map((comment, index) => (
            <article className="top-voice" key={comment.id}>
              <span className="top-voice-rank">{index + 1}</span>
              <div>
                <p className="top-voice-alias">{comment.alias}</p>
                <p className="top-voice-body rich-copy">{comment.body}</p>
                <div className="top-voice-meta">
                  <span>{copy.upvote} · {comment.upvoteCount}</span>
                  <span>{formatDateTime(locale, comment.createdAt)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CommentsSection
        locale={locale}
        debateId={slug}
        comments={data.comments}
        isAuthenticated={Boolean(session?.user?.id)}
        hasAlias={data.viewer.hasAlias}
      />
    </div>
  );
}
