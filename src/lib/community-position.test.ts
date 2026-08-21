import { describe, expect, it } from "vitest";
import { computeCommunityPositionSummary, isCommunityPositionChoice } from "./community-position";
import type { CommunityDebatePosition } from "./types";

function position(
  baselineChoice: CommunityDebatePosition["baselineChoice"],
  currentChoice: CommunityDebatePosition["currentChoice"],
): CommunityDebatePosition {
  return {
    id: crypto.randomUUID(),
    debateId: "debate",
    userId: crypto.randomUUID(),
    alias: "participant",
    baselineChoice,
    currentChoice,
    baselineAt: baselineChoice ? "2026-08-20T12:00:00.000Z" : null,
    currentAt: "2026-08-20T13:00:00.000Z",
    updatedAt: "2026-08-20T13:00:00.000Z",
  };
}

describe("community debate positions", () => {
  it("recognizes every supported answer", () => {
    expect(["yes", "no", "undecided", "skip"].every(isCommunityPositionChoice)).toBe(true);
    expect(isCommunityPositionChoice("maybe")).toBe(false);
  });

  it("measures changes without treating skipped baselines as evidence", () => {
    const summary = computeCommunityPositionSummary([
      position("no", "yes"),
      position("yes", "yes"),
      position("undecided", "yes"),
      position("skip", "no"),
      position("yes", "skip"),
      position(null, "undecided"),
    ]);

    expect(summary.responseCount).toBe(6);
    expect(summary.measurableCount).toBe(3);
    expect(summary.changedCount).toBe(2);
    expect(summary.baseline).toEqual({ yes: 2, no: 1, undecided: 1, skip: 1 });
    expect(summary.current).toEqual({ yes: 3, no: 1, undecided: 1, skip: 1 });
  });
});
