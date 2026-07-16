/**
 * generate-prospect-directory.ts
 * Reusable prospect-directory seeder — all simulation content lives in config files.
 * Runnable via: npx tsx scripts/generate-prospect-directory.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface DirectoryEntry {
  companyName: string;
  contactName: string;
  contactTitle: string;
  industry: string;
  sizeLocations: string;
  signalHint?: string;
  hiddenClaim?: string;
}

/** Hand-authored decoys must declare competitive axes (validated before generation). */
export interface CraftedDecoyEntry extends DirectoryEntry {
  strongerAxis: string;
  weakerAxis: string;
}

export interface DirectoryConfig {
  simulationId: string;
  target: DirectoryEntry;
  craftedDecoys: CraftedDecoyEntry[];
  fillerCount: number;
  industryPool: string[];
  namePrefixPool: string[];
  suffixByIndustry: Record<string, string[]>;
  contactTitlePool: string[];
  contactLastNamePool: string[];
  /** Ordered low → high seniority; used to cap filler contact titles below the target. */
  contactTitleSeniorityRank: string[];
}

type EntryType = "target" | "crafted_decoy" | "filler";

type DirectoryRowInsert = {
  simulation_id: string;
  company_name: string;
  contact_name: string;
  contact_title: string;
  industry: string;
  size_locations: string;
  signal_hint: string;
  hidden_claim: string | null;
  entry_type: EntryType;
  is_active: boolean;
};

const FILLER_SIZE_OPTIONS = [
  "1 location",
  "2 locations",
  "3 locations",
  "1 clinic",
  "2 clinics",
  "3 clinics",
  "1 studio",
];

const FILLER_SIGNAL_HINTS = [
  "Steady operations with no notable public updates recently.",
  "Maintains a typical appointment volume for its market.",
  "No major staffing or expansion news reported lately.",
  "Continues routine patient scheduling through existing processes.",
  "Limited public information on recent operational changes.",
];

const FILLER_GUARD_RETRY_MAX = 10;

/**
 * Picks a random element from a non-empty array.
 */
function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

/**
 * Parses the leading integer from a free-text size string (e.g. "8 locations" → 8).
 */
function parseLeadingIntegerFromSize(sizeLocations: string): number | null {
  const match = sizeLocations.trim().match(/^(\d+)/);
  if (!match) {
    return null;
  }
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

/**
 * Seniority index in rank list (low → high), or null if title is unknown.
 */
function getSeniorityRank(title: string, rankList: readonly string[]): number | null {
  const idx = rankList.indexOf(title.trim());
  return idx === -1 ? null : idx;
}

/**
 * Picks a filler size strictly below the target's parsed size when cap is known.
 */
function pickFillerSizeLocations(targetSizeNum: number | null): string {
  if (targetSizeNum === null) {
    return pickRandom(FILLER_SIZE_OPTIONS);
  }

  const strictlyBelow = (candidate: string): boolean => {
    const n = parseLeadingIntegerFromSize(candidate);
    return n !== null && n < targetSizeNum;
  };

  const validPool = FILLER_SIZE_OPTIONS.filter(strictlyBelow);

  for (let attempt = 0; attempt < FILLER_GUARD_RETRY_MAX; attempt += 1) {
    const candidate =
      validPool.length > 0 ? pickRandom(validPool) : pickRandom(FILLER_SIZE_OPTIONS);
    if (strictlyBelow(candidate)) {
      return candidate;
    }
  }

  const fallbackNum = Math.max(1, targetSizeNum - 1);
  return `${fallbackNum} locations`;
}

/**
 * Picks a filler contact title strictly below the target's seniority when ranks are known.
 */
function pickFillerContactTitle(config: DirectoryConfig): string {
  const { contactTitlePool, contactTitleSeniorityRank, target } = config;
  const targetRank = getSeniorityRank(target.contactTitle, contactTitleSeniorityRank);

  if (targetRank === null) {
    console.warn(
      `[generate-prospect-directory] Target contact title "${target.contactTitle}" not in contactTitleSeniorityRank; skipping filler seniority cap.`
    );
    return pickRandom(contactTitlePool);
  }

  const validTitles = contactTitlePool.filter((title) => {
    const rank = getSeniorityRank(title, contactTitleSeniorityRank);
    return rank !== null && rank < targetRank;
  });

  if (validTitles.length === 0) {
    console.warn(
      `[generate-prospect-directory] contactTitlePool has no title below target seniority ("${target.contactTitle}"); add pool options below the target rank. Skipping seniority cap for filler titles.`
    );
    return pickRandom(contactTitlePool);
  }

  for (let attempt = 0; attempt < FILLER_GUARD_RETRY_MAX; attempt += 1) {
    const candidate = pickRandom(validTitles);
    const candidateRank = getSeniorityRank(candidate, contactTitleSeniorityRank);
    if (candidateRank === null) {
      console.warn(
        `[generate-prospect-directory] Filler title "${candidate}" not in contactTitleSeniorityRank; skipping seniority check for this entry.`
      );
      return candidate;
    }
    if (candidateRank < targetRank) {
      return candidate;
    }
  }

  return pickRandom(validTitles);
}

/**
 * Ensures every crafted decoy declares strongerAxis and weakerAxis (hard-stop).
 */
export function validateCraftedDecoys(decoys: CraftedDecoyEntry[]): void {
  for (const decoy of decoys) {
    const label = decoy.companyName.trim() || "(unnamed crafted decoy)";
    if (!decoy.strongerAxis?.trim()) {
      throw new Error(`Crafted decoy "${label}" is missing required field strongerAxis.`);
    }
    if (!decoy.weakerAxis?.trim()) {
      throw new Error(`Crafted decoy "${label}" is missing required field weakerAxis.`);
    }
  }
}

/**
 * Maps a config entry into a crm_prospect_directory insert row.
 */
function toInsertRow(
  simulationId: string,
  entry: DirectoryEntry,
  entryType: EntryType
): DirectoryRowInsert {
  return {
    simulation_id: simulationId,
    company_name: entry.companyName,
    contact_name: entry.contactName,
    contact_title: entry.contactTitle,
    industry: entry.industry,
    size_locations: entry.sizeLocations,
    signal_hint: entry.signalHint?.trim() ?? "",
    hidden_claim: entry.hiddenClaim?.trim() ? entry.hiddenClaim.trim() : null,
    entry_type: entryType,
    is_active: true,
  };
}

/**
 * Builds filler directory entries from pools in the config.
 */
function buildFillerEntries(config: DirectoryConfig): DirectoryEntry[] {
  const targetSizeNum = parseLeadingIntegerFromSize(config.target.sizeLocations);
  if (targetSizeNum === null) {
    console.warn(
      "[generate-prospect-directory] Could not parse target sizeLocations; filler size cap skipped for this run."
    );
  }

  const fillers: DirectoryEntry[] = [];
  const usedCompanyNames = new Set<string>();
  const maxAttempts = config.fillerCount * 20;
  let attempts = 0;

  while (fillers.length < config.fillerCount && attempts < maxAttempts) {
    attempts += 1;
    const industry = pickRandom(config.industryPool);
    const suffixes = config.suffixByIndustry[industry];
    if (!suffixes || suffixes.length === 0) {
      continue;
    }
    const prefix = pickRandom(config.namePrefixPool);
    const suffix = pickRandom(suffixes);
    const companyName = `${prefix} ${suffix}`;
    if (usedCompanyNames.has(companyName)) {
      continue;
    }
    usedCompanyNames.add(companyName);

    const lastName = pickRandom(config.contactLastNamePool);
    const initial = String.fromCharCode(65 + Math.floor(Math.random() * 26));

    fillers.push({
      companyName,
      contactName: `${initial}. ${lastName}`,
      contactTitle: pickFillerContactTitle(config),
      industry,
      sizeLocations: pickFillerSizeLocations(targetSizeNum),
      signalHint: pickRandom(FILLER_SIGNAL_HINTS),
    });
  }

  if (fillers.length < config.fillerCount) {
    throw new Error(
      `Could only generate ${fillers.length} unique filler rows; need ${config.fillerCount}.`
    );
  }

  return fillers;
}

/**
 * Inserts prospect-directory rows for one simulation from config (idempotent per simulation_id).
 */
export async function generateProspectDirectory(
  supabase: SupabaseClient,
  config: DirectoryConfig
): Promise<{ inserted: number }> {
  validateCraftedDecoys(config.craftedDecoys);

  const { count, error: countError } = await supabase
    .from("crm_prospect_directory")
    .select("id", { count: "exact", head: true })
    .eq("simulation_id", config.simulationId);

  if (countError) {
    throw new Error(`Could not check existing directory rows: ${countError.message}`);
  }

  if ((count ?? 0) > 0) {
    console.log(
      `Skipping seed: crm_prospect_directory already has ${count} row(s) for simulation_id=${config.simulationId}.`
    );
    return { inserted: 0 };
  }

  const fillerEntries = buildFillerEntries(config);
  const rows: DirectoryRowInsert[] = [
    toInsertRow(config.simulationId, config.target, "target"),
    ...config.craftedDecoys.map((entry) =>
      toInsertRow(config.simulationId, entry, "crafted_decoy")
    ),
    ...fillerEntries.map((entry) => toInsertRow(config.simulationId, entry, "filler")),
  ];

  const { error: insertError } = await supabase.from("crm_prospect_directory").insert(rows);

  if (insertError) {
    throw new Error(`Insert failed: ${insertError.message}`);
  }

  return { inserted: rows.length };
}

/**
 * Loads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local when unset.
 */
function loadEnvLocalIfNeeded(): void {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq === -1) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    /* optional */
  }
}

/**
 * CLI entry — imports simulation config and runs the generator once.
 */
async function runCli(): Promise<void> {
  loadEnvLocalIfNeeded();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const { tempoDirectorySeed } = await import("./config/tempo-directory-seed");
  const supabase = createClient(url, key);
  const result = await generateProspectDirectory(supabase, tempoDirectorySeed);
  console.log(`Done. Inserted ${result.inserted} prospect-directory row(s).`);
}

const isMain =
  typeof require !== "undefined" &&
  typeof module !== "undefined" &&
  require.main === module;

if (isMain) {
  runCli().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
