import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { generateCommunityConclusion } from "@/lib/community-conclusion";
import {
  getOwnedCommunityDebateWithArguments,
  saveCommunityDebateConclusion,
} from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ debateId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  try {
    const { debateId } = await context.params;
    const data = await getOwnedCommunityDebateWithArguments(
      session.user.id,
      debateId,
    );
    const generated = await generateCommunityConclusion(
      data.debate,
      data.arguments,
    );
    const conclusion = await saveCommunityDebateConclusion(
      session.user.id,
      debateId,
      data.arguments,
      generated,
    );
    return NextResponse.json({ conclusion });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "DEBATE_NOT_FOUND"
        ? 404
        : message === "FORBIDDEN"
          ? 403
          : message === "INSUFFICIENT_ARGUMENTS"
            ? 400
            : 500;
    if (status === 500) {
      console.error("Community debate conclusion failed.", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
