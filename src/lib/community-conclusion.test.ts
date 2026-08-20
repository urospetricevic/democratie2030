import { describe, expect, it } from "vitest";
import { computeArgumentFingerprint } from "@/lib/community-conclusion";
import type { CommunityArgument } from "@/lib/types";

const baseArgument: CommunityArgument = {
  id: "argument-1",
  debateId: "debate-1",
  side: "yes",
  authorId: "user-1",
  authorAlias: "citizen",
  title: "A material benefit",
  body: "This is a sufficiently detailed argument body.",
  sources: [],
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
};

describe("community conclusion fingerprints", () => {
  it("is stable regardless of argument order", () => {
    const second = { ...baseArgument, id: "argument-2", side: "no" as const };
    expect(computeArgumentFingerprint([baseArgument, second])).toBe(
      computeArgumentFingerprint([second, baseArgument]),
    );
  });

  it("changes when an argument changes", () => {
    expect(computeArgumentFingerprint([baseArgument])).not.toBe(
      computeArgumentFingerprint([
        { ...baseArgument, body: `${baseArgument.body} Updated.` },
      ]),
    );
  });
});
