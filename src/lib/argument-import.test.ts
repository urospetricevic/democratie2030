import { describe, expect, it } from "vitest";
import {
  extractTextFromHtml,
  isPublicIp,
  normalizeImportUrl,
} from "@/lib/argument-import";

describe("argument link importing", () => {
  it("accepts web URLs and removes fragments", () => {
    expect(normalizeImportUrl(" https://example.com/a#section ")).toBe(
      "https://example.com/a",
    );
  });

  it("rejects non-web and credential-bearing URLs", () => {
    expect(() => normalizeImportUrl("file:///etc/passwd")).toThrow(
      "INVALID_IMPORT_URL",
    );
    expect(() => normalizeImportUrl("https://user:secret@example.com")).toThrow(
      "INVALID_IMPORT_URL",
    );
  });

  it("blocks private, loopback, link-local, and reserved addresses", () => {
    expect(isPublicIp("127.0.0.1")).toBe(false);
    expect(isPublicIp("10.1.2.3")).toBe(false);
    expect(isPublicIp("169.254.169.254")).toBe(false);
    expect(isPublicIp("192.168.1.4")).toBe(false);
    expect(isPublicIp("::1")).toBe(false);
    expect(isPublicIp("fd00::1")).toBe(false);
    expect(isPublicIp("8.8.8.8")).toBe(true);
    expect(isPublicIp("2606:4700:4700::1111")).toBe(true);
  });

  it("extracts visible and serialized discussion text", () => {
    const html = `
      <html><body><h1>Public debate</h1>
      <script>push("A serialized argument with enough useful words to import.")</script>
      </body></html>`;
    const text = extractTextFromHtml(html);
    expect(text).toContain("Public debate");
    expect(text).toContain("A serialized argument with enough useful words");
  });
});
