/**
 * prospect-research-chat/route.ts
 * Authenticated, company-scoped Prospecting research chat.
 * Builds prompts from server-only directory data so hidden_claim never reaches
 * the browser.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireStudentApi } from "@/lib/api-auth";
import { MAX_TOKENS } from "@/lib/constants";
import {
  buildServerScopedResearchPrompt,
  type ProspectDirectoryCompanyRow,
  type ProspectDirectoryContact,
} from "@/lib/tempo-prospect-directory";
import { createServiceClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/types";

type ProspectResearchChatBody = {
  attemptId?: unknown;
  companyId?: unknown;
  messages?: unknown;
  newMessage?: unknown;
};

type StageDataBag = {
  directoryCompanyIds?: unknown;
};

/**
 * Keeps only the user/assistant text history accepted by the model.
 */
function parseMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(
      (message): message is ChatMessage =>
        Boolean(message) &&
        typeof message === "object" &&
        (message as ChatMessage).role !== undefined &&
        ((message as ChatMessage).role === "user" ||
          (message as ChatMessage).role === "assistant") &&
        typeof (message as ChatMessage).content === "string"
    )
    .slice(-50)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 8_000),
    }));
}

/**
 * POST /api/student/prospect-research-chat
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireStudentApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = (await request.json()) as ProspectResearchChatBody;
    const attemptId =
      typeof body.attemptId === "string" ? body.attemptId.trim() : "";
    const companyId =
      typeof body.companyId === "string" ? body.companyId.trim() : "";
    const newMessage =
      typeof body.newMessage === "string" ? body.newMessage.trim() : "";

    if (!attemptId || !companyId || !newMessage) {
      return NextResponse.json(
        { error: "attemptId, companyId, and newMessage are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured." },
        { status: 500 }
      );
    }

    const supabase = createServiceClient();
    const { data: attempt, error: attemptError } = await supabase
      .from("attempts")
      .select("id, simulation_id, stage_data")
      .eq("id", attemptId)
      .eq("student_id", auth.session.studentId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    }

    const stageData = (attempt.stage_data ?? {}) as StageDataBag;
    const directoryCompanyIds = Array.isArray(stageData.directoryCompanyIds)
      ? stageData.directoryCompanyIds.filter(
          (id): id is string => typeof id === "string"
        )
      : [];
    if (
      directoryCompanyIds.length > 0 &&
      !directoryCompanyIds.includes(companyId)
    ) {
      return NextResponse.json(
        { error: "Company is not in this attempt's directory." },
        { status: 404 }
      );
    }

    const { data: company, error: companyError } = await supabase
      .from("crm_prospect_directory")
      .select(
        "id, company_name, industry, size_locations, signal_hint, hidden_claim, entry_type"
      )
      .eq("id", companyId)
      .eq("simulation_id", String(attempt.simulation_id))
      .eq("is_active", true)
      .maybeSingle();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    const { data: contactRows, error: contactsError } = await supabase
      .from("crm_prospect_contacts")
      .select("contact_name, contact_title, department")
      .eq("company_id", companyId);

    if (contactsError) {
      throw new Error(`Could not load prospect contacts: ${contactsError.message}`);
    }

    const contacts: ProspectDirectoryContact[] = (contactRows ?? [])
      .map((contact) => ({
        name: String(contact.contact_name ?? ""),
        title: String(contact.contact_title ?? ""),
        department: String(contact.department ?? ""),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const internalCompany: ProspectDirectoryCompanyRow = {
      id: String(company.id),
      name: String(company.company_name ?? ""),
      industry: String(company.industry ?? ""),
      sizeLabel: String(company.size_locations ?? ""),
      signalHint: String(company.signal_hint ?? ""),
      hiddenClaim:
        typeof company.hidden_claim === "string" ? company.hidden_claim : null,
      contacts,
      isTarget: company.entry_type === "target",
    };

    const prior = parseMessages(body.messages);
    const priorStudentMessageCount = prior.filter(
      (message) => message.role === "user"
    ).length;
    const systemPrompt = buildServerScopedResearchPrompt(
      internalCompany,
      priorStudentMessageCount
    );

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: systemPrompt },
        ...prior.map(
          (message): OpenAI.Chat.ChatCompletionMessageParam => ({
            role: message.role,
            content: message.content,
          })
        ),
        { role: "user", content: newMessage.slice(0, 8_000) },
      ],
    });

    const reply =
      response.choices[0]?.message?.content?.trim() ||
      "I could not find a grounded answer to that.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[prospect-research-chat] unexpected:", error);
    return NextResponse.json(
      { error: "Could not generate a research response." },
      { status: 500 }
    );
  }
}
