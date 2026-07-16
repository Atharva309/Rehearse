# Prospecting Stage Reference

This document describes the Prospecting stage as implemented in the current codebase. It covers both runtime mechanics and design intent. Where the implementation differs from an earlier or implied design (for example, `classifyMatch`, `needsConfirmation`, or `hidden_claim` behavior), the discrepancy is called out explicitly.

## 1. Overall Prospecting flow

### 1.1 Implemented step order

Prospecting has three steps, in this exact order:

1. **Company Directory**
2. **Select Target Lead**
3. **Opening Message**

The order comes from the shared step definition, not from component ordering:

```ts
// lib/tempo-prospecting.ts:10-26
export type ProspectingStepId = "research" | "select_lead" | "opening";

export const PROSPECTING_STEPS: readonly ProspectingStepDefinition[] = [
  { id: "research", label: "Company Directory", description: "Research candidate companies" },
  {
    id: "select_lead",
    label: "Select Target Lead",
    description: "Choose your best lead",
  },
  { id: "opening", label: "Opening Message", description: "Write your outreach" },
] as const;
```

The wizard state stores `currentStep` as a numeric index. Advancement is governed by one function:

```ts
// lib/tempo-prospecting.ts:331-356
export function canAdvanceProspectingStep(
  stepIndex: number,
  state: ProspectingWizardState
): boolean {
  switch (stepIndex) {
    case 0:
      return hasProspectingResearchActivity(state.companyChats);
    case 1:
      return Boolean(state.selectedLeadId);
    case 2:
      return canSubmitProspectingBrief(state);
    default:
      return false;
  }
}

export function canSubmitProspectingBrief(state: ProspectingWizardState): boolean {
  const words = countWords(state.openingMessage);
  return words >= 20 && words <= 120;
}
```

### 1.2 Step 1 — Company Directory

**What the student sees:** a searchable list of candidate-company cards on the left and either an empty research canvas or a company-scoped AI chat on the right. Every card displays the same public fields: company name, industry, scale, and signal hint (`components/tempo/stages/ProspectingCompanyDirectory.tsx:88-99,111-215`).

**What the student does:** selects one or more companies and asks research questions. Search filters locally by name, industry, or signal:

```ts
// components/tempo/stages/ProspectingCompanyDirectory.tsx:88-99
return companies.filter(
  (c) =>
    c.name.toLowerCase().includes(q) ||
    c.industry.toLowerCase().includes(q) ||
    c.signalHint.toLowerCase().includes(q)
);
```

**Validation before advancing:** at least one student-authored message must exist in any company chat. Merely selecting a company or receiving an AI message is insufficient:

```ts
// lib/tempo-prospect-directory.ts:225-233
export function hasProspectingResearchActivity(
  companyChats: Record<string, ChatMessage[]>
): boolean {
  return Object.values(companyChats).some((messages) =>
    messages.some((msg) => msg.role === "user")
  );
}
```

**Storage:** the full wizard state—including `companyChats`, `selectedCompanyId`, and `directoryCompanyIds`—is persisted to `attempts.stage_data`. The same state is also written to browser `localStorage` as a fallback:

```ts
// app/api/student/prospecting-wizard/route.ts:85-102
const merged = {
  ...existing,
  ...normalized,
  directoryCompanyIds:
    normalized.directoryCompanyIds.length > 0
      ? normalized.directoryCompanyIds
      : existingDirectoryIds,
};

await supabase
  .from("attempts")
  .update({ stage_data: merged })
  .eq("id", attemptId);
```

```ts
// lib/tempo-prospecting.ts:243-275
const STORAGE_PREFIX = "rehearse-prospecting-wizard-";
// ...
window.localStorage.setItem(`${STORAGE_PREFIX}${attemptId}`, JSON.stringify(state));
```

### 1.3 Step 2 — Select Target Lead

**What the student sees:** the CRM Leads associated with the attempt. If no Leads exist, the UI directs the student to CRM to create one (`components/tempo/stages/ProspectingLeadSelectionStep.tsx:37-59,123-130`).

**What the student does:** picks a Lead and clicks **Select as Target**. The client calls `POST /api/student/crm-leads/:leadId/select`:

```ts
// components/tempo/stages/ProspectingLeadSelectionStep.tsx:68-95
const res = await fetch(
  `/api/student/crm-leads/${encodeURIComponent(pickedId)}/select`,
  { method: "POST" }
);
// ...
if (!res.ok || !body?.success) {
  if (typeof body?.managerNote === "string" && body.managerNote.trim()) {
    setManagerNote(body.managerNote);
    return;
  }
  setError(body?.error ?? "Could not select this lead.");
  return;
}

await onSelected(pickedId);
```

**Validation before advancing:** both `crm_leads.company_name` and `crm_leads.contact_name` must fuzzy-match the hardcoded Tempo target identity, Summit Dental Group and Dana Reyes. Details are in Section 3.

**Storage:** successful server validation changes the selected `crm_leads.status` to `selected`. The client then stores the Lead ID as `selectedLeadId` in `attempts.stage_data`/localStorage and advances to step index 2:

```ts
// hooks/useProspectingWizard.ts:218-229
const completeLeadSelection = useCallback(
  async (leadId: string): Promise<void> => {
    setState((prev) => {
      const next = { ...prev, selectedLeadId: leadId, currentStep: 2 };
      void persistState(next);
      return next;
    });
  },
  [persistState]
);
```

### 1.4 Step 3 — Opening Message

**What the student sees:** fixed context pills for Dana Reyes, Summit Dental Group, and the eighth-location trigger; a multiline opening-message editor; a live word count; and five writing tips (`components/tempo/stages/ProspectingStepPanels.tsx:79-163`).

**What the student does:** writes an outreach message.

**Validation before completion:** the message must be **20 through 120 words inclusive**. The visible tips (specific trigger, business issue, CTA, professional tone) are not programmatically enforced:

```ts
// lib/tempo-prospecting.ts:119-128,320-356
export const SELF_CHECK_ITEMS = [
  { id: "wordCount", label: "Under 120 words" },
  { id: "trigger", label: "Mentioned specific trigger event" },
  { id: "businessIssue", label: "Led with their business issue, not product" },
  { id: "cta", label: "Clear and soft call to action" },
  { id: "professional", label: "Professional and specific tone" },
] as const;

export const OPENING_MESSAGE_TIPS = SELF_CHECK_ITEMS.map((item) => item.label);

export function canSubmitProspectingBrief(state: ProspectingWizardState): boolean {
  const words = countWords(state.openingMessage);
  return words >= 20 && words <= 120;
}
```

**Storage:** the opening message is kept in `attempts.stage_data` while drafting. On submission it is serialized into the Prospecting `stage_scores.transcript` JSON along with chat data and `selfCheck`:

```ts
// hooks/useProspectingWizard.ts:312-333
const transcript = JSON.stringify({
  companyChats: state.companyChats,
  selectedCompanyId: state.selectedCompanyId,
  chatMessages: state.chatMessages,
  openingMessage: state.openingMessage,
  selfCheck: state.selfCheck,
});

await completeStage(
  attemptId,
  "prospecting",
  0,
  "Submitted — scoring coming soon",
  transcript
);
```

### 1.5 What stage completion creates

When Prospecting completes, the server looks up the attempt's Lead whose status is `selected` and calls `convertLead()` (`app/api/student/complete-stage/route.ts:53-84`).

On successful conversion:

- `crm_account_notes` is upserted from the selected Lead's company, contact, `why_fit`, and `trigger_event`.
- `crm_contact_notes` is upserted for `contact_key = "dana_reyes"` from the Lead's contact name/title.
- The selected `crm_leads` row becomes `converted`.

There is **no `crm_opportunities` insert** in this path. The CRM UI treats a converted Lead/account as the existence of an Opportunity:

```ts
// components/crm/CrmOverlay.tsx:380-383
const hasConverted =
  hasAccountRow || leads.some((lead) => lead.status === "converted");
const hasOpportunity = hasConverted;
```

The Account and Contact are populated from the student's CRM Lead, not directly from directory/chat state. Account notes, Contact role, and Contact notes are initialized blank (`lib/tempo-lead-conversion.ts:94-151`).

## 2. Company Directory + Scoped Research Chat

### 2.1 Data source, simulation scope, randomization, and caching

The browser calls the existing attempt-scoped endpoint:

```ts
// components/tempo/stages/ProspectingCompanyDirectory.tsx:47-67
const res = await fetch(
  `/api/student/prospect-directory?attemptId=${encodeURIComponent(attemptId)}`
);
// ...
const body = (await res.json()) as { companies?: ProspectDirectoryCompany[] };
const next = body.companies ?? [];
setCompanies(next);
onCompaniesLoaded(next);
```

The endpoint verifies that the attempt belongs to the logged-in student, reads its `simulation_id`, and queries active rows from `crm_prospect_directory`:

```ts
// app/api/student/prospect-directory/route.ts:82-99
const { data: attempt, error: attemptError } = await supabase
  .from("attempts")
  .select("id, student_id, simulation_id, stage_data")
  .eq("id", attemptId)
  .eq("student_id", auth.session.studentId)
  .maybeSingle();

const allRows = await loadDirectoryRows(String(attempt.simulation_id));
```

```ts
// app/api/student/prospect-directory/route.ts:39-51
const { data, error } = await supabase
  .from("crm_prospect_directory")
  .select("id, company_name, industry, size_locations, signal_hint, entry_type")
  .eq("simulation_id", simulationId)
  .eq("is_active", true);
```

The server retains `entry_type` only long enough to locate the target internally:

```ts
// app/api/student/prospect-directory/route.ts:25-33
return {
  id: String(row.id),
  name: String(row.company_name ?? ""),
  industry: String(row.industry ?? ""),
  sizeLabel: String(row.size_locations ?? ""),
  signalHint: String(row.signal_hint ?? ""),
  isTarget: row.entry_type === "target",
};
```

The public shape strips `isTarget`, so the client never receives `entry_type` or a target flag:

```ts
// lib/tempo-prospect-directory.ts:158-170
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
```

Randomization uses Fisher–Yates. It chooses one target plus up to 24 non-target rows, then shuffles the combined result:

```ts
// lib/tempo-prospect-directory.ts:173-201
export function shuffleProspectCompanies<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    // swap
  }
  return next;
}

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
```

The chosen ID order is persisted in `attempts.stage_data.directoryCompanyIds`; subsequent calls restore the same order:

```ts
// app/api/student/prospect-directory/route.ts:101-121
const cachedIds = Array.isArray(stageData.directoryCompanyIds)
  ? stageData.directoryCompanyIds.filter((id): id is string => typeof id === "string")
  : [];

let selected = cachedIds.length > 0 ? orderByCachedIds(allRows, cachedIds) : [];

if (selected.length === 0) {
  selected = pickProspectDirectorySubset(allRows);
  // update attempts.stage_data.directoryCompanyIds
}
```

Current Tempo data has 25 rows (1 target, 3 crafted decoys, 21 fillers), while the display limit is 1 target plus 24 non-targets, so all 25 are normally shown (`scripts/config/tempo-directory-seed.ts:14-68`; `lib/tempo-prospect-directory.ts:28-29`).

**Cache edge case:** if only some cached IDs still exist, `selected.length` is nonzero, so the endpoint returns the smaller surviving list without refilling it. It regenerates only when zero cached rows survive (`app/api/student/prospect-directory/route.ts:106-121`).

### 2.2 Neutral visual treatment

All companies render through one `.map()` branch. Styling depends only on whether the student selected the card, never on `entry_type`:

```tsx
// components/tempo/stages/ProspectingCompanyDirectory.tsx:159-197
filtered.map((company) => {
  const isSelected = selectedCompanyId === company.id;
  return (
    <button
      key={company.id}
      className={`... ${
        isSelected
          ? "bg-surface border-2 border-secondary shadow-sm"
          : "bg-surface border-outline-variant hover:border-outline hover:shadow-sm"
      }`}
    >
      <h3>{company.name}</h3>
      <span>{company.industry}</span>
      <span>{company.sizeLabel}</span>
      <p>{company.signalHint}</p>
    </button>
  );
})
```

Because the API does not expose target/decoy/filler classification and the component has no classification branch, real, crafted-decoy, and filler rows are visually indistinguishable except for their factual content.

### 2.3 Actual scoped-chat system prompt

The live prompt builder is:

```ts
// lib/tempo-prospect-directory.ts:203-222
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
```

The interpolation is limited to public company facts: name, industry, `sizeLabel` (from `size_locations`), and `signalHint` (from `signal_hint`).

The first paragraph is the anti-ranking/anti-reveal control: the assistant must treat every company neutrally and must not imply that a company is “preferred,” “correct,” or the target. The prompt also limits answers to one company's facts and general industry context; it does not provide the other directory companies for comparison.

### 2.4 `hidden_claim`: configured but not implemented in chat

The seed config gives the target and crafted decoys a `hiddenClaim`, and the generator inserts it into `crm_prospect_directory.hidden_claim`:

```ts
// scripts/config/tempo-directory-seed.ts:14-23
target: {
  companyName: "Summit Dental Group",
  // ...
  hiddenClaim:
    "Two front-desk staff have reportedly left this year, reportedly tied to phone-scheduling overload",
},
```

```ts
// scripts/generate-prospect-directory.ts:204-220
return {
  simulation_id: simulationId,
  company_name: entry.companyName,
  // ...
  hidden_claim: entry.hiddenClaim?.trim() ? entry.hiddenClaim.trim() : null,
  entry_type: entryType,
  is_active: true,
};
```

However, the runtime directory query does **not** select `hidden_claim` (`app/api/student/prospect-directory/route.ts:39-45`), the public company type has no hidden-claim property (`lib/tempo-prospect-directory.ts:19-26`), and the prompt quoted above never interpolates it.

**Implementation gap:** authored `hidden_claim` values never surface in conversation. The current “guardrail drill” instead asks the model to invent an unsupported detail probabilistically. That is not the same as revealing the row's configured `hidden_claim`.

### 2.5 Per-company history isolation

Chat state is a dictionary keyed by company ID:

```ts
// lib/tempo-prospecting.ts:130-148
export type ProspectingWizardState = {
  // ...
  companyChats: Record<string, ChatMessage[]>;
  selectedCompanyId: string | null;
  // ...
};
```

Switching selection restores only that company's messages:

```ts
// hooks/useProspectingWizard.ts:168-183
const selectDirectoryCompany = useCallback(
  (companyId: string): void => {
    setChatInput("");
    setState((prev) => {
      const messages = prev.companyChats[companyId] ?? [];
      return {
        ...prev,
        selectedCompanyId: companyId,
        chatMessages: messages,
      };
    });
  },
  [persistState]
);
```

Sending a message reads and writes only `companyChats[companyId]`, and the API request receives only that company's prior messages:

```ts
// hooks/useProspectingWizard.ts:232-283
const companyId = state.selectedCompanyId;
const prior = state.companyChats[companyId] ?? [];
const nextMessages = [...prior, userMessage];

body: JSON.stringify({
  messages: nextMessages.slice(0, -1),
  newMessage: trimmed,
  systemPrompt: buildScopedResearchPrompt(company),
}),

companyChats: { ...prev.companyChats, [companyId]: withReply },
```

Therefore switching companies does not leak one company's transcript into another company's request. `chatMessages` is a compatibility mirror of the active company's history, not a global mixed transcript.

### 2.6 No research-to-Lead automation

There is no code path that copies the selected directory company, chat answers, or signal into a CRM Lead. Lead creation accepts student-authored fields via the CRM form/API. The only directory reuse is the Company Name dropdown, whose `onChange` updates only `companyName`:

```tsx
// components/crm/LeadDetailForm.tsx:259-286
<select
  value={values.companyName}
  onChange={(e) =>
    setValues((prev) => ({ ...prev, companyName: e.target.value }))
  }
>
  {companyOptions.map((companyName) => (
    <option key={companyName} value={companyName}>
      {companyName}
    </option>
  ))}
</select>
```

The remaining fields (`contactName`, `contactTitle`, `whyFit`, `trigger`, and `nextStep`) remain independent free-text controls (`components/crm/LeadDetailForm.tsx:13-67,287-310`). This is a deliberate student transcription step: research does not automatically become CRM judgment.

## 3. Lead Selection step

### 3.1 Important correction: no `classifyMatch()` or three-tier result exists

The current repository does **not** implement the requested/assumed `classifyMatch()` three-tier (`exact`/`close`/`none`) system. It uses one boolean function, `isCloseMatch()`. Consequently:

- accepted exact, prefix, substring, and fuzzy matches are all indistinguishable to callers;
- there is no `needsConfirmation` server field;
- there is no client “Did you mean?” confirmation flow.

The selection client's response type confirms the only handled fields are `success`, `managerNote`, and `error`:

```ts
// components/tempo/stages/ProspectingLeadSelectionStep.tsx:76-95
const body = (await res.json().catch(() => null)) as {
  success?: boolean;
  managerNote?: string;
  error?: string;
} | null;
// ...
await onSelected(pickedId);
```

### 3.2 Actual normalization and matching

Normalization trims, lowercases, and collapses whitespace:

```ts
// lib/string-similarity.ts:6-11
function normalizeForCompare(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
```

**There is no company-suffix stripping.** Terms such as `LLC`, `Inc.`, `Corp.`, or `Group` are not specially removed. Some strings with extra suffixes may still pass because of the general prefix/substring rules.

The actual boolean matcher is:

```ts
// lib/string-similarity.ts:68-95
export function isCloseMatch(
  input: string,
  target: string,
  threshold = 0.8
): boolean {
  const normInput = normalizeForCompare(input);
  const normTarget = normalizeForCompare(target);

  if (normInput === normTarget) {
    return true;
  }

  // Prefix/substring: allow dropping trailing words (e.g. "Summit Dental", "Dana").
  // Guard short inputs so "S" / "D" do not trivially match.
  if (normInput.length >= 4) {
    if (normTarget.startsWith(normInput) || normInput.startsWith(normTarget)) {
      return true;
    }
    if (normTarget.includes(normInput) || normInput.includes(normTarget)) {
      return true;
    }
  }

  return similarity(normInput, normTarget) >= threshold;
}
```

Prefix and substring checks are bidirectional, but only the input must be at least four characters. Examples accepted by this logic include `Summit Dental`, `Dana`, and longer strings containing the target.

The fuzzy fallback uses ordinary Levenshtein distance:

```ts
// lib/string-similarity.ts:51-65
export function similarity(a: string, b: string): number {
  const left = normalizeForCompare(a);
  const right = normalizeForCompare(b);
  // ...
  const distance = levenshteinDistance(left, right);
  return 1 - distance / maxLen;
}
```

The default acceptance threshold is `0.8`, so the normalized similarity must be at least 80%. The implementation uses insertion, deletion, and substitution costs; it does not implement Damerau transposition as a single operation (`lib/string-similarity.ts:13-49`).

Both fields must pass:

```ts
// lib/tempo-lead-conversion.ts:10-33
export const CORRECT_COMPANY = "Summit Dental Group";
export const CORRECT_CONTACT = "Dana Reyes";

export function validateLeadIdentity(
  companyName: string,
  contactName: string
): LeadValidationResult {
  if (!isCloseMatch(companyName, CORRECT_COMPANY)) {
    return { success: false };
  }
  if (!isCloseMatch(contactName, CORRECT_CONTACT)) {
    return { success: false };
  }
  return { success: true };
}
```

### 3.3 Failure escalation

The route stores a cumulative failure count in `attempts.lead_selection_attempts`:

```ts
// app/api/student/crm-leads/[leadId]/select/route.ts:80-98
const previous =
  typeof attempt.lead_selection_attempts === "number"
    ? attempt.lead_selection_attempts
    : 0;
const nextCount = previous + 1;

await supabase
  .from("attempts")
  .update({ lead_selection_attempts: nextCount })
  .eq("id", attemptId);

const managerNote = nextCount === 1 ? FIRST_WRONG_NOTE : REPEATED_WRONG_NOTE;
return NextResponse.json({ success: false, managerNote });
```

The first failure is generic; failure two and every later failure reveal the expected account/contact:

```ts
// app/api/student/crm-leads/[leadId]/select/route.ts:16-20
const FIRST_WRONG_NOTE =
  "This company isn't available to contact — check your leads and try a different one.";

const REPEATED_WRONG_NOTE =
  "Summit Dental Group, with Dana Reyes as your contact, is the account to pursue. Update your lead selection to match this exactly.";
```

The client displays `managerNote` in `ConvertFailureModal`; it does not perform a second classification or confirmation (`components/tempo/stages/ProspectingLeadSelectionStep.tsx:86-109`).

Restart resets the counter and all Prospecting draft state:

```ts
// app/api/student/simulation/restart/route.ts:152-172
const resetPayload: Record<string, unknown> = {
  current_stage: "lead_gen",
  total_score: 0,
  status: ATTEMPT_STATUS.IN_PROGRESS,
  completed_at: null,
  stage_data: null,
  lead_selection_attempts: 0,
};

await supabase
  .from("attempts")
  .update(resetPayload)
  .eq("id", attemptId);
```

### 3.4 Successful selection timing

On success, the route first resets any previous selected Lead for the attempt to `new`, then marks the chosen Lead `selected`:

```ts
// app/api/student/crm-leads/[leadId]/select/route.ts:101-132
await supabase
  .from("crm_leads")
  .update({ status: "new", updated_at: updatedAt })
  .eq("attempt_id", attemptId)
  .eq("status", "selected");

await supabase
  .from("crm_leads")
  .update({ status: "selected", updated_at: updatedAt })
  .eq("id", leadId);

return NextResponse.json({ success: true });
```

This step does **not** create Account, Contact, or Opportunity data. Those writes occur only when `complete-stage` later calls `convertLead()` after Opening Message submission. The directory research selection also has no automatic connection to this Lead; the student intentionally creates and fills the Lead separately.

## 4. Opening Message step

### 4.1 Fields and validation

The only authored field in this step is `openingMessage`. The UI also renders fixed context pills and non-interactive writing tips (`components/tempo/stages/ProspectingStepPanels.tsx:79-163`).

Word counting trims the string and splits on whitespace:

```ts
// lib/tempo-prospecting.ts:320-329
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}
```

Submission requires 20–120 words inclusive; no code verifies that the message actually mentions a trigger, leads with a business issue, includes a CTA, or has a professional tone (`lib/tempo-prospecting.ts:350-356`).

Also note that `canSubmitProspectingBrief()` does not re-check `selectedLeadId`. Normal navigation requires a selection to reach this step, but the final predicate itself checks only word count.

### 4.2 Transcript and badge relationship

The submitted transcript includes:

- all `companyChats`;
- `selectedCompanyId`;
- the active company's mirrored `chatMessages`;
- `openingMessage`;
- `selfCheck`.

It excludes `selectedLeadId`, `directoryCompanyIds`, `agentDesign`, and `agentCorrections` (`hooks/useProspectingWizard.ts:319-325`).

The entire JSON transcript is passed to GPT badge detection, so the model receives `openingMessage`. However, **no current Prospecting badge criterion explicitly awards a badge from the opening message itself**:

```ts
// lib/tempo-badges.ts:312-324
return `You are a sales coach evaluating a Tempo Prospecting stage submission
(JSON with chatMessages from an AI research agent, selfCheck, and draft openingMessage)
plus optional CRM log fields.

Badge criteria:
- pros_guardrails: chatMessages / selfCheck show ...
- pros_reusable_system: chatMessages show ...
- pros_directed_agent: chatMessages show ...
${crmCriteria}`;
```

`pros_real_trigger` and `pros_business_issue_led` are judged from converted CRM Lead fields, not from `openingMessage` (Section 6).

## 5. Stage completion — automatic conversion

### 5.1 Trigger path

The completion route runs conversion before badge detection, stage-score persistence, and attempt advancement:

```ts
// app/api/student/complete-stage/route.ts:53-84
if (stage === "prospecting") {
  const { data: selectedLead, error: selectedError } = await supabase
    .from("crm_leads")
    .select("id")
    .eq("attempt_id", attemptId)
    .eq("status", "selected")
    .maybeSingle();

  if (selectedError) {
    console.error("[complete-stage] could not load selected lead for auto-convert:", selectedError);
  } else if (!selectedLead) {
    console.error("[complete-stage] prospecting completed with no selected crm_leads row ...");
  } else {
    try {
      const convertResult = await convertLead(supabase, attemptId, selectedLead.id as string);
      if (!convertResult.success) {
        console.error("[complete-stage] auto-convert failed after wizard selection:", ...);
      }
    } catch (err) {
      console.error("[complete-stage] auto-convert threw:", err);
    }
  }
}
```

### 5.2 `convertLead()` writes

`convertLead()` reloads the Lead for the same attempt, returns success immediately if it is already converted, and otherwise revalidates company/contact identity:

```ts
// lib/tempo-lead-conversion.ts:45-68
const { data: lead, error: loadError } = await supabase
  .from("crm_leads")
  .select("id, attempt_id, status, company_name, contact_name, contact_title, why_fit, trigger_event")
  .eq("id", leadId)
  .eq("attempt_id", attemptId)
  .maybeSingle();

if (lead.status === "converted") {
  return { success: true };
}

const validation = validateLeadIdentity(companyName, contactName);
if (!validation.success) {
  return validation;
}
```

It then upserts the Account:

```ts
// lib/tempo-lead-conversion.ts:86-117
const accountFields: Record<string, string> = {
  accountName: companyName.trim(),
  industry: "",
  locations: "",
  region: "",
  primaryContact,
  whyFit,
  trigger: triggerEvent,
};

await supabase.from("crm_account_notes").upsert(
  {
    attempt_id: attemptId,
    notes: "",
    fields: accountFields,
    updated_at: updatedAt,
  },
  { onConflict: "attempt_id" }
);
```

It upserts the Dana contact:

```ts
// lib/tempo-lead-conversion.ts:119-139
const contactFields: Record<string, string> = {
  name: contactName.trim(),
  position: contactTitle,
};

await supabase.from("crm_contact_notes").upsert(
  {
    attempt_id: attemptId,
    contact_key: "dana_reyes",
    role: "",
    notes: "",
    fields: contactFields,
    updated_at: updatedAt,
  },
  { onConflict: "attempt_id,contact_key" }
);
```

Finally, it marks the Lead converted:

```ts
// lib/tempo-lead-conversion.ts:141-151
await supabase
  .from("crm_leads")
  .update({ status: "converted", updated_at: updatedAt })
  .eq("id", leadId);
```

No transaction wraps these three writes. A later failure can therefore leave earlier writes committed.

### 5.3 Failure behavior at completion

If the selected Lead is missing, fails identity revalidation, or conversion throws, `complete-stage` logs the problem and continues. It does **not** block completion.

After the conversion block, the route still detects badges, upserts `stage_scores`, and advances `attempts.current_stage`:

```ts
// app/api/student/complete-stage/route.ts:132-174
badgesEarned = await detectTempoBadges(stage, transcript, crmFields);

await supabase.from("stage_scores").upsert({
  attempt_id: attemptId,
  stage,
  score,
  feedback,
  transcript,
  badges_earned: badgesEarned,
});

const next = getNextStage(stage);
await supabase
  .from("attempts")
  .update({ current_stage: next, total_score: totalScore })
  .eq("id", attemptId);
```

This is an implementation gap relative to a strict “conversion must succeed” interpretation: current behavior is fail-open, not fail-closed. The logged message at `complete-stage/route.ts:68` still says a Discovery gate will block, but the current handoff is an optional CRM nudge rather than a conversion gate (`components/tempo/HandoffModal.tsx:64-75,185-217`).

## 6. Badge detection tie-in

All five Prospecting badges are GPT-judged. The route calls `detectTempoBadges()`, then stores returned IDs in `stage_scores.badges_earned`:

```ts
// app/api/student/complete-stage/route.ts:132-144
badgesEarned = await detectTempoBadges(stage, transcript, crmFields);

await supabase.from("stage_scores").upsert({
  // ...
  transcript,
  badges_earned: badgesEarned,
});
```

The evaluator uses `gpt-4o-mini` with JSON output:

```ts
// lib/tempo-badges.ts:519-538
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  max_tokens: MAX_BADGE_DETECTION_TOKENS,
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Evaluate the following material:\n\n${material}` },
  ],
});
```

### 6.1 `pros_guardrails`

**Source:** submitted Prospecting transcript, specifically evidence in `companyChats`/active `chatMessages` and `selfCheck`. No CRM query feeds this criterion.

```ts
// lib/tempo-badges.ts:316-319
- pros_guardrails: chatMessages / selfCheck show the student verifying claims or flagging unverified AI output, not blind trust of whatever the AI produced
```

The judgment is probabilistic GPT evaluation; there is no deterministic check that the student correctly caught the prompt's injected unsupported claim.

### 6.2 `pros_reusable_system`

**Source:** submitted research chat transcript only:

```ts
// lib/tempo-badges.ts:318
- pros_reusable_system: chatMessages show a generalized reusable research approach, not a one-off hardcoded lookup for this account only
```

Although wizard state still defines `agentDesign`, that field has no current UI and is omitted from the submission transcript (`lib/tempo-prospecting.ts:140-145`; `hooks/useProspectingWizard.ts:319-325`).

### 6.3 `pros_directed_agent`

**Source:** submitted research chat transcript only:

```ts
// lib/tempo-badges.ts:319
- pros_directed_agent: chatMessages show the student pushing back, correcting, or refining the AI's output — not just accepting the first response
```

`agentCorrections` exists in state but is not included in the submitted transcript (`lib/tempo-prospecting.ts:143-144`; `hooks/useProspectingWizard.ts:319-325`).

### 6.4 `pros_real_trigger`

**Source:** `trigger_event` from the **converted** `crm_leads` row:

```ts
// app/api/student/complete-stage/route.ts:96-108
const { data: convertedLead } = await supabase
  .from("crm_leads")
  .select("trigger_event, why_fit")
  .eq("attempt_id", attemptId)
  .eq("status", "converted")
  .maybeSingle();

crmFields = {
  trigger: String(convertedLead.trigger_event ?? ""),
  whyFit: String(convertedLead.why_fit ?? ""),
};
```

```ts
// lib/tempo-badges.ts:305-309
- pros_real_trigger: CRM trigger field is specific and credible (a real timing reason), not generic filler
```

It does not read the directory's `signal_hint` directly and does not use `openingMessage` as its declared source.

### 6.5 `pros_business_issue_led`

**Source:** `why_fit` from the same converted `crm_leads` query:

```ts
// lib/tempo-badges.ts:305-309
- pros_business_issue_led: CRM whyFit leads with a plausible business issue/pain for the account, not a feature pitch
```

If conversion did not produce a converted Lead, `crmFields` remains `null`, and both CRM-dependent Prospecting badges are removed from the allowed set:

```ts
// lib/tempo-badges.ts:371-408
const CRM_DEPENDENT_BADGE_IDS = {
  prospecting: ["pros_real_trigger", "pros_business_issue_led"],
  // ...
};

if (crmFields !== null || ...) {
  return base;
}
const excluded = new Set(CRM_DEPENDENT_BADGE_IDS[stage]);
return new Set(Array.from(base).filter((id) => !excluded.has(id)));
```

## 7. The prospect-directory generator

### 7.1 How generic is it?

The core generation API accepts a `DirectoryConfig` with target, decoys, pools, and arbitrary numeric comparison axes:

```ts
// scripts/generate-prospect-directory.ts:27-47
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
  // pools...
  comparableAxes: ComparableAxis[];
}
```

The core comparison loops do not branch on axis name; they iterate `config.comparableAxes` (`scripts/generate-prospect-directory.ts:98-151,167-197`).

However, the statement “zero hardcoded Tempo-specific content” is **not fully true**:

1. The CLI entry imports `tempoDirectorySeed` directly:

   ```ts
   // scripts/generate-prospect-directory.ts:382-396
   const { tempoDirectorySeed } = await import("./config/tempo-directory-seed");
   const result = await generateProspectDirectory(supabase, tempoDirectorySeed);
   ```

2. Generic filler signal text is hardcoded in the generator rather than supplied by config:

   ```ts
   // scripts/generate-prospect-directory.ts:64-70
   const FILLER_SIGNAL_HINTS = [
     "Steady operations with no notable public updates recently.",
     // ...
   ];
   ```

3. Filler contact formatting is hardcoded as a random initial plus configured surname (`scripts/generate-prospect-directory.ts:286-295`).
4. The exported parser is named `parseSizeNumber`, and `DirectoryConfig` still exposes `contactTitleSeniorityRank` (`scripts/generate-prospect-directory.ts:35-46,84-92`). The axis loop itself remains generic, but these names are concrete concepts in the generator's public surface.

The actual Tempo target, decoy descriptions, industry/name pools, and axis definitions live in `scripts/config/tempo-directory-seed.ts`.

### 7.2 Comparable axes

For each filler and each axis, the generator compares the candidate with the target. If the filler is at or above the target, it invokes that axis's regeneration strategy up to ten times:

```ts
// scripts/generate-prospect-directory.ts:104-148
for (const axis of config.comparableAxes) {
  const targetValue = axis.getValue(config.target, config);
  let fillerValue = axis.getValue(cappedCandidate, config);

  if (targetValue === null || fillerValue === null) {
    console.warn(...);
    continue;
  }
  if (fillerValue < targetValue) {
    continue;
  }
  if (!axis.regenerateFillerValue) {
    console.warn(...);
    continue;
  }

  for (let attempt = 0; attempt < FILLER_GUARD_RETRY_MAX; attempt += 1) {
    cappedCandidate = {
      ...cappedCandidate,
      ...axis.regenerateFillerValue(config),
    };
    // accept once fillerValue < targetValue
  }
}
```

Tempo defines two axes:

```ts
// scripts/config/tempo-directory-seed.ts:137-165
comparableAxes: [
  {
    name: "size",
    keywords: ["size", "location", "locations", "clinic", "clinics", "studio"],
    getValue: (entry) => parseSizeNumber(entry.sizeLocations),
    regenerateFillerValue: (config) => {
      const targetSize = parseSizeNumber(config.target.sizeLocations) ?? 8;
      const newSize =
        Math.floor(Math.random() * Math.max(1, targetSize - 1)) + 1;
      return { sizeLocations: `${newSize} locations` };
    },
  },
  {
    name: "seniority",
    keywords: ["senior", "director", "title", "seniority", "authority"],
    getValue: (entry, config) =>
      config.contactTitleSeniorityRank.indexOf(entry.contactTitle),
    regenerateFillerValue: (config) => {
      const targetRank = config.contactTitleSeniorityRank.indexOf(
        config.target.contactTitle
      );
      const validTitles = config.contactTitlePool.filter(
        (title) => config.contactTitleSeniorityRank.indexOf(title) < targetRank
      );
      const pick = validTitles[Math.floor(Math.random() * validTitles.length)];
      return { contactTitle: pick };
    },
  },
],
```

For the current Tempo config, both regeneration strategies produce values below the target: 1–7 locations versus 8, and a title ranked below Director of Operations.

### 7.3 Enforced guardrails and their limits

**Filler cap:** current Tempo fillers are regenerated below the target on both configured axes. Generically, though, “can never match/exceed” is stronger than the implementation guarantees. Missing values, a missing regeneration strategy, or ten failed retries produce warnings and allow generation to continue:

```ts
// scripts/generate-prospect-directory.ts:108-148
if (targetValue === null || fillerValue === null) {
  console.warn(...);
  continue;
}
if (!axis.regenerateFillerValue) {
  console.warn(...);
  continue;
}
// ...
if (!isCapped) {
  console.warn(...);
}
```

**Required rationale fields:** every crafted decoy must have non-empty `strongerAxis` and `weakerAxis`; missing either throws:

```ts
// scripts/generate-prospect-directory.ts:157-165
if (!decoy.strongerAxis?.trim()) {
  throw new Error(`Crafted decoy "${label}" is missing required field strongerAxis.`);
}
if (!decoy.weakerAxis?.trim()) {
  throw new Error(`Crafted decoy "${label}" is missing required field weakerAxis.`);
}
```

**At most one measurable win:** wins are axes where `decoyValue > targetValue`. More than one throws and names every winning axis:

```ts
// scripts/generate-prospect-directory.ts:167-179
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
```

**Declared-vs-measured strength:** when there is exactly one measurable win, the generator checks whether `strongerAxis` contains any configured keyword for that winning axis. A mismatch logs a warning; it does not throw:

```ts
// scripts/generate-prospect-directory.ts:188-197
const winningAxis = winningAxes[0];
const declaredStrength = decoy.strongerAxis.toLowerCase();
const referencesWinningAxis = winningAxis.keywords.some((keyword) =>
  declaredStrength.includes(keyword.toLowerCase())
);
if (!referencesWinningAxis) {
  console.warn(...);
}
```

Zero measurable wins also produce only a warning (`scripts/generate-prospect-directory.ts:181-185`). `weakerAxis` is required to be present but is not semantically compared with axis values.

### 7.4 Duplicate company-name prevention

The used-name set starts with the target and every crafted decoy, preventing fillers from exactly duplicating any of them:

```ts
// scripts/generate-prospect-directory.ts:260-284
const usedCompanyNames = new Set<string>([
  config.target.companyName,
  ...config.craftedDecoys.map((decoy) => decoy.companyName),
]);

const companyName = buildUniqueFillerCompanyName(config, suffixes, usedCompanyNames);
usedCompanyNames.add(companyName);
```

For a collision, the generator rerolls the prefix and later the suffix up to ten times. It then tries directional qualifiers before throwing:

```ts
// scripts/generate-prospect-directory.ts:228-257
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
  const qualified = `${candidate} — ${qualifier}`;
  if (!usedNames.has(qualified)) {
    return qualified;
  }
}
```

This is exact, case-sensitive string uniqueness. It does not normalize case/whitespace, test similar-looking names, or validate that target and crafted-decoy names are mutually unique.

### 7.5 Manual, one-time seeding

The generator is a manual CLI, not a gameplay service:

```ts
// scripts/generate-prospect-directory.ts:1-4,382-408
 * Runnable via: npx tsx scripts/generate-prospect-directory.ts
// ...
if (isMain) {
  runCli().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
```

It is idempotent at the simulation level: if any row already exists for `simulation_id`, it skips the whole seed:

```ts
// scripts/generate-prospect-directory.ts:306-325
const { count } = await supabase
  .from("crm_prospect_directory")
  .select("id", { count: "exact", head: true })
  .eq("simulation_id", config.simulationId);

if ((count ?? 0) > 0) {
  return { inserted: 0 };
}
```

No Next.js route, component, hook, package script, or build hook invokes it. `package.json:5-9` contains only `dev`, `build`, `start`, and `lint`. Live gameplay only reads the rows already present in Supabase.

## 8. Design rationale

### 8.1 Neutral company treatment

The exercise is meant to test account reasoning, not visual pattern recognition. If the true target had a special badge, ordering rule, color, or richer card, students could identify it without evaluating industry fit, scale, trigger quality, and buyer relevance. Neutral treatment makes the facts—not the UI—the source of the answer.

### 8.2 One scoped chat per company

A single chat spanning every company invites prompts such as “rank these accounts” or “tell me which one is correct.” That delegates the core exercise to the model. Company-scoped chat keeps the AI in a research-assistant role: it can help investigate one account's known facts, but the student must perform the cross-company comparison.

### 8.3 Manual research-to-CRM transcription

There is intentionally no button that turns AI research into a completed Lead. The learning objective includes the discipline of deciding what matters, writing a concise fit hypothesis, recording a real trigger, and naming a next step. Automatically copying AI output into CRM would remove that practice and encourage uncritical acceptance of generated claims.

### 8.4 One strength per crafted decoy

A crafted decoy may look better than the target on one dimension so the student must notice why that tempting signal is insufficient. Allowing the decoy to dominate on multiple dimensions muddies the lesson and can make it objectively preferable. The one-axis rule keeps each decoy focused on one teachable misconception.

### 8.5 Config-driven comparison axes

Size and title seniority happen to matter for Tempo, but another simulation may care about urgency, technical maturity, budget authority, geography, regulation, or completely different attributes. Keeping comparison in `comparableAxes` lets a simulation author define those measurements and regeneration strategies without adding per-axis branches to the generator's core loop.

### 8.6 Deterministic string matching

Lead selection compares two student-entered strings against fixed known answers. Levenshtein, prefix, and substring checks are deterministic, immediate, free, and easy to test. A GPT call would add latency, cost, nondeterminism, and prompt sensitivity to a closed-set matching problem that does not require open-ended judgment.
