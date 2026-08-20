import { createHash } from "node:crypto";
import { GoogleAuth } from "google-auth-library";
import { z } from "zod";
import { appEnv } from "@/lib/env";
import type {
  CommunityArgument,
  CommunityConclusionPosition,
  CommunityDebate,
} from "@/lib/types";

interface VertexCandidateResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

export interface GeneratedCommunityConclusion {
  position: CommunityConclusionPosition;
  headline: string;
  summary: string;
  conditions: string[];
  caveats: string[];
}

const conclusionSchema = z.object({
  position: z.enum(["yes", "no", "mixed", "insufficient"]),
  headline: z.string().min(3).max(1000),
  summary: z.string().min(20).max(6000),
  conditions: z.array(z.string().min(3).max(1000)).max(6).default([]),
  caveats: z.array(z.string().min(3).max(1000)).max(5).default([]),
});

export function computeArgumentFingerprint(argumentsList: CommunityArgument[]) {
  const stableValue = [...argumentsList]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((argument) =>
      [
        argument.id,
        argument.side,
        argument.title,
        argument.body,
        argument.updatedAt,
        ...argument.sources.map((source) => `${source.label}:${source.url}`),
      ].join("|"),
    )
    .join("\n");
  return createHash("sha256").update(stableValue).digest("hex").slice(0, 24);
}

export async function generateCommunityConclusion(
  debate: Pick<CommunityDebate, "question" | "context" | "locale">,
  argumentsList: CommunityArgument[],
): Promise<GeneratedCommunityConclusion> {
  if (!appEnv.projectId) throw new Error("AI_NOT_CONFIGURED");
  if (argumentsList.length < 2) throw new Error("INSUFFICIENT_ARGUMENTS");

  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) throw new Error("AI_NOT_CONFIGURED");

  const language = debate.locale === "fr" ? "French" : "English";
  const argumentText = argumentsList
    .map((argument, index) => {
      const sources = argument.sources.length
        ? argument.sources
            .map((source) => `${source.label} (${source.url})`)
            .join("; ")
        : "No attached sources";
      return `${index + 1}. SIDE=${argument.side.toUpperCase()}\nTITLE=${argument.title}\nARGUMENT=${argument.body}\nSOURCES=${sources}`;
    })
    .join("\n\n");

  const prompt = `
You prepare a living AI synthesis for a private civic debate. Return strict JSON only, with no markdown.

Debate question: ${JSON.stringify(debate.question)}
Context: ${JSON.stringify(debate.context)}
Output language: ${language}

Return exactly:
{
  "position": "yes" | "no" | "mixed" | "insufficient",
  "headline": string,
  "summary": string,
  "conditions": string[],
  "caveats": string[]
}

Rules:
- Evaluate the quality and implications of the current arguments, not the number of arguments on each side.
- Reach the most defensible conclusion supported by this material. Do not force false neutrality.
- If the evidence supports the proposition only under important conditions, choose the supported side and state those conditions clearly.
- Distinguish a hypothetical condition from one the arguments indicate is already present in prevailing real-world systems. If regulation or public institutions already shape the system being evaluated, say so explicitly while noting that their quality varies.
- The headline must answer the question directly in one concise sentence.
- The summary should be 2 to 4 compact paragraphs explaining why.
- Conditions should identify what must be true for the conclusion to hold.
- Caveats should identify unresolved questions, weak evidence, or important limits.
- Do not invent facts or sources. Treat attached sources as claims to be verified, not automatic proof.
- This is a provisional synthesis, not an authoritative verdict.

CURRENT ARGUMENTS
${argumentText}
`;

  const response = await fetch(
    `https://aiplatform.googleapis.com/v1/projects/${appEnv.projectId}/locations/global/publishers/google/models/gemini-2.5-flash:generateContent`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.15,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            required: ["position", "headline", "summary", "conditions", "caveats"],
            properties: {
              position: {
                type: "STRING",
                enum: ["yes", "no", "mixed", "insufficient"],
              },
              headline: { type: "STRING" },
              summary: { type: "STRING" },
              conditions: {
                type: "ARRAY",
                maxItems: 6,
                items: { type: "STRING" },
              },
              caveats: {
                type: "ARRAY",
                maxItems: 5,
                items: { type: "STRING" },
              },
            },
          },
        },
      }),
    },
  );

  if (!response.ok) throw new Error("AI_CONCLUSION_FAILED");
  const payload = (await response.json()) as VertexCandidateResponse;
  const text =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";
  const parsed = conclusionSchema.safeParse(JSON.parse(text || "null"));
  if (!parsed.success) throw new Error("AI_CONCLUSION_FAILED");

  return {
    position: parsed.data.position,
    headline: parsed.data.headline.trim().replace(/\s+/g, " ").slice(0, 220),
    summary: parsed.data.summary.trim().slice(0, 3000),
    conditions: parsed.data.conditions
      .map((condition) => condition.trim().replace(/\s+/g, " ").slice(0, 320))
      .filter(Boolean)
      .slice(0, 5),
    caveats: parsed.data.caveats
      .map((caveat) => caveat.trim().replace(/\s+/g, " ").slice(0, 320))
      .filter(Boolean)
      .slice(0, 4),
  };
}
