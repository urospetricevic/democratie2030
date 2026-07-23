const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const accessToken = process.env.GCLOUD_ACCESS_TOKEN;

if (!projectId || !accessToken) {
  throw new Error("GOOGLE_CLOUD_PROJECT and GCLOUD_ACCESS_TOKEN are required.");
}

const debateId = "quebec-country";
const documentRoot = `projects/${projectId}/databases/(default)/documents`;
const now = new Date().toISOString();

const demoComments = [
  {
    id: "demo-language-culture",
    alias: "marie_estrie",
    body: "La question de la langue me semble centrale. Je veux savoir quels pouvoirs supplémentaires changeraient concrètement la vitalité du français au quotidien.",
    upvoteCount: 24,
  },
  {
    id: "demo-economic-transition",
    alias: "alex_mtl",
    body: "I could support sovereignty if there were a credible, detailed transition plan for currency, debt, pensions, and trade with Canada.",
    upvoteCount: 19,
  },
  {
    id: "demo-indigenous-relations",
    alias: "nord_du_quebec",
    body: "Le débat doit inclure clairement les nations autochtones. Leur consentement, leurs territoires et leurs propres droits à l’autodétermination ne peuvent pas être secondaires.",
    upvoteCount: 17,
  },
  {
    id: "demo-federal-reform",
    alias: "samuel_qc",
    body: "Before choosing separation, I want a serious comparison between independence and a renewed federal arrangement with stronger Quebec autonomy.",
    upvoteCount: 13,
  },
  {
    id: "demo-democratic-clarity",
    alias: "citoyenne_92",
    body: "Un prochain référendum devrait poser une question simple et présenter à l’avance les principales conséquences négociées, pas seulement des promesses de campagne.",
    upvoteCount: 11,
  },
  {
    id: "demo-global-voice",
    alias: "leo_laval",
    body: "Quebec already has a distinct global voice. The real question for me is whether full sovereignty would strengthen that voice enough to justify the disruption.",
    upvoteCount: 8,
  },
  {
    id: "demo-social-cohesion",
    alias: "amina_qc",
    body: "J’aimerais que les deux camps expliquent mieux comment ils protégeraient les minorités linguistiques et maintiendraient la cohésion sociale après le vote.",
    upvoteCount: 6,
  },
  {
    id: "demo-climate-energy",
    alias: "fleuve_2050",
    body: "Energy and climate policy could be a strong sovereignty argument, but only if the plan addresses affordability and cooperation with neighbouring provinces.",
    upvoteCount: 5,
  },
] as const;

function stringValue(value: string) {
  return { stringValue: value };
}

function integerValue(value: number) {
  return { integerValue: String(value) };
}

async function commit() {
  const writes: Array<{
    update: { name: string; fields: Record<string, unknown> };
  }> = demoComments.map((comment, index) => ({
    update: {
      name: `${documentRoot}/comments/${comment.id}`,
      fields: {
        id: stringValue(comment.id),
        debateId: stringValue(debateId),
        authorId: stringValue(`demo_${comment.id}`),
        alias: stringValue(comment.alias),
        body: stringValue(comment.body),
        upvoteCount: integerValue(comment.upvoteCount),
        isSimulated: { booleanValue: true },
        createdAt: stringValue(new Date(Date.now() - (index + 1) * 3_600_000).toISOString()),
        updatedAt: stringValue(now),
      },
    },
  }));

  writes.push({
    update: {
      name: `${documentRoot}/debateAggregates/${debateId}`,
      fields: {
        debateId: stringValue(debateId),
        yesVotes: integerValue(54),
        noVotes: integerValue(46),
        voterCount: integerValue(100),
        commentCount: integerValue(9),
        upvoteCount: integerValue(105),
        topCommentIds: {
          arrayValue: {
            values: demoComments.slice(0, 3).map((comment) => stringValue(comment.id)),
          },
        },
        isSimulated: { booleanValue: true },
        simulatedVoterCount: integerValue(98),
        updatedAt: stringValue(now),
      },
    },
  });

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ writes }),
    },
  );

  if (!response.ok) {
    throw new Error(`Firestore commit failed: ${response.status} ${await response.text()}`);
  }

  console.log(`Seeded ${demoComments.length} demo comments and a 100-person pulse.`);
}

void commit();
