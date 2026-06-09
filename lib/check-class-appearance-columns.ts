/**
 * check-class-appearance-columns.ts
 * Probes whether class appearance columns exist in Supabase.
 */

import { createServiceClient } from "@/lib/supabase/server";

export const CLASS_APPEARANCE_SETUP_SQL = `ALTER TABLE classes ADD COLUMN IF NOT EXISTS card_image_url text;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS card_color_scheme text DEFAULT 'default';`;

/**
 * Returns true when card_image_url / card_color_scheme exist on classes.
 */
export async function classAppearanceColumnsReady(): Promise<boolean> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("classes").select("card_image_url").limit(1);
  if (!error) return true;
  const message = error.message ?? "";
  return !(
    message.includes("card_image_url") ||
    message.includes("card_color_scheme") ||
    error.code === "42703"
  );
}
