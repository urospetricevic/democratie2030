import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { setUserAlias } from "@/lib/repository";

export const runtime = "nodejs";

const aliasSchema = z.object({
  alias: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = aliasSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid alias payload." }, { status: 400 });
  }

  try {
    const profile = await setUserAlias(
      session.user.id,
      session.user.email,
      payload.data.alias,
    );
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    if (message === "ALIAS_TAKEN") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message === "INVALID_ALIAS") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Alias update failed." }, { status: 500 });
  }
}
