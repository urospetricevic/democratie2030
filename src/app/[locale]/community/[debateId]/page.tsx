import { getServerSession } from "next-auth";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  CommunityDebateInvite,
  CommunityDebateWorkspace,
} from "@/components/community-debate";
import { authOptions } from "@/lib/auth";
import {
  buildCommunityInviteImageUrl,
  buildCommunityInviteUrl,
  getCommunityInvitePreviewCopy,
  getPublicAppUrl,
} from "@/lib/community-invite-preview";
import { appEnv } from "@/lib/env";
import { isCommunityPositionChoice } from "@/lib/community-position";
import { isLocale } from "@/lib/i18n";
import {
  getCommunityDebateAccess,
  getUserProfile,
} from "@/lib/repository";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; debateId: string }>;
  searchParams: Promise<{ invite?: string; position?: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, debateId } = await params;
  const inviteCode = (await searchParams).invite ?? "";

  if (!isLocale(rawLocale) || !inviteCode) {
    return {
      title: "Private debate | DBYLE",
      robots: { index: false, follow: false },
    };
  }

  const locale = rawLocale as Locale;
  const access = await getCommunityDebateAccess(debateId, null, inviteCode);
  if (access.status !== "invite") {
    return {
      title: "Private debate | DBYLE",
      robots: { index: false, follow: false },
    };
  }

  const copy = getCommunityInvitePreviewCopy(locale, access.debate);
  const appUrl = getPublicAppUrl(appEnv.appUrl);
  const invitationUrl = buildCommunityInviteUrl(
    appUrl,
    locale,
    debateId,
    inviteCode,
  );
  const imageUrl = buildCommunityInviteImageUrl(
    appUrl,
    locale,
    debateId,
    inviteCode,
  );

  return {
    title: copy.title,
    description: copy.description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "DBYLE",
      title: copy.title,
      description: copy.description,
      url: invitationUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: access.debate.question,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [imageUrl],
    },
  };
}

export default async function CommunityDebatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; debateId: string }>;
  searchParams: Promise<{ invite?: string; position?: string }>;
}) {
  const { locale: rawLocale, debateId } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const query = await searchParams;
  const inviteCode = query.invite ?? "";
  const initialPosition = isCommunityPositionChoice(query.position)
    ? query.position
    : null;
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
      const nextUrl = new URL(`https://dbyle.local/${locale}/community/${debateId}`);
      nextUrl.searchParams.set("invite", inviteCode);
      if (initialPosition) nextUrl.searchParams.set("position", initialPosition);
      const nextPath = `${nextUrl.pathname}${nextUrl.search}`;
      redirect(`/${locale}/welcome?next=${encodeURIComponent(nextPath)}`);
    }
  }

  return (
    <CommunityDebateInvite
      locale={locale}
      debate={access.debate}
      inviteCode={inviteCode}
      isAuthenticated={Boolean(userId)}
      initialPosition={initialPosition}
    />
  );
}
