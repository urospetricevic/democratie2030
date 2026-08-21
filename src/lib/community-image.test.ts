import { describe, expect, it } from "vitest";
import { buildCommunityImagePrompt } from "./community-image";

describe("buildCommunityImagePrompt", () => {
  it("grounds the abstract artwork in the debate without asking for text", () => {
    const prompt = buildCommunityImagePrompt({
      question: "Should cities ban private cars downtown?",
      context: "Consider access, commerce, safety, and emissions.",
      category: "Cities",
      locale: "en",
    });

    expect(prompt).toContain("Should cities ban private cars downtown?");
    expect(prompt).toContain("Consider access, commerce, safety, and emissions.");
    expect(prompt).toContain("three to five large painted shapes");
    expect(prompt).toContain("unique to this debate");
    expect(prompt).toContain("not generative digital art");
    expect(prompt).toContain("16:9");
  });
});
