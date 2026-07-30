import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createCommunityArgument } from "@/lib/repository";

export const runtime = "nodejs";

const argumentSchema = z.object({
  side: z.enum(["yes", "no"]),
  title: z.string().min(1).max(140),
  body: z.string().min(1).max(2400),
  sourceLabel: z.string().max(160).optional(),
  sourceUrl: z.string().max(2048).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ debateId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const payload = argumentSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_ARGUMENT" }, { status: 400 });
  }

  try {
    const { debateId } = await context.params;
    const argument = await createCommunityArgument(
      session.user.id,
      debateId,
      payload.data,
    );
    return NextResponse.json({ argument }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "DEBATE_NOT_FOUND"
        ? 404
        : message === "FORBIDDEN" || message === "ALIAS_REQUIRED"
          ? 403
          : ["INVALID_ARGUMENT", "INVALID_SIDE", "INVALID_SOURCE"].includes(
                message,
              )
            ? 400
            : 500;
    if (status === 500) {
      console.error("Community argument creation failed.", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
