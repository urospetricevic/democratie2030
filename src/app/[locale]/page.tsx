import Link from "next/link";
import { CSSProperties } from "react";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { formatNumber, formatPercent, getCopy, isLocale } from "@/lib/i18n";
import { DEBATE_SLUG, type Locale } from "@/lib/types";
import { getDebatePageData } from "@/lib/repository";

export const dynamic = "force-dynamic";

function FeatureIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    create: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    map: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="m7.7 7.1 3.2 8.9M16.3 7.1 13.1 16M8 6h8" /></>,
    brief: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    pulse: <><path d="M3 12h4l2-6 4 12 2-6h6" /></>,
    trust: <><path d="M12 3 4.5 6v5.2c0 4.5 3.2 8.1 7.5 9.8 4.3-1.7 7.5-5.3 7.5-9.8V6Z" /><path d="m9 12 2 2 4-4" /></>,
    translate: <><path d="M4 5h10M9 3v2c0 4-2 7-5 9M6 9c1.5 2.3 3.2 3.8 5.5 5" /><path d="m14 19 3-8 3 8M15 16h4" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const locale = rawLocale as Locale;
  const copy = getCopy(locale);
  const session = await getServerSession(authOptions);
  const data = await getDebatePageData(DEBATE_SLUG, session?.user?.id);
  const totalSignals = data.pulse.voterCount + data.pulse.commentCount + data.pulse.upvoteCount;

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-kicker">
            <span className="landing-live-dot" />
            <span>{copy.homeNetworkKicker}</span>
          </div>
          <h2 className="text-balance">{copy.homeTitle}</h2>
          <p className="landing-lede rich-copy">{copy.homeIntro}</p>
          <div className="landing-actions">
            <Link href={`/${locale}/debates/${DEBATE_SLUG}`} className="landing-primary-cta">
              {copy.homePrimaryCta}
              <span aria-hidden="true">↗</span>
            </Link>
            <Link href={`/${locale}/create`} className="landing-secondary-cta">
              {copy.createDebate}
              <span aria-hidden="true">＋</span>
            </Link>
          </div>
          <div className="landing-principles" aria-label={copy.homePrinciplesLabel}>
            {copy.homePrinciples.map((principle) => (
              <span key={principle}>
                <span aria-hidden="true">✓</span>{principle}
              </span>
            ))}
          </div>
        </div>

        <article className="featured-debate-card">
          <div className="featured-debate-topline">
            <div>
              <p className="section-label">{copy.featuredQuestion}</p>
              <span className="featured-topic">{copy.featuredTopic}</span>
            </div>
            <span className="featured-status">
              <span aria-hidden="true" />
              {data.pulse.isSimulated ? copy.pilotStatus : copy.liveBadge}
            </span>
          </div>

          <h3>{data.debate.question[locale]}</h3>
          <p className="featured-debate-intro rich-copy">{data.debate.intro[locale]}</p>

          <div className="featured-pulse">
            <div className="featured-pulse-labels">
              <strong className="is-yes">{formatPercent(locale, data.pulse.yesPercent)}% {copy.sideYes}</strong>
              <strong className="is-no">{formatPercent(locale, data.pulse.noPercent)}% {copy.sideNo}</strong>
            </div>
            <div
              className="featured-pulse-bar"
              style={{ "--yes-width": `${data.pulse.yesPercent}%` } as CSSProperties}
            />
          </div>

          <div className="featured-card-footer">
            <div className="featured-voices">
              {data.topComments.slice(0, 3).map((comment, index) => (
                <span key={comment.id} style={{ zIndex: 3 - index }}>
                  {comment.alias.slice(0, 2).toLocaleUpperCase(locale)}
                </span>
              ))}
              <p>
                <strong>{formatNumber(locale, totalSignals)}</strong>
                {copy.communitySignals}
              </p>
            </div>
            <Link href={`/${locale}/debates/${DEBATE_SLUG}`} className="featured-open-link" aria-label={copy.homePrimaryCta}>
              →
            </Link>
          </div>
        </article>
      </section>

      <section className="landing-belief-strip">
        <p>{copy.oldInternetLabel}</p>
        <h3 className="rich-copy">{copy.oldInternetText}</h3>
        <span aria-hidden="true">→</span>
        <div>
          <p>{copy.dbyleInternetLabel}</p>
          <h3>{copy.dbyleInternetText}</h3>
        </div>
      </section>

      <section className="platform-section" id="platform">
        <div className="platform-heading">
          <div>
            <p className="section-label">{copy.platformLabel}</p>
            <h2>{copy.platformTitle}</h2>
          </div>
          <p className="rich-copy">{copy.platformIntro}</p>
        </div>

        <div className="feature-grid">
          {copy.platformFeatures.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-card-top">
                <span className="feature-icon"><FeatureIcon name={feature.icon} /></span>
                <span className={`feature-status ${feature.status === "live" ? "is-live" : ""}`}>
                  {feature.status === "live" ? copy.featureStatusLive : copy.featureStatusNext}
                </span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              {feature.icon === "create" ? (
                <Link href={`/${locale}/create`} className="feature-link">
                  {copy.openCreatorStudio}<span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="ai-synthesis-section">
        <div className="ai-synthesis-visual" aria-label={copy.aiFlowLabel}>
          <div className="voice-cloud">
            <span>“</span><span>●</span><span>+</span><span>○</span><span>”</span>
            <span>—</span><span>●</span><span>?</span><span>+</span><span>○</span>
            <span>“</span><span>—</span><span>●</span><span>”</span><span>?</span>
          </div>
          <div className="flow-arrow" aria-hidden="true">→</div>
          <div className="synthesis-stack">
            <div><span>01</span>{copy.aiFlowThemes}</div>
            <div><span>02</span>{copy.aiFlowConsensus}</div>
            <div><span>03</span>{copy.aiFlowDisagreement}</div>
          </div>
        </div>
        <div className="ai-synthesis-copy">
          <p className="section-label">{copy.aiCapabilityLabel}</p>
          <h2>{copy.aiCapabilityTitle}</h2>
          <p className="rich-copy">{copy.universalVisionBody}</p>
          <div className="human-judgment-note">
            <span aria-hidden="true">◎</span>
            <p><strong>{copy.humanJudgmentTitle}</strong>{copy.humanJudgmentBody}</p>
          </div>
        </div>
      </section>

      <section className="network-section" id="vision">
        <div className="network-heading">
          <p className="section-label">{copy.networkLabel}</p>
          <h2>{copy.networkTitle}</h2>
          <p className="rich-copy">{copy.networkIntro}</p>
        </div>
        <div className="network-use-cases">
          {copy.networkUseCases.map((useCase, index) => (
            <article key={useCase.title}>
              <span>0{index + 1}</span>
              <h3>{useCase.title}</h3>
              <p>{useCase.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="creator-cta-section">
        <div>
          <p className="section-label">{copy.creatorCtaLabel}</p>
          <h2>{copy.creatorCtaTitle}</h2>
        </div>
        <div>
          <p className="rich-copy">{copy.creatorCtaBody}</p>
          <Link href={`/${locale}/create`} className="landing-primary-cta">
            {copy.createDebate}<span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
