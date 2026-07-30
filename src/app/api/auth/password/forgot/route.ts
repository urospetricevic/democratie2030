import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/password-recovery";

export const runtime = "nodejs";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["fr", "en"]),
});

export async function POST(request: Request) {
  const payload = forgotPasswordSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
  }

  try {
    const result = await requestPasswordReset(
      payload.data.email,
      payload.data.locale,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PASSWORD_RESET_FAILED";

    if (message === "PASSWORD_RESET_UNAVAILABLE") {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    if (message === "INVALID_EMAIL") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === "AUTH_UNAVAILABLE") {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    console.error("Password reset request failed.", error);
    return NextResponse.json(
      { error: "PASSWORD_RESET_FAILED" },
      { status: 502 },
    );
  }
}
