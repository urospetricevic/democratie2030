import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getCommunityFallbackImageFilename } from "@/lib/community-image";
import {
  getCommunityDebateAccess,
  getCommunityDebateImage,
} from "@/lib/repository";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ debateId: string }> },
) {
  const { debateId } = await context.params;
  const inviteCode = request.nextUrl.searchParams.get("invite") ?? "";
  const access = await getCommunityDebateAccess(debateId, null, inviteCode);

  if (access.status !== "invite") {
    return new Response("Not found", { status: 404 });
  }

  const debate = access.debate;
  const generatedImage = await getCommunityDebateImage(debateId);
  const artwork = generatedImage
    ? `data:${generatedImage.mimeType};base64,${generatedImage.bytesBase64Encoded}`
    : `data:image/jpeg;base64,${(
        await readFile(
          join(
            process.cwd(),
            "public",
            "debate-images",
            getCommunityFallbackImageFilename(debate.question),
          ),
        )
      ).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#071226",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork}
          alt=""
          width={1200}
          height={630}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "private, no-cache, no-store, max-age=0",
      },
    },
  );
}
