import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createCommunityDebate } from "@/lib/repository";

export const runtime = "nodejs";

const debateSchema = z.object({
  question: z.string().min(1).max(180),
  context: z.string().max(1200),
  category: z.string().min(1).max(50),
  locale: z.enum(["fr", "en"]),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const payload = debateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_DEBATE" }, { status: 400 });
  }

  try {
    const debate = await createCommunityDebate(
      session.user.id,
      payload.data,
    );
    return NextResponse.json({ id: debate.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (["QUESTION_TOO_SHORT", "INVALID_DEBATE"].includes(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === "ALIAS_REQUIRED") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message === "COMMUNITY_DEBATES_UNAVAILABLE") {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    console.error("Community debate creation failed.", error);
    return NextResponse.json({ error: "CREATE_FAILED" }, { status: 500 });
  }
}
