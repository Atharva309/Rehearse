/**
 * tempo-prospect-directory.ts
 * Seed data + helpers for the Prospecting company directory and scoped research chat.
 * Source of truth when crm_prospect_directory is empty or unavailable.
 */

import type { ChatMessage } from "@/types";

/** Full directory row including target flag (server-only; never send isTarget to clients). */
export type ProspectDirectoryCompanyRow = {
  id: string;
  name: string;
  industry: string;
  sizeLabel: string;
  signalHint: string;
  isTarget: boolean;
};

/** Public company card shape returned by the directory API. */
export type ProspectDirectoryCompany = {
  id: string;
  name: string;
  industry: string;
  sizeLabel: string;
  signalHint: string;
};

/** Show every non-target company in the 25-company Tempo directory. */
export const PROSPECT_DIRECTORY_DECOY_COUNT = 24;

/**
 * Stable seeded companies: 1 Tempo target + dental/vet/PT/optometry/med spa/chiro decoys.
 * UUIDs are fixed so attempt-cached id lists stay valid across reloads.
 */
export const PROSPECT_DIRECTORY_SEED: readonly ProspectDirectoryCompanyRow[] = [
  {
    id: "a1000001-0001-4000-8000-000000000001",
    name: "Summit Dental Group",
    industry: "Dental",
    sizeLabel: "8 locations",
    signalHint: "Just opened 8th Front Range location; phone scheduling under strain.",
    isTarget: true,
  },
  {
    id: "a1000001-0001-4000-8000-000000000002",
    name: "Bright Smile Dental",
    industry: "Dental",
    sizeLabel: "3 locations",
    signalHint: "Posting about front-desk overtime after evening hygiene blocks.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-000000000003",
    name: "Main Street Dental",
    industry: "Dental",
    sizeLabel: "1 location",
    signalHint: "Hiring a second receptionist; mentions missed after-hours calls.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-000000000004",
    name: "Apex Dental Arts",
    industry: "Dental",
    sizeLabel: "2 locations",
    signalHint: "Updating patient portal; looking to reduce no-shows.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-000000000005",
    name: "Urban Orthodontics",
    industry: "Dental",
    sizeLabel: "4 locations",
    signalHint: "Expanding aligner consults; calendar double-books on consult days.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-000000000006",
    name: "Paws & Whiskers Veterinary",
    industry: "Veterinary",
    sizeLabel: "2 clinics",
    signalHint: "Weekend emergency overflow and high same-day cancel rate.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-000000000007",
    name: "Riverbend Animal Hospital",
    industry: "Veterinary",
    sizeLabel: "1 clinic",
    signalHint: "New associate onboarded; phone line busy during lunch rush.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-000000000008",
    name: "Summit Peak Physical Therapy",
    industry: "Physical Therapy",
    sizeLabel: "5 clinics",
    signalHint: "Opening fifth clinic; therapists lose time to rescheduling calls.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-000000000009",
    name: "Cascade Rehab Partners",
    industry: "Physical Therapy",
    sizeLabel: "3 clinics",
    signalHint: "Insurance auth delays causing last-minute cancellations.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-00000000000a",
    name: "ClearView Optometry",
    industry: "Optometry",
    sizeLabel: "2 locations",
    signalHint: "Contact-lens reorder reminders still manual via spreadsheet.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-00000000000b",
    name: "Lumen Eye Care",
    industry: "Optometry",
    sizeLabel: "4 locations",
    signalHint: "Adding Saturday hours; online booking often double-books slots.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-00000000000c",
    name: "Glow Med Spa Denver",
    industry: "Med Spa",
    sizeLabel: "2 studios",
    signalHint: "Injectables waitlist growing; no-shows on first consults.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-00000000000d",
    name: "Aurora Wellness Spa",
    industry: "Med Spa",
    sizeLabel: "1 studio",
    signalHint: "Launching membership packages; tracking renewals in email.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-00000000000e",
    name: "SpineAlign Chiropractic",
    industry: "Chiropractic",
    sizeLabel: "3 clinics",
    signalHint: "Care-plan adherence dropping after visit three.",
    isTarget: false,
  },
  {
    id: "a1000001-0001-4000-8000-00000000000f",
    name: "TrueNorth Chiro Group",
    industry: "Chiropractic",
    sizeLabel: "6 clinics",
    signalHint: "Multi-clinic schedule conflicts when DCs cover for each other.",
    isTarget: false,
  },
] as const;

/**
 * Strips the server-only target flag before returning companies to the client.
 */
export function toPublicProspectCompany(
  row: ProspectDirectoryCompanyRow
): ProspectDirectoryCompany {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    sizeLabel: row.sizeLabel,
    signalHint: row.signalHint,
  };
}

/**
 * Fisher–Yates shuffle (in-place copy).
 */
export function shuffleProspectCompanies<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
}

/**
 * Picks the real target + a random decoy subset, then shuffles so order never hints.
 */
export function pickProspectDirectorySubset(
  rows: readonly ProspectDirectoryCompanyRow[],
  decoyCount = PROSPECT_DIRECTORY_DECOY_COUNT
): ProspectDirectoryCompanyRow[] {
  const target = rows.find((row) => row.isTarget);
  const decoys = shuffleProspectCompanies(rows.filter((row) => !row.isTarget)).slice(
    0,
    decoyCount
  );
  const combined = target ? [target, ...decoys] : decoys;
  return shuffleProspectCompanies(combined);
}

/**
 * Builds a per-company research system prompt — identical instructions for every company.
 * Never implies which account (if any) is the simulation target.
 */
export function buildScopedResearchPrompt(company: ProspectDirectoryCompany): string {
  return `You are an AI research assistant helping a sales student research a single company for a Tempo sales simulation. Treat this company with the same neutral care you would give any other account in the directory — do not imply it is preferred, correct, or "the" target.

ABOUT TEMPO: Scheduling software for appointment-based businesses (dental, vet, PT, optometry, med spa, chiropractic, and similar). Key value: cut no-shows, free the front desk, capture after-hours demand, drive repeat visits. Pricing: Starter $99/location/month, Pro $179/location/month. Proof points: 35% drop in no-shows in 90 days, 6 hours/week saved per location, 20% of bookings happen outside hours.

KNOWN FACTS ABOUT THIS COMPANY (ground your answers here):
- Name: ${company.name}
- Industry: ${company.industry}
- Scale: ${company.sizeLabel}
- Recent signal: ${company.signalHint}

Answer the student's questions using only these known facts plus general, non-specific industry context that would apply equally to any similar business. Do not invent named contacts, exact revenue, competitor contracts, or other specifics that are not listed above.

GUARDRAIL DRILL: In roughly one out of every four answers, include ONE plausible but unsupported detail that is NOT in the known facts (for example a guessed tool, a guessed headcount nuance, or a guessed initiative). Present that detail confidently without labeling it as uncertain — the student must practice spotting unverified claims. In all other answers, stay strictly within known facts and clearly say when you do not know.

IMPORTANT: Write in plain English only. Do not use LaTeX, TeX, math delimiters ($ or $$), or markdown code blocks. Use normal punctuation for numbers and percentages (e.g. 15-20%, not $15\\text{-}20\\%$).`;
}

/**
 * True when the student has sent at least one research message for any company.
 */
export function hasProspectingResearchActivity(
  companyChats: Record<string, ChatMessage[]>
): boolean {
  return Object.values(companyChats).some((messages) =>
    messages.some((msg) => msg.role === "user")
  );
}
