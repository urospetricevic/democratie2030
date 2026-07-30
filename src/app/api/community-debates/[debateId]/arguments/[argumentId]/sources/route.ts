import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { addCommunityArgumentSource } from "@/lib/repository";

export const runtime = "nodejs";

const sourceSchema = z.object({
  label: z.string().min(1).max(160),
  url: z.string().min(1).max(2048),
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

  const payload = sourceSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_SOURCE" }, { status: 400 });
  }

  try {
    const { debateId, argumentId } = await context.params;
    const source = await addCommunityArgumentSource(
      session.user.id,
      debateId,
      argumentId,
      payload.data,
    );
    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "ARGUMENT_NOT_FOUND"
        ? 404
        : message === "FORBIDDEN" || message === "ALIAS_REQUIRED"
          ? 403
          : message === "INVALID_SOURCE" || message === "SOURCE_LIMIT"
            ? 400
            : 500;
    if (status === 500) {
      console.error("Community source creation failed.", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
