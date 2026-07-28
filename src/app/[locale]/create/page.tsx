import { notFound } from "next/navigation";
import { DebateCreatorPreview } from "@/components/debate-creator-preview";
import { getCopy, isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export default async function CreateDebatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();

  const locale = rawLocale as Locale;
  const copy = getCopy(locale);

  return (
    <div className="creator-page">
      <section className="creator-page-heading">
        <div className="landing-kicker">
          <span className="landing-live-dot" />
          <span>{copy.creatorPreviewKicker}</span>
        </div>
        <h1>{copy.creatorPageTitle}</h1>
        <p className="rich-copy">{copy.creatorPageIntro}</p>
      </section>
      <DebateCreatorPreview locale={locale} />
      <section className="creator-roadmap">
        <p className="section-label">{copy.creatorRoadmapLabel}</p>
        <div>
          {copy.creatorRoadmap.map((item, index) => (
            <article key={item.title}>
              <span>0{index + 1}</span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
