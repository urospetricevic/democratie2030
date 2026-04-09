import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCopy, isLocale } from "@/lib/i18n";
import { DEBATE_SLUG, type Locale } from "@/lib/types";
import { getUserProfile } from "@/lib/repository";
import { AliasForm } from "@/components/alias-form";

export const dynamic = "force-dynamic";

export default async function WelcomePage({
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
  const dictionary = getCopy(locale);
  const session = await getServerSession(authOptions);
  const nextPath =
    (await searchParams).next ?? `/${locale}/debates/${DEBATE_SLUG}`;

  if (!session?.user?.id || !session.user.email) {
    redirect(`/${locale}`);
  }

  const profile = await getUserProfile(session.user.id);
  if (profile) {
    redirect(nextPath);
  }

  return (
    <section className="panel mx-auto max-w-3xl rounded-[2.5rem] p-8 sm:p-10">
      <p className="eyebrow text-xs font-bold text-[var(--color-muted)]">
        {dictionary.aliasTitle}
      </p>
      <h2 className="mt-3 text-4xl font-semibold text-[var(--color-ink)]">
        {dictionary.aliasTitle}
      </h2>
      <p className="rich-copy mt-4 text-lg leading-9 text-[var(--color-ink)]/85">
        {dictionary.aliasIntro}
      </p>
      <div className="mt-8">
        <AliasForm locale={locale} nextPath={nextPath} />
      </div>
    </section>
  );
}
