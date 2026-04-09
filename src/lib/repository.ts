import { randomUUID } from "node:crypto";
import fallbackDebate from "@/data/quebec-debate-fallback.json";
import { clampCommentBody, computeSocietalPulse, computeVoteTotals, isAliasValid, normalizeAlias, sortCommentsByRecency, sortCommentsBySupport } from "@/lib/domain";
import { isFirestoreConfigured } from "@/lib/env";
import { getFirestore } from "@/lib/firestore";
import { generateDebateSeed } from "@/lib/seed";
import { DEBATE_SLUG, type AuthProvider, type CommentRecord, type Debate, type DebateAggregate, type DebatePageData, type UserProfile, type ViewerState, type VoteRecord, type VoteSide } from "@/lib/types";

const FALLBACK_DEBATE = structuredClone(fallbackDebate) as Debate;
const GUEST_ID_PATTERN = /^[a-z0-9-]{12,128}$/;

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

function votesCollection() {
  return getFirestore().collection("votes");
}

function commentsCollection() {
  return getFirestore().collection("comments");
}

function commentUpvotesCollection() {
  return getFirestore().collection("commentUpvotes");
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
    createdAt: value.createdAt ?? new Date().toISOString(),
    updatedAt: value.updatedAt ?? new Date().toISOString(),
  };
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

function sanitizeGuestId(rawGuestId: string) {
  return rawGuestId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

export async function registerGuestIdentity(rawGuestId: string, rawAlias: string) {
  const guestId = sanitizeGuestId(rawGuestId);
  if (!GUEST_ID_PATTERN.test(guestId)) {
    throw new Error("INVALID_GUEST_ID");
  }

  const userId = `guest_${guestId}`;
  const email = `${guestId}@guest.democratie2030.local`;

  if (!isFirestoreConfigured()) {
    const aliasNormalized = normalizeAlias(rawAlias);
    if (!isAliasValid(aliasNormalized)) {
      throw new Error("INVALID_ALIAS");
    }

    return {
      userId,
      email,
      alias: aliasNormalized,
      aliasNormalized,
      authProvider: "guest" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return setUserAlias(userId, email, rawAlias, "guest");
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
