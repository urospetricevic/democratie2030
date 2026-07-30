import { notFound } from "next/navigation";
import { ResetPasswordForm } from "@/components/password-recovery-forms";
import { getCopy, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ request?: string; token?: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const copy = getCopy(locale);
  const query = await searchParams;

  return (
    <section className="password-recovery-page">
      <div className="password-recovery-copy">
        <div className="landing-kicker">
          <span className="landing-live-dot" />
          <span>{copy.resetPasswordKicker}</span>
        </div>
        <h1>{copy.resetPasswordTitle}</h1>
        <p className="rich-copy">{copy.resetPasswordIntro}</p>
      </div>
      <div className="password-recovery-panel">
        <ResetPasswordForm
          locale={locale}
          requestId={query.request ?? ""}
          token={query.token ?? ""}
        />
      </div>
    </section>
  );
}
