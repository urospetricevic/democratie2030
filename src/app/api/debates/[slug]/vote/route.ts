import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { DEBATE_SLUG } from "@/lib/types";
import { submitVote } from "@/lib/repository";

export const runtime = "nodejs";

const voteSchema = z.object({
  side: z.enum(["yes", "no"]),
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

  const payload = voteSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid vote payload." }, { status: 400 });
  }

  await submitVote(session.user.id, slug, payload.data.side);
  return NextResponse.json({ ok: true });
}
