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
  if (!isLocale(rawLocale) || slug !== DEBATE_SLUG) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const dictionary = getCopy(locale);
  const session = await getServerSession(authOptions);
  const data = await getDebatePageData(slug, session?.user?.id);

  if (
    session?.user?.id &&
    data.source === "firestore" &&
    !data.viewer.hasAlias
  ) {
    redirect(`/${locale}/welcome?next=${encodeURIComponent(`/${locale}/debates/${slug}`)}`);
  }

  const trendMessage =
    data.pulse.leadingSide === "yes"
      ? dictionary.societyLeansYes
      : data.pulse.leadingSide === "no"
        ? dictionary.societyLeansNo
        : dictionary.societyTie;

  return (
    <div className="grid gap-6">
      <section className="panel overflow-hidden rounded-[2.75rem] p-8 lg:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--color-highlight-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-highlight-strong)]">
                {dictionary.liveBadge}
              </span>
              <span className="rounded-full border border-[var(--color-border-strong)] bg-white/88 px-4 py-2 text-xs font-semibold text-[var(--color-muted-strong)]">
                {data.source === "firestore"
                  ? dictionary.seededBy
                  : dictionary.fallbackBadge}
              </span>
            </div>
            <p className="eyebrow text-xs font-bold text-[var(--color-muted-strong)]">
              {dictionary.debateQuestionLabel}
            </p>
            <h2 className="max-w-4xl text-balance text-4xl font-semibold leading-[0.98] text-[var(--color-ink)] sm:text-5xl">
              {data.debate.question[locale]}
            </h2>
            <p className="rich-copy max-w-3xl text-lg leading-9 text-[var(--color-ink)]/85">
              {data.debate.intro[locale]}
            </p>
            <Link
              href={`/${locale}`}
              className="btn-secondary inline-flex items-center gap-2"
            >
              {dictionary.backToDebate}
            </Link>
          </div>

          <aside className="grid gap-5">
            <div className="rounded-[2rem] border border-[var(--color-border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.94))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
              <p className="eyebrow text-xs font-bold text-[var(--color-muted-strong)]">
                {dictionary.pulseTitle}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
                {trendMessage}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted-strong)]">
                {dictionary.pulseSubtitle}
              </p>
              <div
                className="pulse-bar mt-5 h-4 rounded-full"
                style={{ ["--yes-width" as string]: `${data.pulse.yesPercent}%` } as CSSProperties}
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.4rem] border border-[var(--color-border-strong)] bg-[var(--color-yes-soft)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-yes)]">
                    {dictionary.sideYes}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--color-yes)]">
                    {formatPercent(locale, data.pulse.yesPercent)}%
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {formatNumber(locale, data.pulse.yesVotes)}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[var(--color-border-strong)] bg-[var(--color-no-soft)] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-no)]">
                    {dictionary.sideNo}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--color-no)]">
                    {formatPercent(locale, data.pulse.noPercent)}%
                  </p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {formatNumber(locale, data.pulse.noVotes)}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-[1.2rem] border border-[var(--color-border-strong)] bg-white/88 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">
                    {dictionary.participants}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                    {formatNumber(locale, data.pulse.voterCount)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-[var(--color-border-strong)] bg-white/88 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">
                    {dictionary.comments}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                    {formatNumber(locale, data.pulse.commentCount)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-[var(--color-border-strong)] bg-white/88 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-strong)]">
                    {dictionary.upvotes}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                    {formatNumber(locale, data.pulse.upvoteCount)}
                  </p>
                </div>
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
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel rounded-[2rem] p-6">
          <div className="mb-5">
            <p className="eyebrow text-xs font-bold text-[var(--color-yes)]">
              {dictionary.sideYes}
            </p>
            <h3 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
              {data.debate.yesLabel[locale]}
            </h3>
          </div>
          <div className="grid gap-4">
            {data.debate.yesArguments.map((argument) => (
              <ArgumentAccordion
                key={argument.id}
                locale={locale}
                argument={argument}
                tone="yes"
              />
            ))}
          </div>
        </div>

        <div className="panel rounded-[2rem] p-6">
          <div className="mb-5">
            <p className="eyebrow text-xs font-bold text-[var(--color-no)]">
              {dictionary.sideNo}
            </p>
            <h3 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">
              {data.debate.noLabel[locale]}
            </h3>
          </div>
          <div className="grid gap-4">
            {data.debate.noArguments.map((argument) => (
              <ArgumentAccordion
                key={argument.id}
                locale={locale}
                argument={argument}
                tone="no"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="panel rounded-[2rem] p-6">
        <div className="mb-5 flex flex-col gap-2">
          <p className="eyebrow text-xs font-bold text-[var(--color-muted)]">
            {dictionary.topComments}
          </p>
          <h3 className="text-3xl font-semibold text-[var(--color-ink)]">
            {dictionary.topComments}
          </h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {data.topComments.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] px-5 py-8 text-center text-sm text-[var(--color-muted)] lg:col-span-3">
              {dictionary.noCommentsYet}
            </div>
          ) : (
            data.topComments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-white/85 p-5"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  {comment.alias}
                </p>
                <p className="mt-2 rich-copy text-base leading-8 text-[var(--color-ink)]">
                  {comment.body}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-muted)]">
                  <span>
                    {dictionary.upvote} · {comment.upvoteCount}
                  </span>
                  <span>{formatDateTime(locale, comment.createdAt)}</span>
                </div>
              </article>
            ))
          )}
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
