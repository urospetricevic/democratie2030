import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "@/components/password-recovery-forms";
import { isPasswordResetEmailConfigured } from "@/lib/env";
import { getCopy, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const copy = getCopy(locale);

  return (
    <section className="password-recovery-page">
      <div className="password-recovery-copy">
        <div className="landing-kicker">
          <span className="landing-live-dot" />
          <span>{copy.forgotPasswordKicker}</span>
        </div>
        <h1>{copy.forgotPasswordTitle}</h1>
        <p className="rich-copy">{copy.forgotPasswordIntro}</p>
      </div>
      <div className="password-recovery-panel">
        <ForgotPasswordForm
          locale={locale}
          available={isPasswordResetEmailConfigured()}
        />
      </div>
    </section>
  );
}
