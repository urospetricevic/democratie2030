export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export const DEFAULT_LOCALE = "fr";
export const DEBATE_SLUG = "quebec-country";

export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type VoteSide = "yes" | "no";
export type LocalizedText = Record<Locale, string>;
export type AuthProvider = "guest" | "google";

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
