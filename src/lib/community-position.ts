import type {
  CommunityDebatePosition,
  CommunityPositionChoice,
  CommunityPositionSummary,
} from "./types";

const choices: CommunityPositionChoice[] = [
  "yes",
  "no",
  "undecided",
  "skip",
];

export function isCommunityPositionChoice(
  value: unknown,
): value is CommunityPositionChoice {
  return typeof value === "string" && choices.includes(value as CommunityPositionChoice);
}

function emptyCounts(): Record<CommunityPositionChoice, number> {
  return { yes: 0, no: 0, undecided: 0, skip: 0 };
}

export function computeCommunityPositionSummary(
  positions: CommunityDebatePosition[],
): CommunityPositionSummary {
  const baseline = emptyCounts();
  const current = emptyCounts();
  let measurableCount = 0;
  let changedCount = 0;

  for (const position of positions) {
    current[position.currentChoice] += 1;
    if (position.baselineChoice) {
      baseline[position.baselineChoice] += 1;
    }
    if (
      position.baselineChoice &&
      position.baselineChoice !== "skip" &&
      position.currentChoice !== "skip"
    ) {
      measurableCount += 1;
      if (position.currentChoice !== position.baselineChoice) {
        changedCount += 1;
      }
    }
  }

  return {
    responseCount: positions.length,
    measurableCount,
    changedCount,
    baseline,
    current,
  };
}
