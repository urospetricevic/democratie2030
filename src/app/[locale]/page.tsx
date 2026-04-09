import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatNumber, formatPercent, getCopy, isLocale } from "@/lib/i18n";
import { DEBATE_SLUG, type Locale } from "@/lib/types";
import { getDebatePageData } from "@/lib/repository";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const dictionary = getCopy(locale);
  const session = await getServerSession(authOptions);
  const data = await getDebatePageData(DEBATE_SLUG, session?.user?.id);

  return (
    <div className="grid gap-6">
      <section className="panel overflow-hidden rounded-[2.75rem] p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.8fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="eyebrow text-xs font-bold text-[var(--color-highlight-strong)]">
                {dictionary.liveBadge}
              </p>
              <h2 className="max-w-4xl text-balance text-4xl font-semibold leading-[0.96] text-[var(--color-ink)] sm:text-6xl">
                {dictionary.homeTitle}
              </h2>
              <p className="rich-copy max-w-3xl text-xl leading-10 text-[var(--color-ink)]/82">
                {dictionary.homeIntro}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/debates/${DEBATE_SLUG}`}
                className="btn-hero inline-flex items-center gap-2"
              >
                <span>{dictionary.homePrimaryCta}</span>
                <span aria-hidden="true">→</span>
              </Link>
              <a
                href="#societal-pulse"
                className="btn-secondary inline-flex items-center gap-2"
              >
                {dictionary.homeSecondaryCta}
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-[var(--color-border-strong)] bg-white/82 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">
                  {dictionary.participants}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
                  {formatNumber(locale, data.pulse.voterCount)}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--color-border-strong)] bg-white/82 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">
                  {dictionary.comments}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
                  {formatNumber(locale, data.pulse.commentCount)}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--color-border-strong)] bg-white/82 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">
                  {dictionary.upvotes}
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
                  {formatNumber(locale, data.pulse.upvoteCount)}
                </p>
              </div>
            </div>
          </div>

          <div
            id="societal-pulse"
            className="rounded-[2.25rem] border border-[var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.94))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)]"
          >
            <p className="eyebrow text-xs font-bold text-[var(--color-muted-strong)]">
              {dictionary.pulseTitle}
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
              {data.debate.question[locale]}
            </h3>
            <div
              className="pulse-bar mt-5 h-3 rounded-full"
              style={{ ["--yes-width" as string]: `${data.pulse.yesPercent}%` }}
            />
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-[1.5rem] border border-[var(--color-border-strong)] bg-[var(--color-yes-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-yes)]">
                  Yes
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-yes)]">
                  {formatPercent(locale, data.pulse.yesPercent)}%
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {formatNumber(locale, data.pulse.yesVotes)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[var(--color-border-strong)] bg-[var(--color-no-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-no)]">
                  No
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-no)]">
                  {formatPercent(locale, data.pulse.noPercent)}%
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {formatNumber(locale, data.pulse.noVotes)}
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--color-muted-strong)]">
              {dictionary.whyItWorksText}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="panel rounded-[2rem] p-6">
          <p className="eyebrow text-xs font-bold text-[var(--color-muted-strong)]">
            {dictionary.pulseTitle}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            {dictionary.whyItWorksTitle}
          </h3>
          <p className="mt-4 text-sm leading-7 text-[var(--color-muted-strong)]">
            {dictionary.whyItWorksText}
          </p>
        </article>

        <article className="panel rounded-[2rem] p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-[var(--color-muted-strong)]">
                {dictionary.participants}
              </p>
              <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">
                {formatNumber(locale, data.pulse.voterCount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-strong)]">
                {dictionary.comments}
              </p>
              <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">
                {formatNumber(locale, data.pulse.commentCount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted-strong)]">
                {dictionary.upvotes}
              </p>
              <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">
                {formatNumber(locale, data.pulse.upvoteCount)}
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
