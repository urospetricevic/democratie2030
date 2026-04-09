import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createComment } from "@/lib/repository";
import { DEBATE_SLUG } from "@/lib/types";

export const runtime = "nodejs";

const commentSchema = z.object({
  body: z.string().min(1),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (slug !== DEBATE_SLUG) {
    return NextResponse.json({ error: "Debate not found." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = commentSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid comment payload." }, { status: 400 });
  }

  try {
    await createComment(session.user.id, slug, payload.data.body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "ALIAS_REQUIRED") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "COMMENT_TOO_SHORT") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Comment creation failed." }, { status: 500 });
  }
}
