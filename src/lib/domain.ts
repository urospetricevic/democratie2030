import type {
  CommentRecord,
  DebateAggregate,
  SocietalPulse,
  VoteSide,
} from "@/lib/types";

const ALIAS_PATTERN = /^[a-z0-9_-]{3,24}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

export function normalizeAlias(input: string) {
  return input
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export function isAliasValid(input: string) {
  return ALIAS_PATTERN.test(input);
}

export function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

export function isEmailValid(input: string) {
  return EMAIL_PATTERN.test(input);
}

export function isPasswordValid(input: string) {
  return PASSWORD_PATTERN.test(input);
}

export function clampCommentBody(input: string) {
  return input.trim().replace(/\s+/g, " ").slice(0, 1200);
}

export function normalizeCommunityQuestion(input: string) {
  return input.trim().replace(/\s+/g, " ").slice(0, 180);
}

export function normalizeCommunityCategory(input: string) {
  return input.trim().replace(/\s+/g, " ").slice(0, 50);
}

export function normalizeCommunityText(input: string, maxLength: number) {
  return input.trim().replace(/\r\n/g, "\n").slice(0, maxLength);
}

export function isValidSourceUrl(input: string) {
  if (input.length > 2048) {
    return false;
  }

  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function isCommunityMember(memberIds: string[], userId?: string | null) {
  return Boolean(userId && memberIds.includes(userId));
}

export function sanitizeInternalPath(
  input: string | undefined,
  fallback: string,
) {
  if (
    !input ||
    !input.startsWith("/") ||
    input.startsWith("//") ||
    input.includes("\\")
  ) {
    return fallback;
  }

  return input;
}

export function sortCommentsBySupport(comments: CommentRecord[]) {
  return [...comments].sort((a, b) => {
    if (b.upvoteCount !== a.upvoteCount) {
      return b.upvoteCount - a.upvoteCount;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function sortCommentsByRecency(comments: CommentRecord[]) {
  return [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function computeVoteTotals(
  current: Pick<DebateAggregate, "yesVotes" | "noVotes" | "voterCount">,
  previousSide: VoteSide | null,
  nextSide: VoteSide,
) {
  let yesVotes = current.yesVotes;
  let noVotes = current.noVotes;
  let voterCount = current.voterCount;

  if (!previousSide) {
    voterCount += 1;
  }

  if (previousSide === "yes") {
    yesVotes = Math.max(0, yesVotes - 1);
  }

  if (previousSide === "no") {
    noVotes = Math.max(0, noVotes - 1);
  }

  if (nextSide === "yes") {
    yesVotes += 1;
  } else {
    noVotes += 1;
  }

  return { yesVotes, noVotes, voterCount };
}

export function computeSocietalPulse(
  aggregate: DebateAggregate,
): SocietalPulse {
  const totalVotes = aggregate.yesVotes + aggregate.noVotes;
  const yesPercent =
    totalVotes === 0 ? 50 : Math.round((aggregate.yesVotes / totalVotes) * 100);
  const noPercent =
    totalVotes === 0 ? 50 : Math.round((aggregate.noVotes / totalVotes) * 100);

  let leadingSide: SocietalPulse["leadingSide"] = "tie";
  if (aggregate.yesVotes > aggregate.noVotes) {
    leadingSide = "yes";
  } else if (aggregate.noVotes > aggregate.yesVotes) {
    leadingSide = "no";
  }

  return {
    ...aggregate,
    totalVotes,
    yesPercent,
    noPercent,
    leadingSide,
    leadMargin: Math.abs(aggregate.yesVotes - aggregate.noVotes),
  };
}
