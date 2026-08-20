import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { AccountAccessForm } from "@/components/account-access-form";
import { authOptions } from "@/lib/auth";
import { sanitizeInternalPath } from "@/lib/domain";
import { isPasswordResetEmailConfigured } from "@/lib/env";
import { getCopy, isLocale } from "@/lib/i18n";
import { getUserProfile } from "@/lib/repository";
import { DEBATE_SLUG, type Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

function sanitizeNextPath(input: string | undefined, locale: Locale) {
  return sanitizeInternalPath(
    input,
    `/${locale}/debates/${DEBATE_SLUG}`,
  );
}

export default async function AccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const nextPath = sanitizeNextPath((await searchParams).next, locale);
  const dictionary = getCopy(locale);
  const session = await getServerSession(authOptions);
  const profile = session?.user?.id
    ? await getUserProfile(session.user.id)
    : null;

  if (session?.user?.id) {
    if (profile) {
      redirect(nextPath);
    }

    redirect(`/${locale}/welcome?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <section className="access-page grid gap-4">
      <div className="access-hero-panel panel overflow-hidden rounded-[2.75rem] p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--color-highlight-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-highlight-strong)]">
                {dictionary.heroLabel}
              </span>
              <Link href={`/${locale}`} className="text-sm font-semibold text-[var(--color-muted-strong)]">
                {dictionary.accessBack}
              </Link>
            </div>
            <h2 className="max-w-3xl text-balance text-4xl font-semibold leading-tight text-[var(--color-ink)] sm:text-5xl">
              {dictionary.accessTitle}
            </h2>
            <p className="rich-copy max-w-3xl text-xl leading-9 text-[var(--color-ink)]/86">
              {dictionary.accessIntro}
            </p>
          </div>

          <div className="access-side-note rounded-[2rem] border border-[var(--color-border)] bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(239,246,255,0.86))] p-6">
            <p className="eyebrow text-xs font-bold text-[var(--color-muted-strong)]">
              {dictionary.pulseTitle}
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">
              {dictionary.authPrompt}
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted-strong)]">
              {dictionary.accessAccountHint}
            </p>
          </div>
        </div>
      </div>

      <AccountAccessForm
        locale={locale}
        nextPath={nextPath}
        passwordRecoveryEnabled={isPasswordResetEmailConfigured()}
      />
    </section>
  );
}
