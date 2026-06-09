/**
 * check-class-appearance-columns.ts
 * Probes whether class appearance columns are available via the Supabase API.
 */

import { createServiceClient } from "@/lib/supabase/server";

export const CLASS_APPEARANCE_SETUP_SQL = `ALTER TABLE classes ADD COLUMN IF NOT EXISTS card_image_url text;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS card_color_scheme text DEFAULT 'default';
NOTIFY pgrst, 'reload schema';`;

export type ClassAppearanceStatus = "ready" | "missing_columns" | "stale_schema";

function isSchemaCacheError(message: string, code: string | undefined): boolean {
  return (
    code === "PGRST204" ||
    message.includes("schema cache") ||
    message.includes("Could not find") && message.includes("column")
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

/** @deprecated Use getClassAppearanceStatus */
export async function classAppearanceColumnsReady(): Promise<boolean> {
  return (await getClassAppearanceStatus()) === "ready";
}
