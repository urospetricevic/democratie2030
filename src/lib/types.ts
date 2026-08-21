export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export const DEFAULT_LOCALE = "fr";
export const DEBATE_SLUG = "quebec-country";

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type VoteSide = "yes" | "no";
export type LocalizedText = Record<Locale, string>;
export type AuthProvider = "password" | "google" | "guest";

export interface ArgumentCard {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  details: LocalizedText;
}

export interface Debate {
  id: string;
  slug: string;
  status: "live";
  seedSource: "vertex" | "fallback";
  title: LocalizedText;
  question: LocalizedText;
  intro: LocalizedText;
  yesLabel: LocalizedText;
  noLabel: LocalizedText;
  yesArguments: ArgumentCard[];
  noArguments: ArgumentCard[];
  yesCount: number;
  noCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DebateAggregate {
  debateId: string;
  yesVotes: number;
  noVotes: number;
  voterCount: number;
  commentCount: number;
  upvoteCount: number;
  topCommentIds: string[];
  isSimulated?: boolean;
  simulatedVoterCount?: number;
  updatedAt: string;
}

export interface SocietalPulse extends DebateAggregate {
  totalVotes: number;
  yesPercent: number;
  noPercent: number;
  leadingSide: VoteSide | "tie";
  leadMargin: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  alias: string;
  aliasNormalized: string;
  authProvider: AuthProvider;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordAccountRecord {
  userId: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  emailNormalized: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
}

export interface VoteRecord {
  id: string;
  debateId: string;
  userId: string;
  side: VoteSide;
  createdAt: string;
  updatedAt: string;
}

export interface CommentRecord {
  id: string;
  debateId: string;
  authorId: string;
  alias: string;
  body: string;
  upvoteCount: number;
  isSimulated?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ViewerState {
  isAuthenticated: boolean;
  hasAlias: boolean;
  alias: string | null;
  voteSide: VoteSide | null;
}

export interface DebatePageData {
  debate: Debate;
  pulse: SocietalPulse;
  comments: CommentRecord[];
  topComments: CommentRecord[];
  viewer: ViewerState;
  source: "firestore" | "fallback";
}

export interface CommunityMember {
  userId: string;
  alias: string;
  role: "host" | "friend";
  joinedAt: string;
}

export interface CommunityMembership extends CommunityMember {
  id: string;
  debateId: string;
}

export interface CommunityDebate {
  id: string;
  question: string;
  context: string;
  category: string;
  locale: Locale;
  visibility: "private";
  status: "active";
  ownerId: string;
  ownerAlias: string;
  memberCount: number;
  memberIds: string[];
  members: CommunityMember[];
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArgumentSource {
  id: string;
  label: string;
  url: string;
  addedBy: string;
  addedByAlias: string;
  createdAt: string;
}

export interface CommunityArgument {
  id: string;
  debateId: string;
  side: VoteSide;
  authorId: string;
  authorAlias: string;
  title: string;
  body: string;
  sources: ArgumentSource[];
  createdAt: string;
  updatedAt: string;
}

export type CommunityConclusionPosition =
  | "yes"
  | "no"
  | "mixed"
  | "insufficient";

export interface CommunityDebateConclusion {
  id: string;
  debateId: string;
  position: CommunityConclusionPosition;
  headline: string;
  summary: string;
  conditions: string[];
  caveats: string[];
  argumentFingerprint: string;
  argumentCount: number;
  yesArgumentCount: number;
  noArgumentCount: number;
  generatedBy: "vertex";
  createdAt: string;
  updatedAt: string;
}

export interface CommunityDebateTitleChange {
  id: string;
  debateId: string;
  actorId: string;
  actorAlias: string;
  previousQuestion: string;
  nextQuestion: string;
  changedAt: string;
}

export interface ImportedArgumentSource {
  label: string;
  url: string;
}

export interface ImportedArgumentDraft {
  side: VoteSide;
  title: string;
  body: string;
  sources: ImportedArgumentSource[];
}

export interface ArgumentImportPreview {
  sourceUrl: string;
  sourceTitle: string;
  arguments: ImportedArgumentDraft[];
}

export interface ArgumentComment {
  id: string;
  debateId: string;
  argumentId: string;
  authorId: string;
  authorAlias: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityInvitePreview {
  id: string;
  question: string;
  context: string;
  category: string;
  locale: Locale;
  ownerAlias: string;
  memberCount: number;
}

export interface CommunityDebatePageData {
  debate: CommunityDebate;
  members: CommunityMember[];
  arguments: CommunityArgument[];
  comments: ArgumentComment[];
  titleHistory: CommunityDebateTitleChange[];
  conclusion: CommunityDebateConclusion | null;
  conclusionIsStale: boolean;
  viewerId: string;
}

export interface CommunityDebateListItem {
  id: string;
  question: string;
  context: string;
  category: string;
  locale: Locale;
  role: "host" | "friend";
  memberCount: number;
  updatedAt: string;
}

export type CommunityDebateAccess =
  | { status: "member"; data: CommunityDebatePageData }
  | { status: "invite"; debate: CommunityInvitePreview }
  | { status: "forbidden" }
  | { status: "not-found" };
