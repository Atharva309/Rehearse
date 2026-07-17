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

/** Config-defined numeric comparison used for decoy validation and filler capping. */
export interface ComparableAxis {
  name: string;
  keywords: string[];
  getValue: (entry: DirectoryEntry, config: DirectoryConfig) => number | null;
  regenerateFillerValue?: (config: DirectoryConfig) => Partial<DirectoryEntry>;
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
  contactFirstNamePool: string[];
  contactLastNamePool: string[];
  contactTitleSeniorityRank: string[];
  comparableAxes: ComparableAxis[];
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

const FILLER_SIGNAL_HINTS = [
  "Steady operations with no notable public updates recently.",
  "Maintains a typical appointment volume for its market.",
  "No major staffing or expansion news reported lately.",
  "Continues routine patient scheduling through existing processes.",
  "Limited public information on recent operational changes.",
];

const FILLER_GUARD_RETRY_MAX = 10;

/** Appended to a suffix as a last-resort tiebreaker when rerolls keep colliding. */
const NAME_COLLISION_QUALIFIERS = ["West", "East", "North", "South", "Central"];

/**
 * Picks a random element from a non-empty array.
 */
function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

/** Parses the leading integer from a free-text comparable value. */
export function parseSizeNumber(valueText: string): number | null {
  const match = valueText.trim().match(/^(\d+)/);
  if (!match) {
    return null;
  }
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

/**
 * Applies every configured axis cap to one filler candidate.
 * Axes without usable values or regeneration strategies degrade with a warning.
 */
function applyComparableAxisCaps(
  candidate: DirectoryEntry,
  config: DirectoryConfig
): DirectoryEntry {
  let cappedCandidate = candidate;

  for (const axis of config.comparableAxes) {
    const targetValue = axis.getValue(config.target, config);
    let fillerValue = axis.getValue(cappedCandidate, config);

    if (targetValue === null || fillerValue === null) {
      console.warn(
        `[generate-prospect-directory] Skipping axis "${axis.name}" for filler "${candidate.companyName}" because its target or filler value is unavailable.`
      );
      continue;
    }
    if (fillerValue < targetValue) {
      continue;
    }
    if (!axis.regenerateFillerValue) {
      console.warn(
        `[generate-prospect-directory] Axis "${axis.name}" cannot cap filler "${candidate.companyName}" because no regeneration strategy is configured.`
      );
      continue;
    }

    let isCapped = false;
    for (let attempt = 0; attempt < FILLER_GUARD_RETRY_MAX; attempt += 1) {
      cappedCandidate = {
        ...cappedCandidate,
        ...axis.regenerateFillerValue(config),
      };
      fillerValue = axis.getValue(cappedCandidate, config);
      if (fillerValue === null) {
        console.warn(
          `[generate-prospect-directory] Skipping axis "${axis.name}" for filler "${candidate.companyName}" because regeneration produced an unavailable value.`
        );
        isCapped = true;
        break;
      }
      if (fillerValue < targetValue) {
        isCapped = true;
        break;
      }
    }

    if (!isCapped) {
      console.warn(
        `[generate-prospect-directory] Axis "${axis.name}" remained at or above its target value for filler "${candidate.companyName}" after ${FILLER_GUARD_RETRY_MAX} attempts.`
      );
    }
  }

  return cappedCandidate;
}

/**
 * Validates required decoy rationale and measured wins across configured axes.
 */
export function validateCraftedDecoys(config: DirectoryConfig): void {
  for (const decoy of config.craftedDecoys) {
    const label = decoy.companyName.trim() || "(unnamed crafted decoy)";
    if (!decoy.strongerAxis?.trim()) {
      throw new Error(`Crafted decoy "${label}" is missing required field strongerAxis.`);
    }
    if (!decoy.weakerAxis?.trim()) {
      throw new Error(`Crafted decoy "${label}" is missing required field weakerAxis.`);
    }

    const winningAxes = config.comparableAxes.filter((axis) => {
      const decoyValue = axis.getValue(decoy, config);
      const targetValue = axis.getValue(config.target, config);
      return decoyValue !== null && targetValue !== null && decoyValue > targetValue;
    });

    if (winningAxes.length > 1) {
      throw new Error(
        `Crafted decoy "${label}" out-performs the target on multiple axes: ${winningAxes
          .map((axis) => axis.name)
          .join(", ")}.`
      );
    }

    if (winningAxes.length === 0) {
      console.warn(
        `[generate-prospect-directory] Crafted decoy "${label}" does not measurably out-perform the target on any configured axis; double-check that this is intentional.`
      );
      continue;
    }

    const winningAxis = winningAxes[0];
    const declaredStrength = decoy.strongerAxis.toLowerCase();
    const referencesWinningAxis = winningAxis.keywords.some((keyword) =>
      declaredStrength.includes(keyword.toLowerCase())
    );
    if (!referencesWinningAxis) {
      console.warn(
        `[generate-prospect-directory] Crafted decoy "${label}" wins on axis "${winningAxis.name}", but strongerAxis may not reference that measured strength.`
      );
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
 * Builds a filler company name guaranteed not to collide with usedNames.
 * Rerolls the prefix first (then suffix) up to FILLER_GUARD_RETRY_MAX times;
 * as a last resort appends a directional qualifier (e.g. "Dental Group — West").
 */
function buildUniqueFillerCompanyName(
  config: DirectoryConfig,
  suffixes: readonly string[],
  usedNames: ReadonlySet<string>
): string {
  let suffix = pickRandom(suffixes);
  let candidate = `${pickRandom(config.namePrefixPool)} ${suffix}`;

  for (let attempt = 0; attempt < FILLER_GUARD_RETRY_MAX; attempt += 1) {
    if (!usedNames.has(candidate)) {
      return candidate;
    }
    // Vary the prefix on every reroll; also vary the suffix on later rerolls.
    if (attempt >= FILLER_GUARD_RETRY_MAX / 2) {
      suffix = pickRandom(suffixes);
    }
    candidate = `${pickRandom(config.namePrefixPool)} ${suffix}`;
  }

  // Should be very rare with the expanded pool — disambiguate rather than loop forever.
  for (const qualifier of NAME_COLLISION_QUALIFIERS) {
    const qualified = `${candidate} — ${qualifier}`;
    if (!usedNames.has(qualified)) {
      return qualified;
    }
  }

  throw new Error(
    `Could not build a unique filler company name after ${FILLER_GUARD_RETRY_MAX} rerolls and all qualifiers (last candidate: "${candidate}").`
  );
}

/**
 * Builds filler directory entries from pools in the config.
 * usedCompanyNames is pre-seeded with the target's and crafted decoys' names
 * so a filler can never duplicate them.
 */
function buildFillerEntries(config: DirectoryConfig): DirectoryEntry[] {
  const usableIndustries = config.industryPool.filter(
    (industry) => (config.suffixByIndustry[industry] ?? []).length > 0
  );
  if (usableIndustries.length === 0) {
    throw new Error("No industry in industryPool has suffixes in suffixByIndustry.");
  }

  const usedCompanyNames = new Set<string>([
    config.target.companyName,
    ...config.craftedDecoys.map((decoy) => decoy.companyName),
  ]);

  const fillers: DirectoryEntry[] = [];

  while (fillers.length < config.fillerCount) {
    const industry = pickRandom(usableIndustries);
    const suffixes = config.suffixByIndustry[industry];
    const companyName = buildUniqueFillerCompanyName(config, suffixes, usedCompanyNames);
    usedCompanyNames.add(companyName);

    const firstName = pickRandom(config.contactFirstNamePool);
    const lastName = pickRandom(config.contactLastNamePool);

    const candidate: DirectoryEntry = {
      ...config.target,
      companyName,
      contactName: `${firstName} ${lastName}`,
      industry,
      signalHint: pickRandom(FILLER_SIGNAL_HINTS),
      hiddenClaim: undefined,
    };
    fillers.push(applyComparableAxisCaps(candidate, config));
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
  validateCraftedDecoys(config);

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
