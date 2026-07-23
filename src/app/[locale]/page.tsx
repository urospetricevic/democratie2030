import Link from "next/link";
import { CSSProperties } from "react";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { formatPercent, getCopy, isLocale } from "@/lib/i18n";
import { DEBATE_SLUG, type Locale } from "@/lib/types";
import { getDebatePageData } from "@/lib/repository";

export const dynamic = "force-dynamic";

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

  return (
    <div className="home-shell">
      <section className="home-hero">
        <div className="hero-copy">
          <h2>{copy.homeTitle}</h2>
          <div className="hero-rule" />
          <p className="hero-thesis rich-copy">{copy.homeIntro}</p>

          <div className="featured-question">
            <p className="section-label">{copy.featuredQuestion}</p>
            <h3>{data.debate.question[locale]}</h3>
            <div className="hero-actions">
              <Link href={`/${locale}/debates/${DEBATE_SLUG}`} className="primary-action">
                {copy.homePrimaryCta}<span aria-hidden="true">→</span>
              </Link>
              <a href="#public-pulse" className="outline-action">{copy.homeSecondaryCta}</a>
            </div>
          </div>
        </div>

        <aside id="public-pulse" className="pulse-module">
          <div className="pulse-heading">
            <p className="section-label">{copy.pulseTitle}</p>
            <span className="live-dot">{copy.liveUpdate}</span>
          </div>
          <div className="pulse-results">
            <div className="result result-yes">
              <span>{copy.sideYes}</span>
              <strong>{formatPercent(locale, data.pulse.yesPercent)}<small>%</small></strong>
            </div>
            <div className="pulse-arc" style={{ "--yes-width": `${data.pulse.yesPercent}%` } as CSSProperties}>
              <div className="pulse-people" aria-hidden="true">○ ○ ○</div>
              <p>{copy.openParticipation}</p>
            </div>
            <div className="result result-no">
              <span>{copy.sideNo}</span>
              <strong>{formatPercent(locale, data.pulse.noPercent)}<small>%</small></strong>
            </div>
          </div>
          <Link href={`/${locale}/debates/${DEBATE_SLUG}`} className="text-link">
            {copy.explorePulse}<span aria-hidden="true">→</span>
          </Link>
        </aside>
      </section>

      <section className="home-manifesto">
        <article>
          <p className="section-label">{copy.whyDbyle}</p>
          <h3 className="rich-copy">{copy.signalTitle}</h3>
          <p>{copy.signalBody}</p>
        </article>

        <article className="method-column">
          <p className="section-label">{copy.howItWorks}</p>
          {copy.steps.map((step, index) => (
            <div className="method-step" key={step.title}>
              <span>{index + 1}</span>
              <div><h4 className="rich-copy">{step.title}</h4><p>{step.body}</p></div>
            </div>
          ))}
        </article>

        <article className="vision-column">
          <p className="section-label">{copy.globalVision}</p>
          <h3 className="rich-copy">{copy.universalTitle}</h3>
          <h4 className="rich-copy">{copy.aiCapabilityTitle}</h4>
          <p>{copy.universalVisionBody}</p>
          <Link href={`/${locale}/debates/${DEBATE_SLUG}`} className="text-link">
            {copy.startHere}<span aria-hidden="true">→</span>
          </Link>
          <div className="globe-mark" aria-hidden="true">◎</div>
        </article>
      </section>
    </div>
  );
}
