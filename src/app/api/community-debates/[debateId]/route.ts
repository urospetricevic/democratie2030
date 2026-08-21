import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { updateCommunityDebateQuestion } from "@/lib/repository";

export const runtime = "nodejs";

const updateDebateSchema = z.object({
  question: z.string().min(1).max(180),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ debateId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const payload = updateDebateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_DEBATE" }, { status: 400 });
  }

  try {
    const { debateId } = await context.params;
    const result = await updateCommunityDebateQuestion(
      session.user.id,
      debateId,
      payload.data,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "DEBATE_NOT_FOUND"
        ? 404
        : message === "FORBIDDEN"
          ? 403
          : ["QUESTION_TOO_SHORT", "INVALID_DEBATE"].includes(message)
            ? 400
            : 500;
    if (status === 500) {
      console.error("Community debate update failed.", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
