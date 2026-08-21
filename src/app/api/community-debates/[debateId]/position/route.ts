import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { updateCommunityDebatePosition } from "@/lib/repository";

export const runtime = "nodejs";

const positionSchema = z.object({
  choice: z.enum(["yes", "no", "undecided", "skip"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ debateId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const payload = positionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_POSITION" }, { status: 400 });
  }

  try {
    const { debateId } = await context.params;
    const result = await updateCommunityDebatePosition(
      session.user.id,
      debateId,
      payload.data.choice,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "DEBATE_NOT_FOUND"
        ? 404
        : message === "FORBIDDEN"
          ? 403
          : ["INVALID_POSITION", "ALIAS_REQUIRED"].includes(message)
            ? 400
            : 500;
    if (status === 500) {
      console.error("Community debate position update failed.", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
