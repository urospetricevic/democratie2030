import { describe, expect, it } from "vitest";
import {
  buildResetUrl,
  createResetRequestId,
  hashResetToken,
} from "./password-recovery";

describe("password recovery tokens", () => {
  it("creates stable, secret-dependent request identifiers", () => {
    const first = createResetRequestId("citizen@example.com", "secret-one");
    const same = createResetRequestId("citizen@example.com", "secret-one");
    const different = createResetRequestId(
      "citizen@example.com",
      "secret-two",
    );

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toBe(same);
    expect(first).not.toBe(different);
  });

  it("hashes reset secrets before persistence", () => {
    expect(hashResetToken("one-time-secret")).toMatch(/^[a-f0-9]{64}$/);
    expect(hashResetToken("one-time-secret")).not.toContain("one-time-secret");
  });

  it("builds a localized first-party reset URL", () => {
    const url = new URL(
      buildResetUrl(
        "https://dbyle.com",
        "fr",
        "a".repeat(64),
        "secret-token",
      ),
    );

    expect(url.origin).toBe("https://dbyle.com");
    expect(url.pathname).toBe("/fr/reset-password");
    expect(url.searchParams.get("request")).toBe("a".repeat(64));
    expect(url.searchParams.get("token")).toBe("secret-token");
  });
});
