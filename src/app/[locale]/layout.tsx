import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getCopy, isLocale } from "@/lib/i18n";
import { getUserProfile } from "@/lib/repository";
import type { Locale } from "@/lib/types";
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
      <div className="mx-auto flex min-h-screen w-full max-w-[1536px] flex-col">
        <header className="site-header">
          <div className="brand-lockup">
            <Link href={`/${locale}`}><h1>{dictionary.brand}</h1></Link>
            <p className="rich-copy">{dictionary.strapline}</p>
          </div>
          <nav className="site-nav" aria-label="Main navigation">
            <Link href={`/${locale}`}>{dictionary.navExplore}</Link>
            <Link href={`/${locale}#platform`}>{dictionary.navPlatform}</Link>
            <Link href={`/${locale}#vision`}>{dictionary.navVision}</Link>
            {session?.user?.id ? (
              <Link href={`/${locale}/portal`}>{dictionary.portal.navLabel}</Link>
            ) : null}
          </nav>
          <div className="header-actions">
            <LanguageSwitcher locale={locale} />
            <Link href={`/${locale}/create`} className="header-create-link">
              <span aria-hidden="true">＋</span>{dictionary.createDebate}
            </Link>
            <AuthControls
              locale={locale}
              isAuthenticated={Boolean(session?.user?.id)}
              alias={profile?.alias ?? session?.user?.name ?? null}
            />
          </div>
        </header>

        <main className="flex-1">{children}</main>
        <footer className="site-footer">
          <div className="footer-brand">
            <strong>{dictionary.brand}</strong>
            <p className="rich-copy">{dictionary.strapline}</p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href={`/${locale}`}>{dictionary.navExplore}</Link>
            <Link href={`/${locale}/create`}>{dictionary.createDebate}</Link>
            {session?.user?.id ? (
              <Link href={`/${locale}/portal`}>{dictionary.portal.navLabel}</Link>
            ) : null}
            <Link href={`/${locale}#vision`}>{dictionary.navVision}</Link>
          </nav>
          <p className="footer-ai">{dictionary.aiInfrastructure}</p>
        </footer>
      </div>
    </div>
  );
}
