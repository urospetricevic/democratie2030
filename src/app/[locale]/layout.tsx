import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCopy, isLocale } from "@/lib/i18n";
import { getUserProfile } from "@/lib/repository";
import type { Locale } from "@/lib/types";
import { isGoogleAuthConfigured } from "@/lib/env";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AuthControls } from "@/components/auth-controls";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const dictionary = getCopy(locale);
  const session = await getServerSession(authOptions);
  const profile = session?.user?.id
    ? await getUserProfile(session.user.id)
    : null;

  return (
    <div className="site-frame min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8">
        <header className="panel rounded-[2rem] px-6 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="eyebrow text-xs font-bold text-[var(--color-muted)]">
                {dictionary.heroLabel}
              </p>
              <Link href={`/${locale}`} className="inline-block">
                <h1 className="text-3xl font-semibold text-[var(--color-ink)]">
                  {dictionary.brand}
                </h1>
              </Link>
              <p className="max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
                {dictionary.strapline}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <LanguageSwitcher locale={locale} />
              <AuthControls
                locale={locale}
                isAuthenticated={Boolean(session?.user?.id)}
                googleEnabled={isGoogleAuthConfigured()}
                alias={profile?.alias ?? session?.user?.name ?? null}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
