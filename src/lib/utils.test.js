/* cn() helper tests (src/lib/utils.js) — clsx composition plus
   tailwind-merge conflict resolution, as used by the Aceternity UI
   components. */
import { describe, it, expect } from "vitest";
import { cn } from "./utils.js";

describe("cn", () => {
  it("joins class names with single spaces", () => {
    expect(cn("alpha", "beta")).toBe("alpha beta");
  });
  it("ignores falsy conditional classes (clsx behaviour)", () => {
    expect(cn("alpha", false, undefined, null, "", "beta")).toBe("alpha beta");
    const maybe = (on) => on && "nope";
    expect(cn("alpha", maybe(false), "beta")).toBe("alpha beta");
    expect(cn("alpha", maybe(true), "beta")).toBe("alpha nope beta");
  });
  it("supports clsx array and object syntax", () => {
    expect(cn(["alpha", "beta"], { gamma: true, delta: false })).toBe("alpha beta gamma");
  });
  it("resolves conflicting Tailwind utilities, last one wins (tailwind-merge)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm text-ink", "text-lg")).toBe("text-ink text-lg");
  });
  it("returns an empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
