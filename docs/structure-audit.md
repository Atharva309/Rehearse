# Structure Audit (Read-Only)

Date of investigation: 2026-07-17  
Scope: investigation only. No files were edited, deleted, renamed, moved, or migrated except the creation of this report.

---

## 1. Duplicate filename check — `DiscoveryStage.tsx`

**Finding:** The two files are genuinely separate components for different simulation systems. Both are imported today, via distinct absolute paths, and are not aliases of each other.

### `components/stages/DiscoveryStage.tsx` (legacy / generic runner)

Thin wrapper around `SimliCallStage` for a video-call Discovery stage in the non-Tempo `SimulationRunner` pipeline.

**Import references:**

| Importer | Line | Import path |
|---|---|---|
| `components/SimulationRunner.tsx` | 16 | `@/components/stages/DiscoveryStage` |

No other file imports this path.

### `components/tempo/stages/DiscoveryStage.tsx` (Tempo)

Full Tempo Stage 2 shell: lobby → audio call session → handoff modals → auto-complete. Used only for the Tempo/Default (Rehearse Essentials) simulation.

**Import references:**

| Importer | Line | Import path |
|---|---|---|
| `app/student/simulation/[id]/page.tsx` | 8 | `@/components/tempo/stages/DiscoveryStage` |

Related Tempo-only imports inside that file (not the legacy twin): `DiscoveryStageLayout` at line 18 of the Tempo component itself.

**Conclusion:** Same basename, different directories and APIs. Legacy is reached only through `SimulationRunner`; Tempo is reached directly from the student simulation page when Tempo Discovery is active. No rename or consolidation was performed.

---

## 2. `hooks/useProspectingVoice.ts`

**Finding:** Not orphaned. It is imported and used by the legacy phone-call stage for Deepgram + GPT + ElevenLabs voice (no Simli).

**Import / reference list:**

| File | Line(s) | Nature |
|---|---|---|
| `components/call/PhoneCallStage.tsx` | 17 | `import { useProspectingVoice } from "@/hooks/useProspectingVoice"` |
| `components/call/PhoneCallStage.tsx` | 68 | Hook call: `const voice = useProspectingVoice({ ... })` |
| `lib/voice-utterance-buffer.ts` | 4 | Comment-only mention (“Used by useProspectingVoice and useSimulationVoiceSession”) |
| `hooks/useProspectingVoice.ts` | 46 | Self-export `export function useProspectingVoice` |

**Usage purpose:** `PhoneCallStage` uses it to drive voice-only prospecting/close phone calls (start/stop call, transcripts, status text) after the lobby supplies a media stream.

---

## 3. `lib/check-class-appearance-columns.ts`

**Finding:** Live runtime helper, not an unused one-time migration script. It is called from a teacher page on every load of that route.

**Exports:** `getClassAppearanceStatus()` — probes Supabase/PostgREST for `classes.card_image_url` / `classes.card_color_scheme` and returns `"ready" | "stale_schema" | "missing_columns"`.

**Import / reference list:**

| File | Line(s) | Nature |
|---|---|---|
| `app/teacher/classes/[classId]/page.tsx` | 11 | `import { getClassAppearanceStatus } from "@/lib/check-class-appearance-columns"` |
| `app/teacher/classes/[classId]/page.tsx` | 46 | `const appearanceStatus = await getClassAppearanceStatus();` |
| `lib/check-class-appearance-columns.ts` | 28 | Self-export |

No other imports found. It is a live server-side status probe for the professor class-management page, not a CLI/migration entrypoint.

---

## 4. Legacy simulation UI cluster

**Finding:** The cluster is still wired into a reachable route. `app/student/simulation/[id]/page.tsx` always imports `SimulationRunner` and renders it in the `else` branch when the attempt is **not** routed to a Tempo-specific stage view (non-Tempo class/simulation, or Tempo stages that fall through). That runner imports the entire `components/stages/*` set and `components/call/CallContainer`.

### Reachability summary

Live route: `app/student/simulation/[id]/page.tsx`  
- Tempo default class + Tempo stages → Tempo stage components.  
- Otherwise → `<SimulationRunner />` (lines 267–275), which mounts legacy stages.

Some `components/call/` utilities are also reached indirectly by Tempo via `Avatar` → `CallLayout` (see CallLayout notes below).

### Per-file report

#### `components/StageShell.tsx`

Imported by legacy form stages; wraps content and can show `StageScoreReveal`.

| Importer | Line |
|---|---|
| `components/stages/LeadGenStage.tsx` | 10 |
| `components/stages/PresentationStage.tsx` | 10 |

Reached today only if `SimulationRunner` renders Lead Gen or Presentation. **Live route path exists** via `SimulationRunner` on non-Tempo attempts.

#### `components/StageCard.tsx`

Card chrome for the same legacy form stages.

| Importer | Line |
|---|---|
| `components/stages/LeadGenStage.tsx` | 9 |
| `components/stages/PresentationStage.tsx` | 9 |

Same reachability as `StageShell`.

#### `components/StageProgress.tsx`

**No live route found reaching this file.** Zero imports of `@/components/StageProgress` / `StageProgress` as a component. Related live code uses `buildStageProgress` from `@/lib/stages` and renders `PipelineProgress` instead (`components/SimulationRunner.tsx`, `app/student/simulation/[id]/complete/page.tsx`).

#### `components/StageScoreReveal.tsx`

Score reveal UI after a call/form stage completes.

| Importer | Line |
|---|---|
| `components/StageShell.tsx` | 9 |
| `components/call/PhoneCallStage.tsx` | 13 |
| `components/call/SimliCallStage.tsx` | 15 |

Reached via legacy `SimulationRunner` → stages → call/shell components.

#### `components/StageScoresSummary.tsx`

**No live route found reaching this file.** Zero imports of this module found outside its own file.

#### `components/CompletedStagesPanel.tsx`

**No live route found reaching this file.** Zero imports of this module found outside its own file.

#### `components/stages/CloseStage.tsx`

| Importer | Line |
|---|---|
| `components/SimulationRunner.tsx` | 15 |

Uses `PhoneCallStage`. Reachable when `SimulationRunner` is on the `close` stage.

#### `components/stages/DiscoveryStage.tsx`

| Importer | Line |
|---|---|
| `components/SimulationRunner.tsx` | 16 |

Uses `SimliCallStage`. Reachable when `SimulationRunner` is on `discovery`. Distinct from Tempo Discovery (Section 1).

#### `components/stages/LeadGenStage.tsx`

| Importer | Line |
|---|---|
| `components/SimulationRunner.tsx` | 17 |

Uses `StageCard` + `StageShell`. Reachable when `SimulationRunner` is on `lead_gen`.

#### `components/stages/ObjectionsStage.tsx`

| Importer | Line |
|---|---|
| `components/SimulationRunner.tsx` | 18 |

Uses `SimliCallStage`. Reachable when `SimulationRunner` is on `objections`.

#### `components/stages/PresentationStage.tsx`

| Importer | Line |
|---|---|
| `components/SimulationRunner.tsx` | 19 |

Uses `StageCard` + `StageShell`. Distinct from `components/tempo/stages/PresentationStage.tsx` (imported by the student page for Tempo). Reachable when `SimulationRunner` is on `presentation`.

#### `components/stages/ProspectingStage.tsx`

| Importer | Line |
|---|---|
| `components/SimulationRunner.tsx` | 20 |

Uses `PhoneCallStage` + `CallLayout` constants. Distinct from Tempo `ProspectingWizard`. Reachable when `SimulationRunner` is on `prospecting`.

#### `components/call/` (all files)

| File | Importers (path + line) | Live reachability notes |
|---|---|---|
| `CallContainer.tsx` | `components/SimulationRunner.tsx:11` | Legacy runner only |
| `PhoneCallStage.tsx` | `components/stages/CloseStage.tsx:8`, `components/stages/ProspectingStage.tsx:9` | Via `SimulationRunner` |
| `SimliCallStage.tsx` | `components/stages/DiscoveryStage.tsx:8`, `components/stages/ObjectionsStage.tsx:8` | Via `SimulationRunner` |
| `CallLayout.tsx` | `components/call/SimliCallStage.tsx:12`, `components/stages/ProspectingStage.tsx:8`, `components/Avatar.tsx:38` | Shared: legacy call stages **and** Tempo (Avatar used by Tempo Discovery/Objection call sessions) |
| `EndCallModal.tsx` | `PhoneCallStage.tsx:10`, `SimliCallStage.tsx:14` | Via call stages above |
| `PhoneCallLayout.tsx` | `PhoneCallStage.tsx:11` | Via phone call stage |
| `PhoneCallLobby.tsx` | `PhoneCallStage.tsx:12` | Via phone call stage |
| `CallLobby.tsx` | `SimliCallStage.tsx:13` | Via Simli call stage |
| `CallTranscript.tsx` | `PhoneCallLayout.tsx:10` | Via phone layout |

**Cluster verdict:** Non-Tempo (and Tempo fall-through) attempts still route through `SimulationRunner` and therefore through most of this cluster. Three UI files in the list (`StageProgress.tsx`, `StageScoresSummary.tsx`, `CompletedStagesPanel.tsx`) currently have **no live importer**; that is a finding only, not a removal decision.

---

## 5. `components/crm/crm-display.ts`

**Finding:** Utility/helper module (not a React component). Exports formatting/derivation functions and one type alias for CRM home/list labels.

**Exports observed:**

- Functions: `accountNameFromLogs`, `primaryContactFromLogs`, `opportunityTitleFromLogs`, `opportunityCompletionPercent`, `previewText`, `contactHasRecord`, `availableContactKeysToAdd`
- Type: `ContactNotesSnapshot`
- Re-export: `contactDisplayName` (from `@/lib/tempo-crm-contact`)

**Import references:**

| File | Line(s) | Symbols used |
|---|---|---|
| `components/crm/CrmOverlay.tsx` | 30–39 | `accountNameFromLogs`, `availableContactKeysToAdd`, `contactHasRecord`, `opportunityCompletionPercent`, `opportunityTitleFromLogs`, `previewText`, `primaryContactFromLogs`, `ContactNotesSnapshot` |

No other importers found.

**Naming/location observation (no action taken):** The file uses lowercase-hyphenated `.ts` naming inside `components/crm/`, which otherwise mostly holds PascalCase `.tsx` UI components. Similar helpers elsewhere often live under `lib/` (e.g. `lib/tempo-crm-account.ts`, `lib/tempo-crm-contact.ts`, `lib/tempo-crm-fields.ts`). Location/convention mismatch is noted only.

---

## 6. `components/CallControls.tsx`

**Finding:** Orphaned from the import graph — **zero references found** outside its own file. It is a small Start/End call toggle UI driven by props (`isActive`, `onStart`, `onEnd`, `statusText`), with a file comment referencing `useVoiceSession`.

**Import references:** none found.

**Observation (no action taken):** Functionally related in purpose to `components/call/` (call start/end controls), but it sits beside that directory rather than inside it, and no current call stage (`PhoneCallStage`, `SimliCallStage`, Tempo call sessions) imports it. Those stages implement their own lobby/end-call UI instead.

---

## 7. Naming collision — “Badge”

**Finding:** Confirmed unrelated systems that only share the word “badge.”

### Grade/score UI chip — `components/ScoreBadge.tsx`

Renders a numeric stage score (`score/100`) with optional total letter grade via `scoreToGrade` / `stageScoreTone`. It is a score display chip, not an achievement unlock.

**Import references:** none found. The component currently has zero importers.

### Achievement-badge system (Tempo)

- `lib/tempo-badges.ts` — defines **28** badge IDs across Prospecting, Discovery, Presentation, Objections, and Negotiation; used by `detectTempoBadges` from `app/api/student/complete-stage/route.ts` and by results helpers in `lib/tempo-results.ts`.
- `components/tempo/AchievementProgress.tsx` — results sidebar that reads `stage_scores.badges_earned` and renders earned/locked achievement badges; imported by `components/tempo/TempoSimulationResultsView.tsx` (line 8).

These systems do not share types, IDs, or render paths with `ScoreBadge`.

---

## Recommendations

Suggestions only for a future, separate task. Nothing below was acted on during this audit.

1. **Confirm with the project owner** whether non-Tempo simulations still need `SimulationRunner` + `components/stages/*` + most of `components/call/` before any cleanup. The student simulation page still has a live fall-through into that cluster.
2. **Consider confirming** whether `components/StageProgress.tsx`, `components/StageScoresSummary.tsx`, `components/CompletedStagesPanel.tsx`, `components/CallControls.tsx`, and `components/ScoreBadge.tsx` are still needed (all currently have no importers) before removing them.
3. **Consider** whether `components/crm/crm-display.ts` should eventually live under `lib/` for consistency with other CRM helpers — only after confirming no packaging/path assumptions rely on its current location.
4. **Keep** the two `DiscoveryStage.tsx` files distinct unless/until product intent is to retire the legacy runner entirely; renaming for clarity could reduce confusion but is optional and out of scope here.
5. **Keep** `hooks/useProspectingVoice.ts` and `lib/check-class-appearance-columns.ts` as-is; both have live callers.
6. If documentation of the 28-badge system vs score chips is desired for onboarding, a short glossary note could be added in a future docs pass — not required for runtime.
)
