import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { acceptCommunityInvite } from "@/lib/repository";

export const runtime = "nodejs";

const inviteSchema = z.object({
  inviteCode: z.string().min(20).max(80),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ debateId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const payload = inviteSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_INVITE" }, { status: 400 });
  }

  try {
    const { debateId } = await context.params;
    await acceptCommunityInvite(
      session.user.id,
      debateId,
      payload.data.inviteCode,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "DEBATE_NOT_FOUND"
        ? 404
        : ["INVALID_INVITE", "ALIAS_REQUIRED"].includes(message)
          ? 403
          : 500;
    if (status === 500) {
      console.error("Community debate invitation failed.", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
