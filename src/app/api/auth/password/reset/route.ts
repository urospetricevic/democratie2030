import { NextResponse } from "next/server";
import { z } from "zod";
import { completePasswordReset } from "@/lib/password-recovery";

export const runtime = "nodejs";

const resetPasswordSchema = z
  .object({
    requestId: z.string().length(64),
    token: z.string().min(32).max(160),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    message: "PASSWORD_MISMATCH",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const payload = resetPasswordSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    const passwordMismatch = payload.error.issues.some(
      (issue) => issue.message === "PASSWORD_MISMATCH",
    );
    return NextResponse.json(
      {
        error: passwordMismatch
          ? "PASSWORD_MISMATCH"
          : "INVALID_PASSWORD_RESET",
      },
      { status: 400 },
    );
  }

  try {
    const result = await completePasswordReset(
      payload.data.requestId,
      payload.data.token,
      payload.data.password,
    );

    if (result === "invalid") {
      return NextResponse.json(
        { error: "RESET_LINK_INVALID" },
        { status: 400 },
      );
    }
    if (result === "expired") {
      return NextResponse.json(
        { error: "RESET_LINK_EXPIRED" },
        { status: 410 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PASSWORD_RESET_FAILED";
    if (message === "INVALID_PASSWORD") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === "AUTH_UNAVAILABLE") {
      return NextResponse.json({ error: message }, { status: 503 });
    }

    console.error("Password reset failed.", error);
    return NextResponse.json(
      { error: "PASSWORD_RESET_FAILED" },
      { status: 500 },
    );
  }
}
