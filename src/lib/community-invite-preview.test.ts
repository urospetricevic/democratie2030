import { describe, expect, it } from "vitest";
import {
  buildCommunityInviteImageUrl,
  buildCommunityInviteUrl,
  getCommunityInvitePreviewCopy,
  getPublicAppUrl,
} from "./community-invite-preview";

const debate = {
  question: "Is capitalism net positive?",
  ownerAlias: "urospet",
};

describe("community invitation previews", () => {
  it("personalizes French preview copy with the debate title and host", () => {
    const copy = getCommunityInvitePreviewCopy("fr", debate);

    expect(copy.title).toBe("Is capitalism net positive? | Invitation DBYLE");
    expect(copy.description).toContain("@urospet");
    expect(copy.eyebrow).toBe("INVITATION À UN DÉBAT PRIVÉ");
  });

  it("builds invitation and preview URLs with the invite code", () => {
    const appUrl = getPublicAppUrl("https://dbyle.com");
    const invitation = buildCommunityInviteUrl(appUrl, "en", "debate id", "secret");
    const image = buildCommunityInviteImageUrl(appUrl, "en", "debate id", "secret");

    expect(invitation.toString()).toBe(
      "https://dbyle.com/en/community/debate%20id?invite=secret",
    );
    expect(image.toString()).toBe(
      "https://dbyle.com/api/community-debates/debate%20id/preview?invite=secret&locale=en",
    );
  });

  it("falls back to the branded domain when configuration is invalid", () => {
    expect(getPublicAppUrl("not a url").origin).toBe("https://dbyle.com");
  });
});
