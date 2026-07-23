import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type Locale,
  type VoteSide,
} from "@/lib/types";

export { DEFAULT_LOCALE, SUPPORTED_LOCALES };

const copy = {
  fr: {
    brand: "DBYLE",
    strapline: "Don't believe your lying eyes.",
    heroLabel: "Infrastructure civique",
    homeTitle: "Le débat mérite mieux que des opinions.",
    homeIntro: "Un signal clair. Des arguments équilibrés. Une démocratie à la hauteur des enjeux.",
    homePrimaryCta: "Entrer dans le débat",
    homeSecondaryCta: "Voir le baromètre",
    featuredQuestion: "Question en vedette",
    liveUpdate: "Mis à jour en continu",
    simulatedDataLabel: "Données simulées · POC",
    sideYes: "Oui",
    sideNo: "Non",
    openParticipation: "Participation ouverte",
    explorePulse: "Explorer le baromètre complet",
    whyDbyle: "Pourquoi DBYLE ?",
    signalTitle: "Le signal plutôt que le bruit.",
    signalBody: "DBYLE aide les citoyens à se forger une opinion libre et éclairée grâce à des arguments présentés de façon équilibrée. Nous séparons les faits des opinions et rendons visible ce qui fait consensus comme ce qui divise.",
    howItWorks: "Comment ça marche",
    steps: [
      { title: "S'informer", body: "Consultez les arguments des deux côtés." },
      { title: "Débattre", body: "Partagez votre point de vue avec respect." },
      { title: "Comprendre", body: "Suivez le pouls public en temps réel." },
    ],
    globalVision: "Notre vision globale",
    universalTitle: "Chaque voix mérite d’être comprise.",
    aiCapabilityTitle: "Avec l’IA, le débat peut enfin changer d’échelle.",
    universalVisionBody: "L’IA nous donne aujourd’hui la capacité d’organiser, d’agréger et de résumer des discussions à grande échelle. DBYLE transforme des milliers de contributions en une compréhension claire des arguments, des consensus et des désaccords — sans remplacer le jugement humain.",
    aiInfrastructure: "Infrastructure civique propulsée par l’IA",
    startHere: "Découvrir le débat pilote",
    pulseTitle: "Position de la societe",
    pulseSubtitle:
      "Un barometre vivant qui combine les votes, le niveau de participation et les commentaires les plus soutenus.",
    voteLabel: "Choisissez votre position",
    voteYes: "Je penche vers le Oui",
    voteNo: "Je penche vers le Non",
    currentVote: "Votre position actuelle",
    authPrompt:
      "Creez un vrai compte pour voter, commenter et soutenir les contributions.",
    authUnavailable:
      "La participation n'est pas disponible sur cet environnement.",
    signIn: "Se connecter",
    signOut: "Se deconnecter",
    accessTitle: "Creer un compte citoyen",
    accessIntro:
      "L'acces au debat passe maintenant par un vrai compte: email, mot de passe, puis pseudo public visible par les autres.",
    accessAccountTitle: "Nouveau compte",
    accessAccountBody:
      "Votre email reste prive. Votre pseudo public apparait sur vos commentaires, vos soutiens et votre participation.",
    accessAccountButton: "Creer mon compte",
    accessAccountHint:
      "Compte email prive, identite publique sous pseudo.",
    accessSignInTitle: "Connexion",
    accessSignInBody:
      "Vous avez deja un compte ? Reprenez votre place dans le debat en quelques secondes.",
    accessSignInButton: "Me connecter",
    accessEmailLabel: "Email",
    accessPasswordLabel: "Mot de passe",
    accessPasswordConfirmLabel: "Confirmer le mot de passe",
    accessAliasLabel: "Pseudo public",
    accessPasswordHelp:
      "8 a 72 caracteres, avec au moins une lettre et un chiffre.",
    accessAutoLoginFallback:
      "Compte cree. Connectez-vous pour continuer.",
    accessGoogleTitle: "Google en option",
    accessGoogleBody:
      "Si vous gardez un fournisseur externe, Google peut rester un point d'entree secondaire sans remplacer le compte principal.",
    accessGoogleButton: "Continuer avec Google",
    accessOptional: "Optionnel",
    accessRecommended: "Recommande",
    accessBack: "Retour a l'accueil",
    emailExists: "Un compte existe deja avec cet email.",
    emailInvalid: "Entrez un email valide.",
    passwordInvalid:
      "Le mot de passe doit contenir 8 a 72 caracteres, avec au moins une lettre et un chiffre.",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    loginInvalid: "Email ou mot de passe incorrect.",
    registrationInvalid: "Les informations du compte sont invalides.",
    registrationFailed: "La creation du compte a echoue.",
    loginFailed: "La connexion a echoue.",
    debateQuestionLabel: "Question ouverte",
    debateArgumentsLabel: "Arguments initiaux",
    exploreBothSides: "Explorer les deux perspectives.",
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
    brand: "DBYLE",
    strapline: "Don't believe your lying eyes.",
    heroLabel: "Civic infrastructure",
    homeTitle: "Debate deserves better than opinions.",
    homeIntro: "A clear signal. Balanced arguments. Democracy equal to the stakes.",
    homePrimaryCta: "Enter the debate",
    homeSecondaryCta: "View the public pulse",
    featuredQuestion: "Featured question",
    liveUpdate: "Continuously updated",
    simulatedDataLabel: "Simulated data · POC",
    sideYes: "Yes",
    sideNo: "No",
    openParticipation: "Open participation",
    explorePulse: "Explore the full public pulse",
    whyDbyle: "Why DBYLE?",
    signalTitle: "Signal over noise.",
    signalBody: "DBYLE helps citizens form a free and informed opinion through arguments presented with balance. We separate facts from opinions and make visible both what unites a society and what divides it.",
    howItWorks: "How it works",
    steps: [
      { title: "Get informed", body: "Read the strongest arguments on both sides." },
      { title: "Debate", body: "Share your point of view with respect." },
      { title: "Understand", body: "Follow the public pulse in real time." },
    ],
    globalVision: "Our global vision",
    universalTitle: "Every voice deserves to be understood.",
    aiCapabilityTitle: "With AI, debate can finally scale.",
    universalVisionBody: "AI now gives us the ability to organize, aggregate, and summarize discussions at massive scale. DBYLE turns thousands of contributions into a clear understanding of the arguments, consensus, and disagreements — without replacing human judgment.",
    aiInfrastructure: "AI-powered civic infrastructure",
    startHere: "Explore the pilot debate",
    pulseTitle: "Societal pulse",
    pulseSubtitle:
      "A living barometer that combines votes, participation, and the most supported comments.",
    voteLabel: "Choose your position",
    voteYes: "I lean Yes",
    voteNo: "I lean No",
    currentVote: "Your current position",
    authPrompt:
      "Create a real account to vote, comment, and support contributions.",
    authUnavailable:
      "Participation is not available in this environment.",
    signIn: "Sign in",
    signOut: "Sign out",
    accessTitle: "Create your civic account",
    accessIntro:
      "Participation now runs through a real account: email, password, and a public alias visible to everyone else.",
    accessAccountTitle: "New account",
    accessAccountBody:
      "Your email stays private. Your public alias appears on your comments, your support actions, and your participation.",
    accessAccountButton: "Create my account",
    accessAccountHint:
      "Private email, public identity through an alias.",
    accessSignInTitle: "Sign in",
    accessSignInBody:
      "Already have an account? Rejoin the debate in a few seconds.",
    accessSignInButton: "Sign in now",
    accessEmailLabel: "Email",
    accessPasswordLabel: "Password",
    accessPasswordConfirmLabel: "Confirm password",
    accessAliasLabel: "Public alias",
    accessPasswordHelp:
      "8 to 72 characters, with at least one letter and one number.",
    accessAutoLoginFallback:
      "Account created. Sign in to continue.",
    accessGoogleTitle: "Google optional",
    accessGoogleBody:
      "If you keep an external provider, Google can remain a secondary entry point without replacing the main account flow.",
    accessGoogleButton: "Continue with Google",
    accessOptional: "Optional",
    accessRecommended: "Recommended",
    accessBack: "Back to home",
    emailExists: "An account already exists for this email.",
    emailInvalid: "Enter a valid email address.",
    passwordInvalid:
      "Password must be 8 to 72 characters long and include at least one letter and one number.",
    passwordMismatch: "Passwords do not match.",
    loginInvalid: "Incorrect email or password.",
    registrationInvalid: "The account details are invalid.",
    registrationFailed: "Account creation failed.",
    loginFailed: "Sign-in failed.",
    debateQuestionLabel: "Open question",
    debateArgumentsLabel: "Initial arguments",
    exploreBothSides: "Explore both sides.",
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
