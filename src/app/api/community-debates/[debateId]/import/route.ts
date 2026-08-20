import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { extractArgumentsFromUrl } from "@/lib/argument-import";
import { authOptions } from "@/lib/auth";
import {
  getOwnedCommunityDebate,
  importCommunityArguments,
} from "@/lib/repository";

export const runtime = "nodejs";

const sourceSchema = z.object({
  label: z.string().min(2).max(160),
  url: z.string().url().max(2048),
});

const draftSchema = z.object({
  side: z.enum(["yes", "no"]),
  title: z.string().min(3).max(140),
  body: z.string().min(8).max(2400),
  sources: z.array(sourceSchema).max(8),
});

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("preview"),
    url: z.string().min(8).max(2048),
  }),
  z.object({
    action: z.literal("commit"),
    arguments: z.array(draftSchema).min(1).max(20),
  }),
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ debateId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const payload = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_IMPORT" }, { status: 400 });
  }

  try {
    const { debateId } = await context.params;
    if (payload.data.action === "preview") {
      const debate = await getOwnedCommunityDebate(session.user.id, debateId);
      const preview = await extractArgumentsFromUrl(debate, payload.data.url);
      return NextResponse.json({ preview });
    }

    const imported = await importCommunityArguments(
      session.user.id,
      debateId,
      payload.data.arguments,
    );
    return NextResponse.json({ imported, importedCount: imported.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "DEBATE_NOT_FOUND"
        ? 404
        : message === "FORBIDDEN" || message === "ALIAS_REQUIRED"
          ? 403
          : [
                "INVALID_IMPORT",
                "INVALID_SOURCE",
                "INVALID_IMPORT_URL",
                "IMPORT_PRIVATE_URL",
                "IMPORT_TOO_LARGE",
                "IMPORT_UNSUPPORTED_CONTENT",
                "IMPORT_CONTENT_EMPTY",
                "UNBALANCED_IMPORT",
                "ARGUMENT_LIMIT",
              ].includes(message)
            ? 400
            : ["IMPORT_FETCH_FAILED", "IMPORT_REDIRECT_FAILED"].includes(message)
              ? 422
              : 500;
    if (status === 500) {
      console.error("Community argument import failed.", error);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
