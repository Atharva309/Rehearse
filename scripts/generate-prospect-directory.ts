/**
 * generate-prospect-directory.ts
 * Reusable prospect-directory seeder — all simulation content lives in config files.
 * Seeds crm_prospect_directory companies and 3 crm_prospect_contacts rows each.
 * Runnable via: npx tsx scripts/generate-prospect-directory.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomPerson } from "./shared/person-name-pool";

// ── Contact + company entry shapes ───────────────────────────────────────────

/** One person attached to a directory company. */
export interface ContactEntry {
  contactName: string;
  contactTitle: string;
  department: string;
  gender: "male" | "female";
}

/** Hand-authored trap contact with competitive-axis rationale. */
export interface DesignedTrapContact extends ContactEntry {
  strongerAxis: string;
  weakerAxis: string;
}

/** Correct contact + exactly two designed traps for target/crafted decoys. */
export interface DesignedContactSet {
  correct: ContactEntry;
  traps: DesignedTrapContact[];
}

export interface DirectoryEntry {
  companyName: string;
  industry: string;
  sizeLocations: string;
  signalHint?: string;
  hiddenClaim?: string;
  /**
   * Filler-only primary contact fields (mirrored onto the directory row).
   * Designed companies use contactSet.correct instead.
   */
  contactName?: string;
  contactTitle?: string;
}

/** Target / designed company with a full 3-contact set. */
export interface DesignedDirectoryEntry extends DirectoryEntry {
  contactSet: DesignedContactSet;
}

/** Hand-authored decoys must declare competitive axes (validated before generation). */
export interface CraftedDecoyEntry extends DesignedDirectoryEntry {
  strongerAxis: string;
  weakerAxis: string;
}

/**
 * Config-defined numeric comparison used for decoy/trap validation and filler capping.
 * Generic over the subject type so company-level and contact-level axes share one shape.
 */
export interface ComparableAxis<TSubject> {
  name: string;
  keywords: string[];
  getValue: (subject: TSubject, config: DirectoryConfig) => number | null;
  regenerateFillerValue?: (config: DirectoryConfig) => Partial<TSubject>;
}

export interface DirectoryConfig {
  simulationId: string;
  target: DesignedDirectoryEntry;
  craftedDecoys: CraftedDecoyEntry[];
  fillerCount: number;
  industryPool: string[];
  namePrefixPool: string[];
  suffixByIndustry: Record<string, string[]>;
  contactTitlePool: string[];
  contactDepartmentPool: string[];
  contactTitleSeniorityRank: string[];
  /** Department that owns the core pain (used by contact department_relevance axis). */
  corePainDepartment: string;
  comparableAxes: ComparableAxis<DirectoryEntry>[];
  contactComparableAxes: ComparableAxis<ContactEntry>[];
}

type EntryType = "target" | "crafted_decoy" | "filler";

type DirectoryRowInsert = {
  simulation_id: string;
  company_name: string;
  industry: string;
  size_locations: string;
  signal_hint: string;
  hidden_claim: string | null;
  entry_type: EntryType;
  is_active: boolean;
};

type ContactRowInsert = {
  company_id: string;
  contact_name: string;
  contact_title: string;
  department: string;
  gender: "male" | "female";
  is_correct_contact: boolean;
  stronger_axis: string | null;
  weaker_axis: string | null;
};

type CompetitorWithAxes = {
  strongerAxis: string;
  weakerAxis: string;
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
 * Resolves the primary contact title used by company-level seniority comparisons.
 * Designed companies read from contactSet.correct; fillers use inline contactTitle.
 */
export function resolvePrimaryContactTitle(
  entry: DirectoryEntry | DesignedDirectoryEntry
): string {
  if ("contactSet" in entry && entry.contactSet) {
    return entry.contactSet.correct.contactTitle;
  }
  return entry.contactTitle ?? "";
}

/**
 * Applies every configured company axis cap to one filler candidate.
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
 * Generic win-count validator: each competitor may beat the canonical subject
 * on at most one configured axis, and strongerAxis should reference that win.
 * Used for company-vs-target decoys and trap-vs-correct contacts.
 */
export function validateCompetitorsAgainstCanonical<TSubject>(options: {
  candidates: Array<TSubject & CompetitorWithAxes>;
  canonical: TSubject;
  axes: Array<Pick<ComparableAxis<TSubject>, "name" | "keywords" | "getValue">>;
  config: DirectoryConfig;
  labelFor: (candidate: TSubject & CompetitorWithAxes) => string;
}): void {
  const { candidates, canonical, axes, config, labelFor } = options;

  for (const candidate of candidates) {
    const label = labelFor(candidate);
    if (!candidate.strongerAxis?.trim()) {
      throw new Error(`Competitor "${label}" is missing required field strongerAxis.`);
    }
    if (!candidate.weakerAxis?.trim()) {
      throw new Error(`Competitor "${label}" is missing required field weakerAxis.`);
    }

    const winningAxes = axes.filter((axis) => {
      const candidateValue = axis.getValue(candidate, config);
      const canonicalValue = axis.getValue(canonical, config);
      return (
        candidateValue !== null &&
        canonicalValue !== null &&
        candidateValue > canonicalValue
      );
    });

    if (winningAxes.length > 1) {
      throw new Error(
        `Competitor "${label}" out-performs the canonical subject on multiple axes: ${winningAxes
          .map((axis) => axis.name)
          .join(", ")}.`
      );
    }

    if (winningAxes.length === 0) {
      console.warn(
        `[generate-prospect-directory] Competitor "${label}" does not measurably out-perform the canonical subject on any configured axis; double-check that this is intentional.`
      );
      continue;
    }

    const winningAxis = winningAxes[0];
    const declaredStrength = candidate.strongerAxis.toLowerCase();
    const referencesWinningAxis = winningAxis.keywords.some((keyword) =>
      declaredStrength.includes(keyword.toLowerCase())
    );
    if (!referencesWinningAxis) {
      console.warn(
        `[generate-prospect-directory] Competitor "${label}" wins on axis "${winningAxis.name}", but strongerAxis may not reference that measured strength.`
      );
    }
  }
}

/**
 * Validates crafted company decoys against the target using company-level axes.
 */
export function validateCraftedDecoys(config: DirectoryConfig): void {
  validateCompetitorsAgainstCanonical({
    candidates: config.craftedDecoys,
    canonical: config.target,
    axes: config.comparableAxes,
    config,
    labelFor: (decoy) => decoy.companyName.trim() || "(unnamed crafted decoy)",
  });
}

/**
 * Validates each designed company's 2 trap contacts against its correct contact.
 */
export function validateDesignedContactSets(config: DirectoryConfig): void {
  const designedCompanies: DesignedDirectoryEntry[] = [
    config.target,
    ...config.craftedDecoys,
  ];

  for (const company of designedCompanies) {
    const label = company.companyName.trim() || "(unnamed company)";
    if (!company.contactSet?.correct) {
      throw new Error(`Designed company "${label}" is missing contactSet.correct.`);
    }
    if (!Array.isArray(company.contactSet.traps) || company.contactSet.traps.length !== 2) {
      throw new Error(
        `Designed company "${label}" must declare exactly 2 trap contacts in contactSet.traps.`
      );
    }

    validateCompetitorsAgainstCanonical({
      candidates: company.contactSet.traps,
      canonical: company.contactSet.correct,
      axes: config.contactComparableAxes,
      config,
      labelFor: (trap) =>
        `${label} / ${trap.contactName.trim() || "(unnamed trap contact)"}`,
    });
  }
}

/**
 * Maps a config entry into a crm_prospect_directory insert row.
 * Contact people live in crm_prospect_contacts, not on the company row.
 */
function toInsertRow(
  simulationId: string,
  entry: DirectoryEntry | DesignedDirectoryEntry,
  entryType: EntryType
): DirectoryRowInsert {
  return {
    simulation_id: simulationId,
    company_name: entry.companyName,
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
    if (attempt >= FILLER_GUARD_RETRY_MAX / 2) {
      suffix = pickRandom(suffixes);
    }
    candidate = `${pickRandom(config.namePrefixPool)} ${suffix}`;
  }

  for (const qualifier of NAME_COLLISION_QUALIFIERS) {
    const qualified = `${candidate} (${qualifier})`;
    if (!usedNames.has(qualified)) {
      return qualified;
    }
  }

  throw new Error(
    `Could not build a unique filler company name after ${FILLER_GUARD_RETRY_MAX} rerolls and all qualifiers (last candidate: "${candidate}").`
  );
}

/**
 * Builds one undesigned filler contact from the shared name pool + title/department pools.
 */
function buildFillerContact(config: DirectoryConfig): ContactEntry {
  const person = randomPerson();
  return {
    contactName: `${person.firstName} ${person.lastName}`,
    contactTitle: pickRandom(config.contactTitlePool),
    department: pickRandom(config.contactDepartmentPool),
    gender: person.gender,
  };
}

/**
 * Builds filler directory entries from pools in the config.
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

    const primary = buildFillerContact(config);
    const candidate: DirectoryEntry = {
      companyName,
      industry,
      sizeLocations: config.target.sizeLocations,
      contactName: primary.contactName,
      contactTitle: primary.contactTitle,
      signalHint: pickRandom(FILLER_SIGNAL_HINTS),
      hiddenClaim: undefined,
    };
    fillers.push(applyComparableAxisCaps(candidate, config));
  }

  return fillers;
}

/**
 * Builds the 3 contact insert rows for a designed company (1 correct + 2 traps).
 */
function buildDesignedContactRows(
  companyId: string,
  contactSet: DesignedContactSet
): ContactRowInsert[] {
  return [
    {
      company_id: companyId,
      contact_name: contactSet.correct.contactName,
      contact_title: contactSet.correct.contactTitle,
      department: contactSet.correct.department,
      gender: contactSet.correct.gender,
      is_correct_contact: true,
      stronger_axis: null,
      weaker_axis: null,
    },
    ...contactSet.traps.map((trap) => ({
      company_id: companyId,
      contact_name: trap.contactName,
      contact_title: trap.contactTitle,
      department: trap.department,
      gender: trap.gender,
      is_correct_contact: false,
      stronger_axis: trap.strongerAxis,
      weaker_axis: trap.weakerAxis,
    })),
  ];
}

/**
 * Builds 3 undesigned filler contact rows.
 * Choice: first contact is marked is_correct_contact=true for schema consistency
 * (exactly one "primary" per company); the other two stay false. No axis design.
 */
function buildFillerContactRows(
  companyId: string,
  config: DirectoryConfig
): ContactRowInsert[] {
  const contacts: ContactEntry[] = [
    buildFillerContact(config),
    buildFillerContact(config),
    buildFillerContact(config),
  ];

  return contacts.map((contact, index) => ({
    company_id: companyId,
    contact_name: contact.contactName,
    contact_title: contact.contactTitle,
    department: contact.department,
    gender: contact.gender,
    is_correct_contact: index === 0,
    stronger_axis: null,
    weaker_axis: null,
  }));
}

/**
 * Replaces all contacts for the simulation's directory companies with fresh 3-contact sets.
 */
async function syncProspectContacts(
  supabase: SupabaseClient,
  config: DirectoryConfig,
  directoryRows: Array<{
    id: string;
    company_name: string;
    entry_type: string;
  }>
): Promise<number> {
  const companyIds = directoryRows.map((row) => row.id);
  if (companyIds.length === 0) {
    return 0;
  }

  const { error: deleteError } = await supabase
    .from("crm_prospect_contacts")
    .delete()
    .in("company_id", companyIds);
  if (deleteError) {
    throw new Error(`Could not clear existing contacts: ${deleteError.message}`);
  }

  const designedByName = new Map<string, DesignedDirectoryEntry>([
    [config.target.companyName, config.target],
    ...config.craftedDecoys.map(
      (decoy) => [decoy.companyName, decoy] as [string, DesignedDirectoryEntry]
    ),
  ]);

  const contactRows: ContactRowInsert[] = [];
  for (const row of directoryRows) {
    const designed = designedByName.get(row.company_name);
    if (designed) {
      contactRows.push(...buildDesignedContactRows(row.id, designed.contactSet));
      continue;
    }
    contactRows.push(...buildFillerContactRows(row.id, config));
  }

  const { error: insertError } = await supabase
    .from("crm_prospect_contacts")
    .insert(contactRows);
  if (insertError) {
    throw new Error(`Contact insert failed: ${insertError.message}`);
  }

  return contactRows.length;
}

/**
 * Inserts prospect-directory rows (when empty) and always syncs 3 contacts per company.
 */
export async function generateProspectDirectory(
  supabase: SupabaseClient,
  config: DirectoryConfig
): Promise<{ insertedCompanies: number; insertedContacts: number }> {
  validateCraftedDecoys(config);
  validateDesignedContactSets(config);

  const { count, error: countError } = await supabase
    .from("crm_prospect_directory")
    .select("id", { count: "exact", head: true })
    .eq("simulation_id", config.simulationId);

  if (countError) {
    throw new Error(`Could not check existing directory rows: ${countError.message}`);
  }

  let insertedCompanies = 0;
  if ((count ?? 0) === 0) {
    const fillerEntries = buildFillerEntries(config);
    const rows: DirectoryRowInsert[] = [
      toInsertRow(config.simulationId, config.target, "target"),
      ...config.craftedDecoys.map((entry) =>
        toInsertRow(config.simulationId, entry, "crafted_decoy")
      ),
      ...fillerEntries.map((entry) =>
        toInsertRow(config.simulationId, entry, "filler")
      ),
    ];

    const { error: insertError } = await supabase
      .from("crm_prospect_directory")
      .insert(rows);
    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }
    insertedCompanies = rows.length;
  } else {
    console.log(
      `Directory already has ${count} row(s) for simulation_id=${config.simulationId}; syncing contacts only.`
    );
  }

  const { data: directoryRows, error: loadError } = await supabase
    .from("crm_prospect_directory")
    .select("id, company_name, entry_type")
    .eq("simulation_id", config.simulationId)
    .eq("is_active", true);

  if (loadError || !directoryRows) {
    throw new Error(
      `Could not load directory rows for contact sync: ${loadError?.message ?? "unknown"}`
    );
  }

  const insertedContacts = await syncProspectContacts(supabase, config, directoryRows);
  return { insertedCompanies, insertedContacts };
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
  console.log(
    `Done. Inserted ${result.insertedCompanies} company row(s), synced ${result.insertedContacts} contact row(s).`
  );
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
