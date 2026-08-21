import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getCommunityFallbackImageFilename } from "@/lib/community-image";
import { getCommunityInvitePreviewCopy } from "@/lib/community-invite-preview";
import { isLocale } from "@/lib/i18n";
import {
  getCommunityDebateAccess,
  getCommunityDebateImage,
} from "@/lib/repository";
import type { Locale } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ debateId: string }> },
) {
  const { debateId } = await context.params;
  const inviteCode = request.nextUrl.searchParams.get("invite") ?? "";
  const rawLocale = request.nextUrl.searchParams.get("locale") ?? "fr";
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "fr";
  const access = await getCommunityDebateAccess(debateId, null, inviteCode);

  if (access.status !== "invite") {
    return new Response("Not found", { status: 404 });
  }

  const debate = access.debate;
  const copy = getCommunityInvitePreviewCopy(locale, debate);
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
  const questionSize =
    debate.question.length > 125 ? 42 : debate.question.length > 80 ? 49 : 57;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#071226",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
          position: "relative",
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
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "52%",
            height: 8,
            background: "#1758e8",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "48%",
            height: 8,
            background: "#e43034",
          }}
        />

        <div
          style={{
            height: 244,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "40px 54px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 58,
                height: 58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                background: "rgba(7, 18, 38, 0.94)",
                fontSize: 29,
                fontWeight: 800,
              }}
            >
              D
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <strong
                style={{
                  padding: "8px 13px 7px",
                  borderRadius: 10,
                  background: "rgba(7, 18, 38, 0.94)",
                  fontSize: 28,
                  letterSpacing: "-0.03em",
                }}
              >
                DBYLE
              </strong>
            </div>
          </div>
          <span
            style={{
              padding: "11px 15px 10px",
              borderRadius: 999,
              background: "rgba(7, 18, 38, 0.92)",
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            {copy.eyebrow}
          </span>
        </div>

        <div
          style={{
            height: 386,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 17,
            padding: "32px 56px 37px",
            background: "rgba(7, 18, 38, 0.96)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 17 }}>
            <span
              style={{
                color: "#a9b6cf",
                fontSize: 18,
              }}
            >
              {debate.category} · {copy.invitedBy}
            </span>
            <div
              style={{
                display: "flex",
                maxWidth: 1080,
                fontSize: questionSize,
                lineHeight: 1.05,
                letterSpacing: "-0.045em",
                fontWeight: 700,
              }}
            >
              {debate.question}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#a9b6cf", fontSize: 16 }}>
              Don&apos;t believe your lying eyes.
            </span>
            <span style={{ color: "#ffffff", fontSize: 20, fontWeight: 700 }}>
              {copy.callToAction}
            </span>
          </div>
        </div>
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
