import { describe, expect, it } from "vitest";
import { formatCredits, parseDecimal, toDecimalString } from "@/lib/credits";

describe("credits helpers (Part 8)", () => {
  it("parses decimal strings into numbers", () => {
    expect(parseDecimal("1.5")).toBeCloseTo(1.5);
    expect(parseDecimal(null)).toBe(0);
    expect(parseDecimal(undefined)).toBe(0);
    expect(parseDecimal("abc")).toBe(0);
  });

  it("formats credits", () => {
    expect(formatCredits("5")).toContain("5");
    expect(formatCredits(0)).toContain("0");
  });

  it("formats to a fixed number of decimal places", () => {
    expect(toDecimalString(1.23456, 3)).toBe("1.235");
  });
});
