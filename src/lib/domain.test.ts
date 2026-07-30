import { describe, expect, it } from "vitest";
import {
  clampCommentBody,
  computeSocietalPulse,
  computeVoteTotals,
  isCommunityMember,
  isEmailValid,
  isPasswordValid,
  isValidSourceUrl,
  normalizeAlias,
  normalizeCommunityQuestion,
  normalizeEmail,
  sanitizeInternalPath,
  sortCommentsBySupport,
} from "./domain";
import type { CommentRecord } from "./types";

describe("normalizeAlias", () => {
  it("normalizes accents, spacing, and casing", () => {
    expect(normalizeAlias(" Électeur Libre ")).toBe("electeur-libre");
  });

  it("keeps supported characters", () => {
    expect(normalizeAlias("citizen_2030")).toBe("citizen_2030");
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases email addresses", () => {
    expect(normalizeEmail(" Citoyen@Example.COM ")).toBe("citoyen@example.com");
  });
});

describe("isEmailValid", () => {
  it("accepts a standard email address", () => {
    expect(isEmailValid("citoyen@example.com")).toBe(true);
  });

  it("rejects malformed email addresses", () => {
    expect(isEmailValid("citoyen.example.com")).toBe(false);
  });
});

describe("isPasswordValid", () => {
  it("accepts a password with letters and numbers", () => {
    expect(isPasswordValid("Debat2030")).toBe(true);
  });

  it("rejects weak passwords", () => {
    expect(isPasswordValid("debatsanschiffre")).toBe(false);
  });
});

describe("computeVoteTotals", () => {
  it("counts a first vote", () => {
    expect(
      computeVoteTotals(
        { yesVotes: 0, noVotes: 0, voterCount: 0 },
        null,
        "yes",
      ),
    ).toEqual({
      yesVotes: 1,
      noVotes: 0,
      voterCount: 1,
    });
  });

  it("switches a vote from yes to no", () => {
    expect(
      computeVoteTotals(
        { yesVotes: 10, noVotes: 5, voterCount: 15 },
        "yes",
        "no",
      ),
    ).toEqual({
      yesVotes: 9,
      noVotes: 6,
      voterCount: 15,
    });
  });
});

describe("computeSocietalPulse", () => {
  it("computes balanced percentages when nobody voted", () => {
    expect(
      computeSocietalPulse({
        debateId: "quebec-country",
        yesVotes: 0,
        noVotes: 0,
        voterCount: 0,
        commentCount: 0,
        upvoteCount: 0,
        topCommentIds: [],
        updatedAt: "2026-04-08T00:00:00.000Z",
      }),
    ).toMatchObject({
      totalVotes: 0,
      yesPercent: 50,
      noPercent: 50,
      leadingSide: "tie",
    });
  });

  it("detects the leading side", () => {
    expect(
      computeSocietalPulse({
        debateId: "quebec-country",
        yesVotes: 64,
        noVotes: 36,
        voterCount: 100,
        commentCount: 4,
        upvoteCount: 7,
        topCommentIds: [],
        updatedAt: "2026-04-08T00:00:00.000Z",
      }).leadingSide,
    ).toBe("yes");
  });
});

describe("sortCommentsBySupport", () => {
  it("sorts first by support and then by recency", () => {
    const comments: CommentRecord[] = [
      {
        id: "one",
        debateId: "quebec-country",
        authorId: "1",
        alias: "alpha",
        body: "One",
        upvoteCount: 2,
        createdAt: "2026-04-08T10:00:00.000Z",
        updatedAt: "2026-04-08T10:00:00.000Z",
      },
      {
        id: "two",
        debateId: "quebec-country",
        authorId: "2",
        alias: "beta",
        body: "Two",
        upvoteCount: 5,
        createdAt: "2026-04-08T08:00:00.000Z",
        updatedAt: "2026-04-08T08:00:00.000Z",
      },
      {
        id: "three",
        debateId: "quebec-country",
        authorId: "3",
        alias: "gamma",
        body: "Three",
        upvoteCount: 5,
        createdAt: "2026-04-08T12:00:00.000Z",
        updatedAt: "2026-04-08T12:00:00.000Z",
      },
    ];

    expect(sortCommentsBySupport(comments).map((comment) => comment.id)).toEqual(
      ["three", "two", "one"],
    );
  });
});

describe("clampCommentBody", () => {
  it("trims and collapses whitespace", () => {
    expect(clampCommentBody("  un   texte   propre  ")).toBe("un texte propre");
  });
});

describe("community debate input", () => {
  it("normalizes a debate question without removing punctuation", () => {
    expect(normalizeCommunityQuestion("  Should   Québec be a country?  ")).toBe(
      "Should Québec be a country?",
    );
  });

  it("only accepts HTTP sources", () => {
    expect(isValidSourceUrl("https://www150.statcan.gc.ca/example")).toBe(true);
    expect(isValidSourceUrl("javascript:alert(1)")).toBe(false);
    expect(isValidSourceUrl("not a url")).toBe(false);
  });

  it("recognizes invited members", () => {
    expect(isCommunityMember(["host", "friend"], "friend")).toBe(true);
    expect(isCommunityMember(["host", "friend"], "stranger")).toBe(false);
  });
});

describe("sanitizeInternalPath", () => {
  it("preserves an internal invite path and rejects external redirects", () => {
    const invitePath = "/en/community/debate-1?invite=secret";
    expect(sanitizeInternalPath(invitePath, "/en")).toBe(invitePath);
    expect(sanitizeInternalPath("//example.com", "/en")).toBe("/en");
    expect(sanitizeInternalPath("/\\example.com", "/en")).toBe("/en");
  });
});
