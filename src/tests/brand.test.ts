import { describe, expect, it } from "vitest";
import { brand, brandLight } from "@/lib/brand";

describe("brand identity (Part 1)", () => {
  it("uses the official Sunset Orange as the primary", () => {
    expect(brand.primary).toBe("#FF6B35");
    expect(brand.primaryHover).toBe("#FF8557");
    expect(brand.primaryHighlight).toBe("#FFAA70");
  });

  it("never uses neon green as a brand accent", () => {
    const all = [brand.primary, brand.primaryHover, brand.primaryHighlight, brand.background, brand.foreground].join(" ");
    expect(all).not.toContain("#0EF30A");
  });

  it("declares display typography (Sora/DM Sans/mono)", () => {
    expect(brand.displayFont).toContain("Sora");
    expect(brand.sansFont).toContain("DM Sans");
    expect(brand.monoFont).toBeTruthy();
  });

  it("exposes light theme tokens without copying the dark palette", () => {
    expect(brandLight.background).not.toBe(brand.background);
    expect(brandLight.surface).not.toBe(brand.surface);
  });
});
