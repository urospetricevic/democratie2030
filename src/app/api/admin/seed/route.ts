import { NextResponse } from "next/server";
import { appEnv, isFirestoreConfigured } from "@/lib/env";
import { seedDebate } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!appEnv.adminSeedEnabled) {
    return NextResponse.json({ error: "Seed route disabled." }, { status: 403 });
  }

  const providedSecret = request.headers.get("x-seed-secret");
  if (!appEnv.seedSecret || providedSecret !== appEnv.seedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isFirestoreConfigured()) {
    return NextResponse.json({ error: "Firestore not configured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const debate = await seedDebate(force);

  return NextResponse.json({
    ok: true,
    debateId: debate.id,
    seedSource: debate.seedSource,
  });
}
