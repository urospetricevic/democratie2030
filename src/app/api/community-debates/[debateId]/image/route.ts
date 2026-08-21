import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { generateCommunityDebateImage } from "@/lib/community-image";
import {
  getCommunityDebateAccess,
  getCommunityDebateImage,
  getOwnedCommunityDebate,
  saveCommunityDebateImage,
} from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fallbackImage() {
  return readFile(join(process.cwd(), "public", "debate-images", "dbyle-abstract-fallback.jpg"));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ debateId: string }> },
) {
  const { debateId } = await params;
  const session = await getServerSession(authOptions);
  const inviteCode = new URL(request.url).searchParams.get("invite");
  const access = await getCommunityDebateAccess(
    debateId,
    session?.user?.id ?? null,
    inviteCode,
  );
  if (access.status === "forbidden" || access.status === "not-found") {
    return new NextResponse(null, { status: 404 });
  }

  const image = await getCommunityDebateImage(debateId);
  const body = image
    ? Buffer.from(image.bytesBase64Encoded, "base64")
    : await fallbackImage();
  return new NextResponse(body, {
    headers: {
      "Content-Type": image?.mimeType ?? "image/jpeg",
      "Cache-Control": image
        ? "private, max-age=86400, stale-while-revalidate=604800"
        : "private, max-age=300",
    },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ debateId: string }> },
) {
  const { debateId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }
  try {
    const debate = await getOwnedCommunityDebate(session.user.id, debateId);
    const image = await generateCommunityDebateImage(debate);
    await saveCommunityDebateImage(image);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Community debate image regeneration failed.", error);
    return NextResponse.json({ error: "IMAGE_GENERATION_FAILED" }, { status: 500 });
  }
}
