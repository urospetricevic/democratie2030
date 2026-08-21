import { GoogleAuth } from "google-auth-library";
import { appEnv } from "@/lib/env";
import type { CommunityDebate, CommunityDebateImage } from "@/lib/types";

export const COMMUNITY_IMAGE_MODEL = "imagen-4.0-generate-001";
const MAX_FIRESTORE_IMAGE_BASE64_BYTES = 900_000;

interface ImagenResponse {
  predictions?: Array<{
    bytesBase64Encoded?: string;
    mimeType?: string;
    prompt?: string;
  }>;
}

export function buildCommunityImagePrompt(
  debate: Pick<CommunityDebate, "question" | "context" | "category" | "locale">,
) {
  const context = debate.context.trim() || "No additional context was supplied.";
  return `
Create a sophisticated abstract editorial cover for a private civic debate.

Debate question: ${debate.question}
Debate category: ${debate.category}
Debate context: ${context}
Language of the debate: ${debate.locale === "fr" ? "French" : "English"}

Interpret the tension between the competing perspectives through abstract geometry, layered translucent forms, rhythm, balance, friction, and negative space. Do not take a side and do not illustrate a conclusion.

Visual direction: premium editorial generative art; geometric-organic abstraction; subtle depth and fine grain; modern civic-tech identity; intelligent, balanced, contemplative; deep midnight navy, DBYLE cobalt blue, warm off-white, and restrained signal-red accents. Wide 16:9 landscape with crop-safe edges.

Do not include words, letters, logos, flags, faces, people, party imagery, watermarks, literal charts, or UI elements. Avoid a generic stock 3D-render look.
  `.trim();
}

export async function generateCommunityDebateImage(
  debate: Pick<CommunityDebate, "id" | "question" | "context" | "category" | "locale">,
): Promise<CommunityDebateImage> {
  if (!appEnv.projectId) {
    throw new Error("Missing project id for image generation.");
  }

  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) {
    throw new Error("Unable to obtain Google Cloud access token.");
  }

  const prompt = buildCommunityImagePrompt(debate);
  const response = await fetch(
    `https://${appEnv.vertexImageLocation}-aiplatform.googleapis.com/v1/projects/${appEnv.projectId}/locations/${appEnv.vertexImageLocation}/publishers/google/models/${COMMUNITY_IMAGE_MODEL}:predict`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9",
          enhancePrompt: true,
          addWatermark: true,
          personGeneration: "dont_allow",
          safetySetting: "block_medium_and_above",
          outputOptions: {
            mimeType: "image/jpeg",
            compressionQuality: 72,
          },
        },
      }),
      signal: AbortSignal.timeout(55_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Imagen request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as ImagenResponse;
  const prediction = payload.predictions?.[0];
  const bytesBase64Encoded = prediction?.bytesBase64Encoded ?? "";
  const mimeType = prediction?.mimeType;
  if (
    !bytesBase64Encoded ||
    (mimeType !== "image/jpeg" && mimeType !== "image/png")
  ) {
    throw new Error("Imagen returned no usable image.");
  }
  if (Buffer.byteLength(bytesBase64Encoded, "utf8") > MAX_FIRESTORE_IMAGE_BASE64_BYTES) {
    throw new Error("Generated image is too large to store safely.");
  }

  const now = new Date().toISOString();
  return {
    id: debate.id,
    debateId: debate.id,
    mimeType,
    bytesBase64Encoded,
    prompt: prediction?.prompt ?? prompt,
    model: COMMUNITY_IMAGE_MODEL,
    generatedBy: "vertex",
    createdAt: now,
    updatedAt: now,
  };
}
