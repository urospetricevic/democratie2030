import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { DebatePortal } from "@/components/debate-portal";
import { authOptions } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import {
  getCommunityDebatesForUser,
  getUserProfile,
} from "@/lib/repository";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const nextPath = `/${locale}/portal`;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}/access?next=${encodeURIComponent(nextPath)}`);
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    redirect(`/${locale}/welcome?next=${encodeURIComponent(nextPath)}`);
  }

  const debates = await getCommunityDebatesForUser(session.user.id);
  return (
    <DebatePortal
      locale={locale}
      alias={profile.alias}
      debates={debates}
    />
  );
}
