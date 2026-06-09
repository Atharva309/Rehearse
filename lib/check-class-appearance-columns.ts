/**
 * check-class-appearance-columns.ts
 * Server-only probe for class appearance columns via Supabase API.
 */

import type { ClassAppearanceStatus } from "@/lib/class-appearance";
import { createServiceClient } from "@/lib/supabase/server";

function isSchemaCacheError(message: string, code: string | undefined): boolean {
  return (
    code === "PGRST204" ||
    message.includes("schema cache") ||
    (message.includes("Could not find") && message.includes("column"))
  );
}

function isMissingColumnError(message: string, code: string | undefined): boolean {
  return (
    message.includes("card_image_url") ||
    message.includes("card_color_scheme") ||
    code === "42703"
  );
}

/**
 * Checks if appearance columns work through PostgREST (not just in the SQL table view).
 */
export async function getClassAppearanceStatus(): Promise<ClassAppearanceStatus> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("classes")
    .select("card_image_url, card_color_scheme")
    .limit(1);

  if (!error) {
    return "ready";
  }

  const message = error.message ?? "";
  const code = error.code;

  if (isSchemaCacheError(message, code)) {
    return "stale_schema";
  }
  if (isMissingColumnError(message, code)) {
    return "missing_columns";
  }

  return "ready";
}
