import { z } from "zod";

// ============================================================================
// SHARED VALIDATION UTILITIES
// ============================================================================

export const jsonString = z.string().transform((val, ctx) => {
  try {
    return JSON.parse(val);
  } catch (e) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid JSON",
    });
    return z.NEVER;
  }
});
