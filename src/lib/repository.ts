import { randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import fallbackDebate from "@/data/quebec-debate-fallback.json";
import {
  clampCommentBody,
  computeSocietalPulse,
  computeVoteTotals,
  isCommunityMember,
  isAliasValid,
  isEmailValid,
  isPasswordValid,
  isValidSourceUrl,
  normalizeAlias,
  normalizeCommunityCategory,
  normalizeCommunityQuestion,
  normalizeCommunityText,
  normalizeEmail,
  sortCommentsByRecency,
  sortCommentsBySupport,
} from "@/lib/domain";
import { isFirestoreConfigured } from "@/lib/env";
import { getFirestore } from "@/lib/firestore";
import { generateDebateSeed } from "@/lib/seed";
import {
  computeArgumentFingerprint,
  type GeneratedCommunityConclusion,
} from "@/lib/community-conclusion";
import {
  computeCommunityPositionSummary,
  isCommunityPositionChoice,
} from "@/lib/community-position";
import {
  DEBATE_SLUG,
  type ArgumentComment,
  type ArgumentSource,
  type AuthProvider,
  type CommentRecord,
  type CommunityArgument,
  type CommunityDebate,
  type CommunityDebateAccess,
  type CommunityDebateConclusion,
  type CommunityDebateImage,
  type CommunityDebateListItem,
  type CommunityDebatePosition,
  type CommunityInvitePreview,
  type CommunityMember,
  type CommunityMembership,
  type CommunityPositionChange,
  type CommunityPositionChoice,
  type CommunityDebateTitleChange,
  type Debate,
  type DebateAggregate,
  type DebatePageData,
  type ImportedArgumentDraft,
  type Locale,
  type PasswordAccountRecord,
  type PasswordResetRecord,
  type UserProfile,
  type ViewerState,
  type VoteRecord,
  type VoteSide,
} from "@/lib/types";

const FALLBACK_DEBATE = structuredClone(fallbackDebate) as Debate;
const PASSWORD_HASH_ROUNDS = 10;

function debatesCollection() {
  return getFirestore().collection("debates");
}

function aggregatesCollection() {
  return getFirestore().collection("debateAggregates");
}

function profilesCollection() {
  return getFirestore().collection("userProfiles");
}

function aliasesCollection() {
  return getFirestore().collection("aliases");
}

function passwordAccountsCollection() {
  return getFirestore().collection("authAccounts");
}

function passwordResetsCollection() {
  return getFirestore().collection("passwordResetTokens");
}

function votesCollection() {
  return getFirestore().collection("votes");
}

function commentsCollection() {
  return getFirestore().collection("comments");
}

function commentUpvotesCollection() {
  return getFirestore().collection("commentUpvotes");
}

function communityDebatesCollection() {
  return getFirestore().collection("communityDebates");
}

function communityArgumentsCollection() {
  return getFirestore().collection("communityArguments");
}

function communityMembershipsCollection() {
  return getFirestore().collection("communityMemberships");
}

function communityConclusionsCollection() {
  return getFirestore().collection("communityDebateConclusions");
}

function communityImagesCollection() {
  return getFirestore().collection("communityDebateImages");
}

function communityTitleChangesCollection() {
  return getFirestore().collection("communityDebateTitleChanges");
}

function communityPositionsCollection() {
  return getFirestore().collection("communityDebatePositions");
}

function communityPositionChangesCollection() {
  return getFirestore().collection("communityDebatePositionChanges");
}

function argumentCommentsCollection() {
  return getFirestore().collection("argumentComments");
}

function communityMembershipId(debateId: string, userId: string) {
  return `${debateId}__${userId}`;
}

function communityPositionId(debateId: string, userId: string) {
  return `${debateId}__${userId}`;
}

function hasCommunityAccess(
  debate: CommunityDebate,
  userId: string | null | undefined,
  membershipExists = false,
) {
  return Boolean(
    userId &&
      (debate.ownerId === userId ||
        isCommunityMember(debate.memberIds ?? [], userId) ||
        membershipExists),
  );
}

function createDefaultAggregate(debateId: string): DebateAggregate {
  return {
    debateId,
    yesVotes: 0,
    noVotes: 0,
    voterCount: 0,
    commentCount: 0,
    upvoteCount: 0,
    topCommentIds: [],
    isSimulated: false,
    simulatedVoterCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

function hydrateDebate(input?: Partial<Debate> | null): Debate {
  return {
    ...FALLBACK_DEBATE,
    ...input,
    id: DEBATE_SLUG,
    slug: DEBATE_SLUG,
    status: "live",
    yesArguments: input?.yesArguments ?? FALLBACK_DEBATE.yesArguments,
    noArguments: input?.noArguments ?? FALLBACK_DEBATE.noArguments,
    title: input?.title ?? FALLBACK_DEBATE.title,
    question: input?.question ?? FALLBACK_DEBATE.question,
    intro: input?.intro ?? FALLBACK_DEBATE.intro,
    yesLabel: input?.yesLabel ?? FALLBACK_DEBATE.yesLabel,
    noLabel: input?.noLabel ?? FALLBACK_DEBATE.noLabel,
    seedSource: input?.seedSource ?? FALLBACK_DEBATE.seedSource,
    yesCount: input?.yesCount ?? 0,
    noCount: input?.noCount ?? 0,
    createdAt: input?.createdAt ?? FALLBACK_DEBATE.createdAt,
    updatedAt: input?.updatedAt ?? FALLBACK_DEBATE.updatedAt,
  };
}

function hydrateAggregate(
  debateId: string,
  input?: Partial<DebateAggregate> | null,
): DebateAggregate {
  return {
    ...createDefaultAggregate(debateId),
    ...input,
    debateId,
    topCommentIds: input?.topCommentIds ?? [],
    updatedAt: input?.updatedAt ?? new Date().toISOString(),
  };
}

function mapComment(value: Partial<CommentRecord>): CommentRecord {
  return {
    id: value.id ?? randomUUID(),
    debateId: value.debateId ?? DEBATE_SLUG,
    authorId: value.authorId ?? "",
    alias: value.alias ?? "citizen",
    body: value.body ?? "",
    upvoteCount: value.upvoteCount ?? 0,
    isSimulated: value.isSimulated ?? false,
    createdAt: value.createdAt ?? new Date().toISOString(),
    updatedAt: value.updatedAt ?? new Date().toISOString(),
  };
}

function mapCommunityArgument(
  value: Partial<CommunityArgument>,
): CommunityArgument {
  const now = new Date().toISOString();
  return {
    id: value.id ?? randomUUID(),
    debateId: value.debateId ?? "",
    side: value.side === "no" ? "no" : "yes",
    authorId: value.authorId ?? "",
    authorAlias: value.authorAlias ?? "citizen",
    title: value.title ?? "",
    body: value.body ?? "",
    sources: value.sources ?? [],
    createdAt: value.createdAt ?? now,
    updatedAt: value.updatedAt ?? now,
  };
}

function mapArgumentComment(
  value: Partial<ArgumentComment>,
): ArgumentComment {
  const now = new Date().toISOString();
  return {
    id: value.id ?? randomUUID(),
    debateId: value.debateId ?? "",
    argumentId: value.argumentId ?? "",
    authorId: value.authorId ?? "",
    authorAlias: value.authorAlias ?? "citizen",
    body: value.body ?? "",
    createdAt: value.createdAt ?? now,
    updatedAt: value.updatedAt ?? now,
  };
}

function communityInvitePreview(
  debate: CommunityDebate,
): CommunityInvitePreview {
  return {
    id: debate.id,
    question: debate.question,
    context: debate.context,
    category: debate.category,
    locale: debate.locale,
    ownerAlias: debate.ownerAlias,
    memberCount: debate.memberCount ?? debate.memberIds?.length ?? 1,
  };
}

function mergeCommunityMembers(
  debate: CommunityDebate,
  memberships: CommunityMembership[],
) {
  const members = new Map<string, CommunityMember>();
  for (const member of debate.members ?? []) {
    members.set(member.userId, member);
  }
  for (const membership of memberships) {
    members.set(membership.userId, {
      userId: membership.userId,
      alias: membership.alias,
      role: membership.role,
      joinedAt: membership.joinedAt,
    });
  }
  return [...members.values()].sort(
    (a, b) =>
      new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
  );
}

function buildFallbackViewer(): ViewerState {
  return {
    isAuthenticated: false,
    hasAlias: false,
    alias: null,
    voteSide: null,
  };
}

async function readCommentsFromFirestore(debateId: string) {
  const snapshot = await commentsCollection().where("debateId", "==", debateId).get();
  return sortCommentsByRecency(
    snapshot.docs.map((doc) => mapComment(doc.data() as Partial<CommentRecord>)),
  );
}

export async function getDebatePageData(
  debateId: string,
  userId?: string | null,
): Promise<DebatePageData> {
  if (debateId !== DEBATE_SLUG || !isFirestoreConfigured()) {
    const aggregate = createDefaultAggregate(DEBATE_SLUG);
    return {
      debate: hydrateDebate(FALLBACK_DEBATE),
      pulse: computeSocietalPulse(aggregate),
      comments: [],
      topComments: [],
      viewer: buildFallbackViewer(),
      source: "fallback",
    };
  }

  try {
    const [debateSnap, aggregateSnap, comments, profileSnap, voteSnap] =
      await Promise.all([
        debatesCollection().doc(debateId).get(),
        aggregatesCollection().doc(debateId).get(),
        readCommentsFromFirestore(debateId),
        userId ? profilesCollection().doc(userId).get() : null,
        userId ? votesCollection().doc(`${debateId}__${userId}`).get() : null,
      ]);

    const debate = hydrateDebate(
      debateSnap.exists ? (debateSnap.data() as Partial<Debate>) : FALLBACK_DEBATE,
    );
    const aggregate = hydrateAggregate(
      debateId,
      aggregateSnap.exists
        ? (aggregateSnap.data() as Partial<DebateAggregate>)
        : {
            yesVotes: debate.yesCount,
            noVotes: debate.noCount,
          },
    );

    const topCommentLookup = new Map(comments.map((comment) => [comment.id, comment]));
    const topComments = aggregate.topCommentIds
      .map((id) => topCommentLookup.get(id))
      .filter((comment): comment is CommentRecord => Boolean(comment));

    return {
      debate,
      pulse: computeSocietalPulse(aggregate),
      comments,
      topComments,
      viewer: {
        isAuthenticated: Boolean(userId),
        hasAlias: Boolean(profileSnap?.exists),
        alias: profileSnap?.exists
          ? ((profileSnap.data() as UserProfile).alias ?? null)
          : null,
        voteSide: voteSnap?.exists
          ? (((voteSnap.data() as VoteRecord).side as VoteSide) ?? null)
          : null,
      },
      source: "firestore",
    };
  } catch (error) {
    console.error("Failed to read Firestore, using fallback mode.", error);
    const aggregate = createDefaultAggregate(DEBATE_SLUG);
    return {
      debate: hydrateDebate(FALLBACK_DEBATE),
      pulse: computeSocietalPulse(aggregate),
      comments: [],
      topComments: [],
      viewer: buildFallbackViewer(),
      source: "fallback",
    };
  }
}

export async function getUserProfile(userId: string) {
  if (!isFirestoreConfigured()) {
    return null;
  }

  const snapshot = await profilesCollection().doc(userId).get();
  return snapshot.exists ? (snapshot.data() as UserProfile) : null;
}

export async function setUserAlias(
  userId: string,
  email: string,
  rawAlias: string,
  authProvider: AuthProvider = "google",
) {
  const aliasNormalized = normalizeAlias(rawAlias);
  if (!isAliasValid(aliasNormalized)) {
    throw new Error("INVALID_ALIAS");
  }

  const db = getFirestore();
  const now = new Date().toISOString();

  return db.runTransaction(async (transaction) => {
    const profileRef = profilesCollection().doc(userId);
    const aliasRef = aliasesCollection().doc(aliasNormalized);
    const profileSnap = await transaction.get(profileRef);
    const aliasSnap = await transaction.get(aliasRef);

    const existingProfile = profileSnap.exists
      ? (profileSnap.data() as UserProfile)
      : null;

    if (aliasSnap.exists && (aliasSnap.data() as { userId: string }).userId !== userId) {
      throw new Error("ALIAS_TAKEN");
    }

    if (
      existingProfile?.aliasNormalized &&
      existingProfile.aliasNormalized !== aliasNormalized
    ) {
      transaction.delete(aliasesCollection().doc(existingProfile.aliasNormalized));
    }

    const profile: UserProfile = {
      userId,
      email,
      alias: aliasNormalized,
      aliasNormalized,
      authProvider,
      createdAt: existingProfile?.createdAt ?? now,
      updatedAt: now,
    };

    transaction.set(
      aliasRef,
      {
        alias: aliasNormalized,
        aliasNormalized,
        userId,
        updatedAt: now,
      },
      { merge: true },
    );
    transaction.set(profileRef, profile, { merge: true });

    return profile;
  });
}

export async function createPasswordAccount(
  rawEmail: string,
  rawPassword: string,
  rawAlias: string,
) {
  const emailNormalized = normalizeEmail(rawEmail);
  const aliasNormalized = normalizeAlias(rawAlias);

  if (!isEmailValid(emailNormalized)) {
    throw new Error("INVALID_EMAIL");
  }

  if (!isPasswordValid(rawPassword)) {
    throw new Error("INVALID_PASSWORD");
  }

  if (!isAliasValid(aliasNormalized)) {
    throw new Error("INVALID_ALIAS");
  }

  if (!isFirestoreConfigured()) {
    throw new Error("AUTH_UNAVAILABLE");
  }

  const db = getFirestore();
  const now = new Date().toISOString();
  const userId = `user_${randomUUID()}`;
  const passwordHash = await hash(rawPassword, PASSWORD_HASH_ROUNDS);

  return db.runTransaction(async (transaction) => {
    const profileRef = profilesCollection().doc(userId);
    const aliasRef = aliasesCollection().doc(aliasNormalized);
    const accountRef = passwordAccountsCollection().doc(emailNormalized);

    const [aliasSnap, accountSnap] = await Promise.all([
      transaction.get(aliasRef),
      transaction.get(accountRef),
    ]);

    if (accountSnap.exists) {
      throw new Error("EMAIL_TAKEN");
    }

    if (aliasSnap.exists) {
      throw new Error("ALIAS_TAKEN");
    }

    const profile: UserProfile = {
      userId,
      email: emailNormalized,
      alias: aliasNormalized,
      aliasNormalized,
      authProvider: "password",
      createdAt: now,
      updatedAt: now,
    };

    const passwordAccount: PasswordAccountRecord = {
      userId,
      email: emailNormalized,
      emailNormalized,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(
      aliasRef,
      {
        alias: aliasNormalized,
        aliasNormalized,
        userId,
        updatedAt: now,
      },
      { merge: true },
    );
    transaction.set(profileRef, profile, { merge: true });
    transaction.set(accountRef, passwordAccount, { merge: true });

    return profile;
  });
}

export async function authenticatePasswordAccount(
  rawEmail: string,
  rawPassword: string,
) {
  if (!isFirestoreConfigured()) {
    return null;
  }

  const emailNormalized = normalizeEmail(rawEmail);
  if (!isEmailValid(emailNormalized) || rawPassword.length === 0) {
    return null;
  }

  const accountSnap = await passwordAccountsCollection().doc(emailNormalized).get();
  if (!accountSnap.exists) {
    return null;
  }

  const account = accountSnap.data() as PasswordAccountRecord;
  const passwordMatches = await compare(rawPassword, account.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  const profile = await getUserProfile(account.userId);
  return profile;
}

export async function createPasswordResetRecord(
  emailNormalized: string,
  requestId: string,
  tokenHash: string,
  expiresAt: string,
): Promise<
  | { status: "created"; record: PasswordResetRecord }
  | { status: "unknown" | "rate_limited" }
> {
  if (!isFirestoreConfigured()) {
    throw new Error("AUTH_UNAVAILABLE");
  }

  const db = getFirestore();
  const now = new Date();
  const nowIso = now.toISOString();

  return db.runTransaction(async (transaction) => {
    const accountRef = passwordAccountsCollection().doc(emailNormalized);
    const resetRef = passwordResetsCollection().doc(requestId);
    const [accountSnap, resetSnap] = await Promise.all([
      transaction.get(accountRef),
      transaction.get(resetRef),
    ]);

    if (!accountSnap.exists) {
      return { status: "unknown" as const };
    }

    if (resetSnap.exists) {
      const previous = resetSnap.data() as PasswordResetRecord;
      const previousCreatedAt = new Date(previous.createdAt).getTime();
      if (
        Number.isFinite(previousCreatedAt) &&
        now.getTime() - previousCreatedAt < 60_000
      ) {
        return { status: "rate_limited" as const };
      }
    }

    const account = accountSnap.data() as PasswordAccountRecord;
    const record: PasswordResetRecord = {
      id: requestId,
      userId: account.userId,
      emailNormalized,
      tokenHash,
      expiresAt,
      createdAt: nowIso,
    };
    transaction.set(resetRef, record);
    return { status: "created" as const, record };
  });
}

export async function discardPasswordResetRecord(
  requestId: string,
  tokenHash: string,
) {
  if (!isFirestoreConfigured()) {
    return;
  }

  const resetRef = passwordResetsCollection().doc(requestId);
  await getFirestore().runTransaction(async (transaction) => {
    const resetSnap = await transaction.get(resetRef);
    if (
      resetSnap.exists &&
      (resetSnap.data() as PasswordResetRecord).tokenHash === tokenHash
    ) {
      transaction.delete(resetRef);
    }
  });
}

export async function resetPasswordWithToken(
  requestId: string,
  tokenHash: string,
  newPassword: string,
): Promise<"reset" | "invalid" | "expired"> {
  if (!isPasswordValid(newPassword)) {
    throw new Error("INVALID_PASSWORD");
  }
  if (!isFirestoreConfigured()) {
    throw new Error("AUTH_UNAVAILABLE");
  }

  const resetRef = passwordResetsCollection().doc(requestId);
  const initialSnap = await resetRef.get();
  if (!initialSnap.exists) {
    return "invalid";
  }

  const initialRecord = initialSnap.data() as PasswordResetRecord;
  if (initialRecord.tokenHash !== tokenHash) {
    return "invalid";
  }
  if (new Date(initialRecord.expiresAt).getTime() <= Date.now()) {
    await discardPasswordResetRecord(requestId, tokenHash);
    return "expired";
  }

  const passwordHash = await hash(newPassword, PASSWORD_HASH_ROUNDS);
  const now = new Date().toISOString();

  return getFirestore().runTransaction(async (transaction) => {
    const resetSnap = await transaction.get(resetRef);
    if (!resetSnap.exists) {
      return "invalid" as const;
    }

    const record = resetSnap.data() as PasswordResetRecord;
    if (record.tokenHash !== tokenHash) {
      return "invalid" as const;
    }
    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      transaction.delete(resetRef);
      return "expired" as const;
    }

    const accountRef = passwordAccountsCollection().doc(record.emailNormalized);
    const accountSnap = await transaction.get(accountRef);
    if (!accountSnap.exists) {
      transaction.delete(resetRef);
      return "invalid" as const;
    }

    transaction.update(accountRef, {
      passwordHash,
      updatedAt: now,
    });
    transaction.delete(resetRef);
    return "reset" as const;
  });
}

export async function submitVote(userId: string, debateId: string, side: VoteSide) {
  const db = getFirestore();
  const now = new Date().toISOString();

  await db.runTransaction(async (transaction) => {
    const debateRef = debatesCollection().doc(debateId);
    const aggregateRef = aggregatesCollection().doc(debateId);
    const voteRef = votesCollection().doc(`${debateId}__${userId}`);

    const [debateSnap, aggregateSnap, voteSnap] = await Promise.all([
      transaction.get(debateRef),
      transaction.get(aggregateRef),
      transaction.get(voteRef),
    ]);

    const debate = hydrateDebate(
      debateSnap.exists ? (debateSnap.data() as Partial<Debate>) : FALLBACK_DEBATE,
    );
    const aggregate = hydrateAggregate(
      debateId,
      aggregateSnap.exists
        ? (aggregateSnap.data() as Partial<DebateAggregate>)
        : {
            yesVotes: debate.yesCount,
            noVotes: debate.noCount,
          },
    );
    const previousVote = voteSnap.exists
      ? ((voteSnap.data() as VoteRecord).side as VoteSide)
      : null;

    const nextTotals = computeVoteTotals(aggregate, previousVote, side);

    transaction.set(
      debateRef,
      {
        ...debate,
        yesCount: nextTotals.yesVotes,
        noCount: nextTotals.noVotes,
        updatedAt: now,
      },
      { merge: true },
    );
    transaction.set(
      aggregateRef,
      {
        ...aggregate,
        yesVotes: nextTotals.yesVotes,
        noVotes: nextTotals.noVotes,
        voterCount: nextTotals.voterCount,
        updatedAt: now,
      },
      { merge: true },
    );
    transaction.set(
      voteRef,
      {
        id: `${debateId}__${userId}`,
        debateId,
        userId,
        side,
        createdAt: voteSnap.exists
          ? ((voteSnap.data() as VoteRecord).createdAt ?? now)
          : now,
        updatedAt: now,
      } satisfies VoteRecord,
      { merge: true },
    );
  });
}

export async function createComment(userId: string, debateId: string, rawBody: string) {
  const body = clampCommentBody(rawBody);

  if (body.length < 8) {
    throw new Error("COMMENT_TOO_SHORT");
  }

  const db = getFirestore();
  const now = new Date().toISOString();
  const commentId = randomUUID();

  await db.runTransaction(async (transaction) => {
    const profileRef = profilesCollection().doc(userId);
    const aggregateRef = aggregatesCollection().doc(debateId);
    const debateRef = debatesCollection().doc(debateId);
    const commentsQuery = commentsCollection().where("debateId", "==", debateId);

    const [profileSnap, aggregateSnap, debateSnap, commentsSnap] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(aggregateRef),
      transaction.get(debateRef),
      transaction.get(commentsQuery),
    ]);

    if (!profileSnap.exists) {
      throw new Error("ALIAS_REQUIRED");
    }

    const profile = profileSnap.data() as UserProfile;
    const debate = hydrateDebate(
      debateSnap.exists ? (debateSnap.data() as Partial<Debate>) : FALLBACK_DEBATE,
    );
    const aggregate = hydrateAggregate(
      debateId,
      aggregateSnap.exists
        ? (aggregateSnap.data() as Partial<DebateAggregate>)
        : {
            yesVotes: debate.yesCount,
            noVotes: debate.noCount,
          },
    );

    const existingComments = commentsSnap.docs.map((doc) =>
      mapComment(doc.data() as Partial<CommentRecord>),
    );
    const newComment: CommentRecord = {
      id: commentId,
      debateId,
      authorId: userId,
      alias: profile.alias,
      body,
      upvoteCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const topCommentIds = sortCommentsBySupport([...existingComments, newComment])
      .slice(0, 3)
      .map((comment) => comment.id);

    transaction.set(commentsCollection().doc(commentId), newComment);
    transaction.set(
      aggregateRef,
      {
        ...aggregate,
        commentCount: aggregate.commentCount + 1,
        topCommentIds,
        updatedAt: now,
      },
      { merge: true },
    );
    transaction.set(
      debateRef,
      {
        ...debate,
        updatedAt: now,
      },
      { merge: true },
    );
  });
}

export async function toggleCommentUpvote(userId: string, commentId: string) {
  const db = getFirestore();
  const now = new Date().toISOString();

  await db.runTransaction(async (transaction) => {
    const commentRef = commentsCollection().doc(commentId);
    const commentSnap = await transaction.get(commentRef);

    if (!commentSnap.exists) {
      throw new Error("COMMENT_NOT_FOUND");
    }

    const comment = mapComment(commentSnap.data() as Partial<CommentRecord>);
    const upvoteRef = commentUpvotesCollection().doc(`${commentId}__${userId}`);
    const aggregateRef = aggregatesCollection().doc(comment.debateId);
    const commentsQuery = commentsCollection().where("debateId", "==", comment.debateId);

    const [upvoteSnap, aggregateSnap, commentsSnap] = await Promise.all([
      transaction.get(upvoteRef),
      transaction.get(aggregateRef),
      transaction.get(commentsQuery),
    ]);

    const aggregate = hydrateAggregate(
      comment.debateId,
      aggregateSnap.exists
        ? (aggregateSnap.data() as Partial<DebateAggregate>)
        : undefined,
    );
    const existingComments = commentsSnap.docs.map((doc) =>
      mapComment(doc.data() as Partial<CommentRecord>),
    );

    const delta = upvoteSnap.exists ? -1 : 1;
    const nextUpvoteCount = Math.max(0, comment.upvoteCount + delta);
    const updatedComments = existingComments.map((item) =>
      item.id === comment.id
        ? { ...item, upvoteCount: nextUpvoteCount, updatedAt: now }
        : item,
    );
    const topCommentIds = sortCommentsBySupport(updatedComments)
      .slice(0, 3)
      .map((item) => item.id);

    if (upvoteSnap.exists) {
      transaction.delete(upvoteRef);
    } else {
      transaction.set(upvoteRef, {
        id: `${commentId}__${userId}`,
        commentId,
        debateId: comment.debateId,
        userId,
        createdAt: now,
      });
    }

    transaction.set(
      commentRef,
      {
        ...comment,
        upvoteCount: nextUpvoteCount,
        updatedAt: now,
      },
      { merge: true },
    );
    transaction.set(
      aggregateRef,
      {
        ...aggregate,
        upvoteCount: Math.max(0, aggregate.upvoteCount + delta),
        topCommentIds,
        updatedAt: now,
      },
      { merge: true },
    );
  });
}

export async function createCommunityDebate(
  userId: string,
  input: {
    question: string;
    context: string;
    category: string;
    locale: Locale;
  },
) {
  if (!isFirestoreConfigured()) {
    throw new Error("COMMUNITY_DEBATES_UNAVAILABLE");
  }

  const question = normalizeCommunityQuestion(input.question);
  const context = normalizeCommunityText(input.context, 1200);
  const category = normalizeCommunityCategory(input.category);

  if (question.length < 12) {
    throw new Error("QUESTION_TOO_SHORT");
  }

  if (category.length < 2 || !["fr", "en"].includes(input.locale)) {
    throw new Error("INVALID_DEBATE");
  }

  const db = getFirestore();
  const now = new Date().toISOString();
  const debateId = randomUUID();
  const inviteCode = randomUUID().replaceAll("-", "");
  const debateRef = communityDebatesCollection().doc(debateId);
  const profileRef = profilesCollection().doc(userId);
  const membershipRef = communityMembershipsCollection().doc(
    communityMembershipId(debateId, userId),
  );

  return db.runTransaction(async (transaction) => {
    const profileSnap = await transaction.get(profileRef);
    if (!profileSnap.exists) {
      throw new Error("ALIAS_REQUIRED");
    }

    const profile = profileSnap.data() as UserProfile;
    const debate: CommunityDebate = {
      id: debateId,
      question,
      context,
      category,
      locale: input.locale,
      visibility: "private",
      status: "active",
      ownerId: userId,
      ownerAlias: profile.alias,
      memberCount: 1,
      memberIds: [userId],
      members: [
        {
          userId,
          alias: profile.alias,
          role: "host",
          joinedAt: now,
        },
      ],
      inviteCode,
      createdAt: now,
      updatedAt: now,
    };

    transaction.create(debateRef, debate);
    transaction.create(membershipRef, {
      id: membershipRef.id,
      debateId,
      userId,
      alias: profile.alias,
      role: "host",
      joinedAt: now,
    } satisfies CommunityMembership);
    return debate;
  });
}

export async function saveCommunityDebateImage(image: CommunityDebateImage) {
  if (!isFirestoreConfigured()) {
    throw new Error("COMMUNITY_DEBATES_UNAVAILABLE");
  }
  await communityImagesCollection().doc(image.debateId).set(image);
  return image;
}

export async function getCommunityDebateImage(debateId: string) {
  if (!isFirestoreConfigured()) return null;
  const snapshot = await communityImagesCollection().doc(debateId).get();
  return snapshot.exists ? (snapshot.data() as CommunityDebateImage) : null;
}

export async function getCommunityDebateAccess(
  debateId: string,
  userId?: string | null,
  inviteCode?: string | null,
): Promise<CommunityDebateAccess> {
  if (!isFirestoreConfigured()) {
    return { status: "not-found" };
  }

  const debateSnap = await communityDebatesCollection().doc(debateId).get();
  if (!debateSnap.exists) {
    return { status: "not-found" };
  }

  const debate = debateSnap.data() as CommunityDebate;
  const membershipSnap = userId
    ? await communityMembershipsCollection()
        .doc(communityMembershipId(debateId, userId))
        .get()
    : null;
  if (hasCommunityAccess(debate, userId, Boolean(membershipSnap?.exists))) {
    const [
      argumentsSnap,
      commentsSnap,
      membershipsSnap,
      conclusionSnap,
      titleChangesSnap,
      positionsSnap,
    ] =
      await Promise.all([
      communityArgumentsCollection().where("debateId", "==", debateId).get(),
      argumentCommentsCollection().where("debateId", "==", debateId).get(),
      communityMembershipsCollection().where("debateId", "==", debateId).get(),
      communityConclusionsCollection().doc(debateId).get(),
      communityTitleChangesCollection().where("debateId", "==", debateId).get(),
      communityPositionsCollection().where("debateId", "==", debateId).get(),
    ]);

    const debateArguments = argumentsSnap.docs
      .map((doc) =>
        mapCommunityArgument(doc.data() as Partial<CommunityArgument>),
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    const comments = commentsSnap.docs
      .map((doc) => mapArgumentComment(doc.data() as Partial<ArgumentComment>))
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    const memberships = membershipsSnap.docs.map(
      (doc) => doc.data() as CommunityMembership,
    );
    const conclusion = conclusionSnap.exists
      ? (conclusionSnap.data() as CommunityDebateConclusion)
      : null;
    const titleHistory = titleChangesSnap.docs
      .map((doc) => doc.data() as CommunityDebateTitleChange)
      .sort(
        (a, b) =>
          new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
      );
    const argumentFingerprint = computeArgumentFingerprint(debateArguments);
    const positions = positionsSnap.docs.map(
      (doc) => doc.data() as CommunityDebatePosition,
    );
    const viewerPosition =
      positions.find((position) => position.userId === userId) ?? null;

    return {
      status: "member",
      data: {
        debate,
        members: mergeCommunityMembers(debate, memberships),
        arguments: debateArguments,
        comments,
        titleHistory,
        conclusion,
        conclusionIsStale: Boolean(
          conclusion && conclusion.argumentFingerprint !== argumentFingerprint,
        ),
        viewerCurrentPosition: viewerPosition?.currentChoice ?? null,
        positionSummary: computeCommunityPositionSummary(positions),
        viewerId: userId as string,
      },
    };
  }

  if (inviteCode && inviteCode === debate.inviteCode) {
    return {
      status: "invite",
      debate: communityInvitePreview(debate),
    };
  }

  return { status: "forbidden" };
}

export async function updateCommunityDebateQuestion(
  userId: string,
  debateId: string,
  input: { question: string },
) {
  if (!isFirestoreConfigured()) {
    throw new Error("COMMUNITY_DEBATES_UNAVAILABLE");
  }

  const question = normalizeCommunityQuestion(input.question);
  if (question.length < 12) {
    throw new Error("QUESTION_TOO_SHORT");
  }

  const db = getFirestore();
  const debateRef = communityDebatesCollection().doc(debateId);
  const changeRef = communityTitleChangesCollection().doc(randomUUID());

  return db.runTransaction(async (transaction) => {
    const debateSnap = await transaction.get(debateRef);
    if (!debateSnap.exists) {
      throw new Error("DEBATE_NOT_FOUND");
    }

    const debate = debateSnap.data() as CommunityDebate;
    if (debate.ownerId !== userId) {
      throw new Error("FORBIDDEN");
    }

    if (debate.question === question) {
      return { debate, change: null };
    }

    const changedAt = new Date().toISOString();
    const change: CommunityDebateTitleChange = {
      id: changeRef.id,
      debateId,
      actorId: userId,
      actorAlias: debate.ownerAlias,
      previousQuestion: debate.question,
      nextQuestion: question,
      changedAt,
    };
    const updatedDebate: CommunityDebate = {
      ...debate,
      question,
      updatedAt: changedAt,
    };

    transaction.update(debateRef, {
      question,
      updatedAt: changedAt,
    });
    transaction.create(changeRef, change);

    return { debate: updatedDebate, change };
  });
}

export async function getCommunityDebatesForUser(
  userId: string,
): Promise<CommunityDebateListItem[]> {
  if (!isFirestoreConfigured()) {
    return [];
  }

  const [membershipsSnap, ownedDebatesSnap, legacyDebatesSnap] =
    await Promise.all([
      communityMembershipsCollection().where("userId", "==", userId).get(),
      communityDebatesCollection().where("ownerId", "==", userId).get(),
      communityDebatesCollection()
        .where("memberIds", "array-contains", userId)
        .get(),
    ]);
  const membershipRoles = new Map<string, CommunityMembership["role"]>();
  for (const doc of membershipsSnap.docs) {
    const membership = doc.data() as CommunityMembership;
    membershipRoles.set(membership.debateId, membership.role);
  }

  const debates = new Map(
    [...ownedDebatesSnap.docs, ...legacyDebatesSnap.docs].map((doc) => [
      doc.id,
      doc.data() as CommunityDebate,
    ]),
  );
  const missingDebateIds = [...membershipRoles.keys()].filter(
    (debateId) => !debates.has(debateId),
  );
  const missingDebateSnaps = await Promise.all(
    missingDebateIds.map((debateId) =>
      communityDebatesCollection().doc(debateId).get(),
    ),
  );
  for (const doc of missingDebateSnaps) {
    if (doc.exists) {
      debates.set(doc.id, doc.data() as CommunityDebate);
    }
  }

  return [...debates.values()]
    .map((debate) => {
      return {
        id: debate.id,
        question: debate.question,
        context: debate.context,
        category: debate.category,
        locale: debate.locale,
        role:
          debate.ownerId === userId
            ? "host"
            : (membershipRoles.get(debate.id) ?? "friend"),
        memberCount:
          debate.memberCount ?? debate.memberIds?.length ?? 1,
        updatedAt: debate.updatedAt,
      } satisfies CommunityDebateListItem;
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export async function acceptCommunityInvite(
  userId: string,
  debateId: string,
  inviteCode: string,
  initialPosition: CommunityPositionChoice,
) {
  if (!isCommunityPositionChoice(initialPosition)) {
    throw new Error("INVALID_POSITION");
  }
  const db = getFirestore();
  const now = new Date().toISOString();

  return db.runTransaction(async (transaction) => {
    const debateRef = communityDebatesCollection().doc(debateId);
    const profileRef = profilesCollection().doc(userId);
    const membershipRef = communityMembershipsCollection().doc(
      communityMembershipId(debateId, userId),
    );
    const positionRef = communityPositionsCollection().doc(
      communityPositionId(debateId, userId),
    );
    const [debateSnap, profileSnap, membershipSnap, positionSnap] = await Promise.all([
      transaction.get(debateRef),
      transaction.get(profileRef),
      transaction.get(membershipRef),
      transaction.get(positionRef),
    ]);

    if (!debateSnap.exists) {
      throw new Error("DEBATE_NOT_FOUND");
    }
    if (!profileSnap.exists) {
      throw new Error("ALIAS_REQUIRED");
    }

    const debate = debateSnap.data() as CommunityDebate;
    if (hasCommunityAccess(debate, userId, membershipSnap.exists)) {
      return debate;
    }
    if (!inviteCode || inviteCode !== debate.inviteCode) {
      throw new Error("INVALID_INVITE");
    }
    const profile = profileSnap.data() as UserProfile;
    const membership: CommunityMembership = {
      id: membershipRef.id,
      debateId,
      userId,
      alias: profile.alias,
      role: "friend",
      joinedAt: now,
    };
    const position: CommunityDebatePosition = {
      id: positionRef.id,
      debateId,
      userId,
      alias: profile.alias,
      baselineChoice: initialPosition,
      currentChoice: initialPosition,
      baselineAt: now,
      currentAt: now,
      updatedAt: now,
    };
    const positionChangeRef = communityPositionChangesCollection().doc(randomUUID());
    const positionChange: CommunityPositionChange = {
      id: positionChangeRef.id,
      positionId: positionRef.id,
      debateId,
      userId,
      alias: profile.alias,
      previousChoice: null,
      nextChoice: initialPosition,
      stage: "baseline",
      changedAt: now,
    };
    const nextMemberCount =
      (debate.memberCount ?? debate.memberIds?.length ?? 1) + 1;

    transaction.create(membershipRef, membership);
    if (!positionSnap.exists) {
      transaction.create(positionRef, position);
      transaction.create(positionChangeRef, positionChange);
    }
    transaction.update(debateRef, {
      memberCount: nextMemberCount,
      updatedAt: now,
    });
    return {
      ...debate,
      memberCount: nextMemberCount,
      updatedAt: now,
    };
  });
}

export async function updateCommunityDebatePosition(
  userId: string,
  debateId: string,
  nextChoice: CommunityPositionChoice,
) {
  if (!isCommunityPositionChoice(nextChoice)) {
    throw new Error("INVALID_POSITION");
  }

  const db = getFirestore();
  const now = new Date().toISOString();
  const debateRef = communityDebatesCollection().doc(debateId);
  const profileRef = profilesCollection().doc(userId);
  const membershipRef = communityMembershipsCollection().doc(
    communityMembershipId(debateId, userId),
  );
  const positionRef = communityPositionsCollection().doc(
    communityPositionId(debateId, userId),
  );

  return db.runTransaction(async (transaction) => {
    const [debateSnap, profileSnap, membershipSnap, positionSnap] =
      await Promise.all([
        transaction.get(debateRef),
        transaction.get(profileRef),
        transaction.get(membershipRef),
        transaction.get(positionRef),
      ]);

    if (!debateSnap.exists) throw new Error("DEBATE_NOT_FOUND");
    if (!profileSnap.exists) throw new Error("ALIAS_REQUIRED");
    const debate = debateSnap.data() as CommunityDebate;
    if (!hasCommunityAccess(debate, userId, membershipSnap.exists)) {
      throw new Error("FORBIDDEN");
    }

    const profile = profileSnap.data() as UserProfile;
    const previous = positionSnap.exists
      ? (positionSnap.data() as CommunityDebatePosition)
      : null;
    if (previous?.currentChoice === nextChoice) {
      return { position: previous, change: null };
    }

    const position: CommunityDebatePosition = previous
      ? {
          ...previous,
          currentChoice: nextChoice,
          currentAt: now,
          updatedAt: now,
        }
      : {
          id: positionRef.id,
          debateId,
          userId,
          alias: profile.alias,
          baselineChoice: null,
          currentChoice: nextChoice,
          baselineAt: null,
          currentAt: now,
          updatedAt: now,
        };
    const changeRef = communityPositionChangesCollection().doc(randomUUID());
    const change: CommunityPositionChange = {
      id: changeRef.id,
      positionId: positionRef.id,
      debateId,
      userId,
      alias: profile.alias,
      previousChoice: previous?.currentChoice ?? null,
      nextChoice,
      stage: "update",
      changedAt: now,
    };

    transaction.set(positionRef, position);
    transaction.create(changeRef, change);
    return { position, change };
  });
}

export async function createCommunityArgument(
  userId: string,
  debateId: string,
  input: {
    side: VoteSide;
    title: string;
    body: string;
    sourceLabel?: string;
    sourceUrl?: string;
  },
) {
  const title = normalizeCommunityQuestion(input.title).slice(0, 140);
  const body = normalizeCommunityText(input.body, 2400);
  const sourceLabel = normalizeCommunityQuestion(input.sourceLabel ?? "").slice(
    0,
    160,
  );
  const sourceUrl = (input.sourceUrl ?? "").trim();
  const hasPartialSource = Boolean(sourceLabel || sourceUrl);

  if (title.length < 3 || body.length < 8) {
    throw new Error("INVALID_ARGUMENT");
  }
  if (!["yes", "no"].includes(input.side)) {
    throw new Error("INVALID_SIDE");
  }
  if (
    hasPartialSource &&
    (sourceLabel.length < 2 || !isValidSourceUrl(sourceUrl))
  ) {
    throw new Error("INVALID_SOURCE");
  }

  const db = getFirestore();
  const now = new Date().toISOString();
  const argumentId = randomUUID();

  return db.runTransaction(async (transaction) => {
    const debateRef = communityDebatesCollection().doc(debateId);
    const profileRef = profilesCollection().doc(userId);
    const membershipRef = communityMembershipsCollection().doc(
      communityMembershipId(debateId, userId),
    );
    const [debateSnap, profileSnap, membershipSnap] = await Promise.all([
      transaction.get(debateRef),
      transaction.get(profileRef),
      transaction.get(membershipRef),
    ]);

    if (!debateSnap.exists) {
      throw new Error("DEBATE_NOT_FOUND");
    }
    if (!profileSnap.exists) {
      throw new Error("ALIAS_REQUIRED");
    }

    const debate = debateSnap.data() as CommunityDebate;
    if (!hasCommunityAccess(debate, userId, membershipSnap.exists)) {
      throw new Error("FORBIDDEN");
    }

    const profile = profileSnap.data() as UserProfile;
    const sources: ArgumentSource[] = hasPartialSource
      ? [
          {
            id: randomUUID(),
            label: sourceLabel,
            url: sourceUrl,
            addedBy: userId,
            addedByAlias: profile.alias,
            createdAt: now,
          },
        ]
      : [];
    const argument: CommunityArgument = {
      id: argumentId,
      debateId,
      side: input.side,
      authorId: userId,
      authorAlias: profile.alias,
      title,
      body,
      sources,
      createdAt: now,
      updatedAt: now,
    };

    transaction.create(communityArgumentsCollection().doc(argumentId), argument);
    transaction.update(debateRef, { updatedAt: now });
    return argument;
  });
}

export async function getOwnedCommunityDebate(
  userId: string,
  debateId: string,
) {
  const debateSnap = await communityDebatesCollection().doc(debateId).get();
  if (!debateSnap.exists) {
    throw new Error("DEBATE_NOT_FOUND");
  }

  const debate = debateSnap.data() as CommunityDebate;
  if (debate.ownerId !== userId) {
    throw new Error("FORBIDDEN");
  }
  return debate;
}

export async function getOwnedCommunityDebateWithArguments(
  userId: string,
  debateId: string,
) {
  const debate = await getOwnedCommunityDebate(userId, debateId);
  const argumentsSnap = await communityArgumentsCollection()
    .where("debateId", "==", debateId)
    .get();
  const debateArguments = argumentsSnap.docs
    .map((doc) =>
      mapCommunityArgument(doc.data() as Partial<CommunityArgument>),
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  return { debate, arguments: debateArguments };
}

export async function saveCommunityDebateConclusion(
  userId: string,
  debateId: string,
  argumentsList: CommunityArgument[],
  generated: GeneratedCommunityConclusion,
) {
  const db = getFirestore();
  const now = new Date().toISOString();
  return db.runTransaction(async (transaction) => {
    const debateRef = communityDebatesCollection().doc(debateId);
    const conclusionRef = communityConclusionsCollection().doc(debateId);
    const [debateSnap, existingConclusionSnap] = await Promise.all([
      transaction.get(debateRef),
      transaction.get(conclusionRef),
    ]);
    if (!debateSnap.exists) throw new Error("DEBATE_NOT_FOUND");
    const debate = debateSnap.data() as CommunityDebate;
    if (debate.ownerId !== userId) throw new Error("FORBIDDEN");

    const conclusion: CommunityDebateConclusion = {
      id: debateId,
      debateId,
      ...generated,
      argumentFingerprint: computeArgumentFingerprint(argumentsList),
      argumentCount: argumentsList.length,
      yesArgumentCount: argumentsList.filter(
        (argument) => argument.side === "yes",
      ).length,
      noArgumentCount: argumentsList.filter(
        (argument) => argument.side === "no",
      ).length,
      generatedBy: "vertex",
      createdAt: existingConclusionSnap.exists
        ? (existingConclusionSnap.data() as CommunityDebateConclusion).createdAt
        : now,
      updatedAt: now,
    };
    transaction.set(conclusionRef, conclusion);
    return conclusion;
  });
}

export async function importCommunityArguments(
  userId: string,
  debateId: string,
  drafts: ImportedArgumentDraft[],
) {
  if (!drafts.length || drafts.length > 20) {
    throw new Error("INVALID_IMPORT");
  }

  const normalizedDrafts = drafts.map((draft) => {
    const title = normalizeCommunityQuestion(draft.title).slice(0, 140);
    const body = normalizeCommunityText(draft.body, 2400);
    if (
      !["yes", "no"].includes(draft.side) ||
      title.length < 3 ||
      body.length < 8 ||
      draft.sources.length > 8
    ) {
      throw new Error("INVALID_IMPORT");
    }

    const sources = draft.sources.map((source) => {
      const label = normalizeCommunityQuestion(source.label).slice(0, 160);
      const url = source.url.trim();
      if (label.length < 2 || !isValidSourceUrl(url)) {
        throw new Error("INVALID_SOURCE");
      }
      return { label, url };
    });
    return { side: draft.side, title, body, sources };
  });

  const existingSnap = await communityArgumentsCollection()
    .where("debateId", "==", debateId)
    .get();
  const existingKeys = new Set(
    existingSnap.docs.map((doc) => {
      const argument = mapCommunityArgument(
        doc.data() as Partial<CommunityArgument>,
      );
      return `${argument.side}:${argument.title.toLocaleLowerCase()}`;
    }),
  );
  const batchKeys = new Set<string>();
  const uniqueDrafts = normalizedDrafts.filter((draft) => {
    const key = `${draft.side}:${draft.title.toLocaleLowerCase()}`;
    if (existingKeys.has(key) || batchKeys.has(key)) return false;
    batchKeys.add(key);
    return true;
  });

  if (!uniqueDrafts.length) return [];
  if (existingSnap.size + uniqueDrafts.length > 200) {
    throw new Error("ARGUMENT_LIMIT");
  }

  const db = getFirestore();
  const now = new Date().toISOString();
  return db.runTransaction(async (transaction) => {
    const debateRef = communityDebatesCollection().doc(debateId);
    const profileRef = profilesCollection().doc(userId);
    const [debateSnap, profileSnap] = await Promise.all([
      transaction.get(debateRef),
      transaction.get(profileRef),
    ]);
    if (!debateSnap.exists) throw new Error("DEBATE_NOT_FOUND");
    if (!profileSnap.exists) throw new Error("ALIAS_REQUIRED");

    const debate = debateSnap.data() as CommunityDebate;
    if (debate.ownerId !== userId) throw new Error("FORBIDDEN");
    const profile = profileSnap.data() as UserProfile;
    const imported = uniqueDrafts.map((draft) => {
      const argumentId = randomUUID();
      const argument: CommunityArgument = {
        id: argumentId,
        debateId,
        side: draft.side,
        authorId: userId,
        authorAlias: profile.alias,
        title: draft.title,
        body: draft.body,
        sources: draft.sources.map((source) => ({
          id: randomUUID(),
          ...source,
          addedBy: userId,
          addedByAlias: profile.alias,
          createdAt: now,
        })),
        createdAt: now,
        updatedAt: now,
      };
      transaction.create(
        communityArgumentsCollection().doc(argumentId),
        argument,
      );
      return argument;
    });
    transaction.update(debateRef, { updatedAt: now });
    return imported;
  });
}

export async function addCommunityArgumentSource(
  userId: string,
  debateId: string,
  argumentId: string,
  input: { label: string; url: string },
) {
  const label = normalizeCommunityQuestion(input.label).slice(0, 160);
  const url = input.url.trim();

  if (label.length < 2 || !isValidSourceUrl(url)) {
    throw new Error("INVALID_SOURCE");
  }

  const db = getFirestore();
  const now = new Date().toISOString();

  return db.runTransaction(async (transaction) => {
    const debateRef = communityDebatesCollection().doc(debateId);
    const argumentRef = communityArgumentsCollection().doc(argumentId);
    const profileRef = profilesCollection().doc(userId);
    const membershipRef = communityMembershipsCollection().doc(
      communityMembershipId(debateId, userId),
    );
    const [debateSnap, argumentSnap, profileSnap, membershipSnap] =
      await Promise.all([
      transaction.get(debateRef),
      transaction.get(argumentRef),
      transaction.get(profileRef),
        transaction.get(membershipRef),
      ]);

    if (!debateSnap.exists || !argumentSnap.exists) {
      throw new Error("ARGUMENT_NOT_FOUND");
    }
    if (!profileSnap.exists) {
      throw new Error("ALIAS_REQUIRED");
    }

    const debate = debateSnap.data() as CommunityDebate;
    const argument = mapCommunityArgument(
      argumentSnap.data() as Partial<CommunityArgument>,
    );
    if (
      argument.debateId !== debateId ||
      !hasCommunityAccess(debate, userId, membershipSnap.exists)
    ) {
      throw new Error("FORBIDDEN");
    }
    if (argument.sources.length >= 8) {
      throw new Error("SOURCE_LIMIT");
    }

    const profile = profileSnap.data() as UserProfile;
    const source: ArgumentSource = {
      id: randomUUID(),
      label,
      url,
      addedBy: userId,
      addedByAlias: profile.alias,
      createdAt: now,
    };

    transaction.update(argumentRef, {
      sources: [...argument.sources, source],
      updatedAt: now,
    });
    transaction.update(debateRef, { updatedAt: now });
    return source;
  });
}

export async function createArgumentComment(
  userId: string,
  debateId: string,
  argumentId: string,
  rawBody: string,
) {
  const body = clampCommentBody(rawBody);
  if (body.length < 2) {
    throw new Error("COMMENT_TOO_SHORT");
  }

  const db = getFirestore();
  const now = new Date().toISOString();
  const commentId = randomUUID();

  return db.runTransaction(async (transaction) => {
    const debateRef = communityDebatesCollection().doc(debateId);
    const argumentRef = communityArgumentsCollection().doc(argumentId);
    const profileRef = profilesCollection().doc(userId);
    const membershipRef = communityMembershipsCollection().doc(
      communityMembershipId(debateId, userId),
    );
    const [debateSnap, argumentSnap, profileSnap, membershipSnap] =
      await Promise.all([
      transaction.get(debateRef),
      transaction.get(argumentRef),
      transaction.get(profileRef),
        transaction.get(membershipRef),
      ]);

    if (!debateSnap.exists || !argumentSnap.exists) {
      throw new Error("ARGUMENT_NOT_FOUND");
    }
    if (!profileSnap.exists) {
      throw new Error("ALIAS_REQUIRED");
    }

    const debate = debateSnap.data() as CommunityDebate;
    const argument = mapCommunityArgument(
      argumentSnap.data() as Partial<CommunityArgument>,
    );
    if (
      argument.debateId !== debateId ||
      !hasCommunityAccess(debate, userId, membershipSnap.exists)
    ) {
      throw new Error("FORBIDDEN");
    }

    const profile = profileSnap.data() as UserProfile;
    const comment: ArgumentComment = {
      id: commentId,
      debateId,
      argumentId,
      authorId: userId,
      authorAlias: profile.alias,
      body,
      createdAt: now,
      updatedAt: now,
    };

    transaction.create(argumentCommentsCollection().doc(commentId), comment);
    transaction.update(debateRef, { updatedAt: now });
    return comment;
  });
}

export async function seedDebate(force = false) {
  const db = getFirestore();
  const debateId = DEBATE_SLUG;
  const now = new Date().toISOString();
  const generatedDebate = await generateDebateSeed();

  await db.runTransaction(async (transaction) => {
    const debateRef = debatesCollection().doc(debateId);
    const aggregateRef = aggregatesCollection().doc(debateId);
    const [debateSnap, aggregateSnap] = await Promise.all([
      transaction.get(debateRef),
      transaction.get(aggregateRef),
    ]);

    if (debateSnap.exists && !force) {
      return;
    }

    const existingDebate = hydrateDebate(
      debateSnap.exists ? (debateSnap.data() as Partial<Debate>) : FALLBACK_DEBATE,
    );
    const aggregate = hydrateAggregate(
      debateId,
      aggregateSnap.exists
        ? (aggregateSnap.data() as Partial<DebateAggregate>)
        : undefined,
    );

    const nextDebate = hydrateDebate({
      ...generatedDebate,
      yesCount: aggregate.yesVotes,
      noCount: aggregate.noVotes,
      createdAt: existingDebate.createdAt ?? now,
      updatedAt: now,
    });

    transaction.set(debateRef, nextDebate, { merge: true });
    transaction.set(
      aggregateRef,
      {
        ...aggregate,
        updatedAt: now,
      },
      { merge: true },
    );
  });

  return generatedDebate;
}
