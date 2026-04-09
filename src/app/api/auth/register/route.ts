import { NextResponse } from "next/server";
import { z } from "zod";
import { createPasswordAccount } from "@/lib/repository";

export const runtime = "nodejs";

const registerSchema = z
  .object({
    email: z.string().email(),
    alias: z.string().min(1),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    message: "PASSWORD_MISMATCH",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const payload = registerSchema.safeParse(await request.json());
  if (!payload.success) {
    const passwordMismatch = payload.error.issues.some(
      (issue) => issue.message === "PASSWORD_MISMATCH",
    );

    return NextResponse.json(
      {
        error: passwordMismatch ? "PASSWORD_MISMATCH" : "INVALID_REGISTRATION",
      },
      { status: 400 },
    );
  }

  try {
    const profile = await createPasswordAccount(
      payload.data.email,
      payload.data.password,
      payload.data.alias,
    );

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "EMAIL_TAKEN" || message === "ALIAS_TAKEN") {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (
      message === "INVALID_EMAIL" ||
      message === "INVALID_ALIAS" ||
      message === "INVALID_PASSWORD" ||
      message === "AUTH_UNAVAILABLE"
    ) {
      return NextResponse.json(
        { error: message },
        { status: message === "AUTH_UNAVAILABLE" ? 503 : 400 },
      );
    }

    return NextResponse.json({ error: "REGISTRATION_FAILED" }, { status: 500 });
  }
}
