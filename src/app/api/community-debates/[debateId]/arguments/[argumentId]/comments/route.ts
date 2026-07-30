import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createArgumentComment } from "@/lib/repository";

export const runtime = "nodejs";

const commentSchema = z.object({
  body: z.string().min(1).max(1200),
});

export async function POST(
  request: Request,
  context: {
    params: Promise<{ debateId: string; argumentId: string }>;
  },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const payload = commentSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_COMMENT" }, { status: 400 });
  }

  try {
    const { debateId, argumentId } = await context.params;
    const comment = await createArgumentComment(
      session.user.id,
      debateId,
      argumentId,
      payload.data.body,
    );
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "ARGUMENT_NOT_FOUND"
        ? 404
        : message === "FORBIDDEN" || message === "ALIAS_REQUIRED"
          ? 403
          : message === "COMMENT_TOO_SHORT"
            ? 400
            : 500;
    if (status === 500) {
      console.error("Argument comment creation failed.", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
