import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import {
  CommunityDebateInvite,
  CommunityDebateWorkspace,
} from "@/components/community-debate";
import { authOptions } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import {
  getCommunityDebateAccess,
  getUserProfile,
} from "@/lib/repository";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CommunityDebatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; debateId: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { locale: rawLocale, debateId } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const inviteCode = (await searchParams).invite ?? "";
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const access = await getCommunityDebateAccess(
    debateId,
    userId,
    inviteCode,
  );

  if (access.status === "not-found" || access.status === "forbidden") {
    notFound();
  }

  if (access.status === "member") {
    return <CommunityDebateWorkspace locale={locale} data={access.data} />;
  }

  if (userId) {
    const profile = await getUserProfile(userId);
    if (!profile) {
      const nextPath = `/${locale}/community/${debateId}?invite=${encodeURIComponent(inviteCode)}`;
      redirect(`/${locale}/welcome?next=${encodeURIComponent(nextPath)}`);
    }
  }

  return (
    <CommunityDebateInvite
      locale={locale}
      debate={access.debate}
      inviteCode={inviteCode}
      isAuthenticated={Boolean(userId)}
    />
  );
}
