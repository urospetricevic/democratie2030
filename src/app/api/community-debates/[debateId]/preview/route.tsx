import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getCommunityInvitePreviewCopy } from "@/lib/community-invite-preview";
import { isLocale } from "@/lib/i18n";
import { getCommunityDebateAccess } from "@/lib/repository";
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
  const questionSize =
    debate.question.length > 125 ? 44 : debate.question.length > 80 ? 52 : 62;

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
          padding: "62px 72px 56px",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 58,
                height: 58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                background: "#1758e8",
                fontSize: 29,
                fontWeight: 800,
              }}
            >
              D
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <strong style={{ fontSize: 31, letterSpacing: "-0.03em" }}>DBYLE</strong>
              <span style={{ color: "#a9b6cf", fontSize: 16 }}>
                Don&apos;t believe your lying eyes
              </span>
            </div>
          </div>
          <span
            style={{
              color: "#a9c2ff",
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            {copy.eyebrow}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 25, maxWidth: 1030 }}>
          <span style={{ color: "#a9b6cf", fontSize: 20 }}>
            {debate.category} · {copy.invitedBy}
          </span>
          <div
            style={{
              display: "flex",
              fontSize: questionSize,
              lineHeight: 1.08,
              letterSpacing: "-0.045em",
              fontWeight: 700,
            }}
          >
            {debate.question}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: "#1758e8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
              }}
            >
              ✓
            </span>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: "#e43034",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
              }}
            >
              ×
            </span>
          </div>
          <span style={{ color: "#ffffff", fontSize: 21, fontWeight: 700 }}>
            {copy.callToAction}
          </span>
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
