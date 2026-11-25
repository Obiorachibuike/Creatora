import { describe, expect, it } from "vitest";
import { getProvider, getProviders } from "@/lib/ai/registry";
import { mockProvider } from "@/lib/ai/providers";


describe("provider registry (Part 5)", () => {
  it("returns the offline mock provider without a database", async () => {
    expect(mockProvider.slug).toBe("mock");
    expect(mockProvider.capabilities).toContain("text-to-image");
  });

  it("generates placeholder media through the mock provider", async () => {
    const out = await mockProvider.generateImage({ prompt: "a cat on a wall" });
    expect(out.url).toContain("mock");
    expect(out.provider).toBe("mock");
  });

  it("lists providers, falling back to the mock provider without a database", async () => {
    const providers = await getProviders();
    expect(providers.some((p) => p.slug === "mock")).toBe(true);
  });

  it("finds providers by slug when available", async () => {
    const provider = await getProvider("mock");
    expect(provider?.slug).toBe("mock");
  });
});
