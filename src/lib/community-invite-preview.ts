import type { CommunityDebate, Locale } from "./types";

const DEFAULT_APP_URL = "https://dbyle.com";

export function getCommunityInvitePreviewCopy(
  locale: Locale,
  debate: Pick<CommunityDebate, "ownerAlias" | "question">,
) {
  if (locale === "fr") {
    return {
      title: `${debate.question} | Invitation DBYLE`,
      description: `@${debate.ownerAlias} vous invite à participer à ce débat privé sur DBYLE. Découvrez les arguments des deux côtés et ajoutez votre point de vue.`,
      eyebrow: "INVITATION À UN DÉBAT PRIVÉ",
      invitedBy: `Invité·e par @${debate.ownerAlias}`,
      callToAction: "Rejoindre le débat →",
    };
  }

  return {
    title: `${debate.question} | DBYLE invitation`,
    description: `@${debate.ownerAlias} invited you to this private debate on DBYLE. Explore both sides and add your point of view.`,
    eyebrow: "PRIVATE DEBATE INVITATION",
    invitedBy: `Invited by @${debate.ownerAlias}`,
    callToAction: "Join the debate →",
  };
}

export function getPublicAppUrl(configuredUrl?: string) {
  try {
    return new URL(configuredUrl || DEFAULT_APP_URL);
  } catch {
    return new URL(DEFAULT_APP_URL);
  }
}

export function buildCommunityInviteUrl(
  appUrl: URL,
  locale: Locale,
  debateId: string,
  inviteCode: string,
) {
  const url = new URL(`/${locale}/community/${encodeURIComponent(debateId)}`, appUrl);
  url.searchParams.set("invite", inviteCode);
  return url;
}

export function buildCommunityInviteImageUrl(
  appUrl: URL,
  locale: Locale,
  debateId: string,
  inviteCode: string,
) {
  const url = new URL(
    `/api/community-debates/${encodeURIComponent(debateId)}/preview`,
    appUrl,
  );
  url.searchParams.set("invite", inviteCode);
  url.searchParams.set("locale", locale);
  return url;
}
