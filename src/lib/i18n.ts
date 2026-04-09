import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  type VoteSide,
} from "@/lib/types";

export { DEFAULT_LOCALE, SUPPORTED_LOCALES };

const copy = {
  fr: {
    brand: "Democratie2030",
    strapline: "Le lieu ou une societe clarifie ce qu'elle veut vraiment.",
    heroLabel: "Prototype citoyen",
    homeTitle: "Debattre ensemble. Voter clairement. Voir la tendance generale.",
    homeIntro:
      "Une premiere plateforme pour structurer un grand debat public, faire ressortir les arguments les plus convaincants, puis afficher la position collective du moment.",
    homePrimaryCta: "Ouvrir le debat",
    homeSecondaryCta: "Voir le barometre social",
    pulseTitle: "Position de la societe",
    pulseSubtitle:
      "Un barometre vivant qui combine les votes, le niveau de participation et les commentaires les plus soutenus.",
    voteLabel: "Choisissez votre position",
    voteYes: "Je penche vers le Oui",
    voteNo: "Je penche vers le Non",
    currentVote: "Votre position actuelle",
    authPrompt:
      "Accedez au debat avec un alias citoyen ou un fournisseur externe pour voter, commenter et soutenir les contributions.",
    authUnavailable:
      "La participation n'est pas disponible sur cet environnement.",
    signIn: "Acceder pour participer",
    signOut: "Se deconnecter",
    accessTitle: "Entrez dans le debat",
    accessIntro:
      "Choisissez un acces rapide pour participer. Le mode citoyen est lie a ce navigateur et suffit pour ce prototype.",
    accessGuestTitle: "Mode citoyen",
    accessGuestBody:
      "Choisissez votre alias public et participez sans passer par un fournisseur externe.",
    accessGuestButton: "Continuer avec mon alias",
    accessGuestHint:
      "Votre voix reste associee a ce navigateur. Vous pourrez voter, commenter et soutenir les arguments en quelques secondes.",
    accessGoogleTitle: "Google en option",
    accessGoogleBody:
      "Si vous preferez un fournisseur externe, l'entree Google peut etre reactivee plus tard sans changer le reste du produit.",
    accessGoogleButton: "Continuer avec Google",
    accessOptional: "Optionnel",
    accessRecommended: "Recommande",
    accessBack: "Retour a l'accueil",
    debateQuestionLabel: "Question ouverte",
    debateArgumentsLabel: "Arguments initiaux",
    commentsTitle: "Commentaires publics",
    commentsSubtitle:
      "Les commentaires restent independants du vote pour garder un espace de discussion plus ouvert.",
    addComment: "Ajouter un commentaire",
    commentPlaceholder:
      "Expliquez votre position, nuancez un argument, ou soutenez une idee qui merite d'etre amplifiee.",
    publishComment: "Publier",
    upvote: "Soutenir",
    supportedComment: "Commentaire le plus soutenu",
    topComments: "Les voix qui rassemblent le plus",
    participants: "votants",
    comments: "commentaires",
    upvotes: "soutiens",
    details: "Lire les details",
    aliasTitle: "Choisissez votre nom public",
    aliasIntro:
      "Votre mode d'acces securise votre participation. Votre pseudo est le seul nom visible publiquement dans le debat.",
    aliasPlaceholder: "Votre pseudo public",
    aliasSubmit: "Valider mon pseudo",
    aliasHelp:
      "3 a 24 caracteres. Lettres, chiffres, tirets et traits de soulignement.",
    aliasExists: "Ce pseudo est deja pris.",
    aliasInvalid: "Le pseudo ne respecte pas le format attendu.",
    backToDebate: "Retourner au debat",
    seededBy: "Arguments initiaux prepares par IA",
    fallbackBadge: "Mode fallback",
    liveBadge: "Debat public en direct",
    societyLeansYes: "Pour l'instant, l'opinion penche vers le Oui.",
    societyLeansNo: "Pour l'instant, l'opinion penche vers le Non.",
    societyTie: "Pour l'instant, la societe reste partagee.",
    participationLine:
      "Chaque vote actualise en direct le barometre collectif du debat.",
    noCommentsYet: "Aucun commentaire pour l'instant. Lancez la conversation.",
    whyItWorksTitle: "Pourquoi cette forme de debat ?",
    whyItWorksText:
      "Parce qu'un vote brut ne suffit pas: il faut aussi rendre visibles les arguments qui convainquent le plus largement.",
    welcomeNext: "Continuer"
  },
  en: {
    brand: "Democratie2030",
    strapline: "A place where society clarifies what it actually wants.",
    heroLabel: "Civic prototype",
    homeTitle: "Debate together. Vote clearly. See society's direction.",
    homeIntro:
      "A first platform for structuring a major public debate, surfacing the strongest arguments, and displaying the collective position of the moment.",
    homePrimaryCta: "Open the debate",
    homeSecondaryCta: "See the societal pulse",
    pulseTitle: "Societal pulse",
    pulseSubtitle:
      "A living barometer that combines votes, participation, and the most supported comments.",
    voteLabel: "Choose your position",
    voteYes: "I lean Yes",
    voteNo: "I lean No",
    currentVote: "Your current position",
    authPrompt:
      "Use a civic alias or an external provider to vote, comment, and support contributions.",
    authUnavailable:
      "Participation is not available in this environment.",
    signIn: "Access the debate",
    signOut: "Sign out",
    accessTitle: "Enter the debate",
    accessIntro:
      "Pick a fast access mode to participate. Civic mode is tied to this browser and is enough for this prototype.",
    accessGuestTitle: "Civic mode",
    accessGuestBody:
      "Choose your public alias and participate without relying on an external provider.",
    accessGuestButton: "Continue with my alias",
    accessGuestHint:
      "Your voice stays tied to this browser. You will be able to vote, comment, and support arguments in seconds.",
    accessGoogleTitle: "Google optional",
    accessGoogleBody:
      "If you prefer an external provider, Google entry can be re-enabled later without changing the rest of the product.",
    accessGoogleButton: "Continue with Google",
    accessOptional: "Optional",
    accessRecommended: "Recommended",
    accessBack: "Back to home",
    debateQuestionLabel: "Open question",
    debateArgumentsLabel: "Initial arguments",
    commentsTitle: "Public comments",
    commentsSubtitle:
      "Comments stay independent from each user's vote to keep the discussion space broader.",
    addComment: "Add a comment",
    commentPlaceholder:
      "Explain your position, nuance an argument, or back an idea that deserves to spread.",
    publishComment: "Publish",
    upvote: "Support",
    supportedComment: "Most supported comment",
    topComments: "Voices gathering the broadest support",
    participants: "voters",
    comments: "comments",
    upvotes: "supports",
    details: "Read details",
    aliasTitle: "Choose your public name",
    aliasIntro:
      "Your access mode secures participation. Your alias is the only public name shown in the debate.",
    aliasPlaceholder: "Your public alias",
    aliasSubmit: "Save my alias",
    aliasHelp:
      "3 to 24 characters. Letters, numbers, hyphens, and underscores.",
    aliasExists: "This alias is already taken.",
    aliasInvalid: "This alias does not match the expected format.",
    backToDebate: "Back to the debate",
    seededBy: "Initial arguments prepared by AI",
    fallbackBadge: "Fallback mode",
    liveBadge: "Live public debate",
    societyLeansYes: "For now, public opinion leans Yes.",
    societyLeansNo: "For now, public opinion leans No.",
    societyTie: "For now, society remains split.",
    participationLine:
      "Every vote updates the collective barometer of the debate in real time.",
    noCommentsYet: "No comments yet. Start the conversation.",
    whyItWorksTitle: "Why structure debate this way?",
    whyItWorksText:
      "Because a raw vote is not enough: the platform also needs to surface the arguments that persuade the broadest public.",
    welcomeNext: "Continue"
  }
} as const;

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function getCopy(locale: Locale) {
  return copy[locale];
}

export function getPreferredLocale(headerValue?: string | null): Locale {
  if (!headerValue) {
    return DEFAULT_LOCALE;
  }

  const normalized = headerValue.toLowerCase();
  if (normalized.includes("fr")) {
    return "fr";
  }
  if (normalized.includes("en")) {
    return "en";
  }
  return DEFAULT_LOCALE;
}

export function getSideLabel(locale: Locale, side: VoteSide) {
  const dictionary = getCopy(locale);
  return side === "yes" ? dictionary.voteYes : dictionary.voteNo;
}

export function formatNumber(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
