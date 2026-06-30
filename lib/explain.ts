// Core logic for Plainspeak: prompt construction + robust parsing of the model's
// reply. Kept free of any network/SDK code so it is unit-testable in isolation.

export type ReadingLevel = "child" | "plain" | "detailed";

export interface ExplainRequest {
  document: string;
  readingLevel: ReadingLevel;
  /** Optional free-text persona, e.g. "I'm a tenant" or "I'm the patient". */
  situation?: string;
}

export type Severity = "high" | "medium" | "low";

export interface AffectsYouItem {
  point: string;
  severity: Severity;
}

export interface Explanation {
  plain: string;
  affectsYou: AffectsYouItem[];
  questions: string[];
}

const READING_LEVEL_GUIDANCE: Record<ReadingLevel, string> = {
  child:
    "Explain as if to a bright 10-year-old. Short sentences. No jargon. Use everyday comparisons.",
  plain:
    "Explain in plain English a busy adult can grasp in one read. Define any unavoidable term inline.",
  detailed:
    "Explain thoroughly for someone who wants the full picture, but still in plain language, not legalese.",
};

export function buildSystemPrompt(req: ExplainRequest): string {
  const persona = req.situation?.trim()
    ? `The reader's situation: "${req.situation.trim()}". Tailor "what affects you" and the questions to THIS reader specifically.`
    : `The reader's situation is unknown. Infer the most likely affected party and address them directly.`;

  return [
    "You are Plainspeak, a tool that makes dense, confusing documents understandable to ordinary people.",
    "You help people who feel intimidated by legal, medical, financial, or bureaucratic language.",
    READING_LEVEL_GUIDANCE[req.readingLevel],
    persona,
    "Never invent facts that are not in the document. If the document is unclear, say so plainly.",
    "You are not a lawyer or doctor and must not present this as professional advice.",
    "",
    "Respond with ONLY a JSON object, no prose before or after, in exactly this shape:",
    "{",
    '  "plain": "a clear plain-language explanation of what this document is and says",',
    '  "affects_you": [{"point": "a specific thing in the document that affects the reader", "severity": "high|medium|low"}],',
    '  "questions": ["a specific question the reader should ask the other party before agreeing or acting"]',
    "}",
    "Give 3-6 affects_you items (most important first) and 3-5 questions.",
  ].join("\n");
}

export function buildUserPrompt(req: ExplainRequest): string {
  return `Here is the document. Make it plain.\n\n"""\n${req.document.trim()}\n"""`;
}

const VALID_SEVERITY: Severity[] = ["high", "medium", "low"];

/**
 * Pull a JSON object out of a model reply that may be wrapped in code fences or
 * surrounded by stray prose, then coerce it into a well-formed Explanation.
 * Throws if no JSON object can be recovered at all.
 */
export function parseExplanation(raw: string): Explanation {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model reply");
  }
  const slice = raw.slice(start, end + 1);

  let obj: unknown;
  try {
    obj = JSON.parse(slice);
  } catch (err) {
    throw new Error(`Model reply was not valid JSON: ${(err as Error).message}`);
  }

  const record = obj as Record<string, unknown>;

  const plain = typeof record.plain === "string" ? record.plain.trim() : "";

  const affectsYou: AffectsYouItem[] = Array.isArray(record.affects_you)
    ? record.affects_you
        .map((item): AffectsYouItem | null => {
          if (item && typeof item === "object") {
            const r = item as Record<string, unknown>;
            const point = typeof r.point === "string" ? r.point.trim() : "";
            if (!point) return null;
            const sev = VALID_SEVERITY.includes(r.severity as Severity)
              ? (r.severity as Severity)
              : "medium";
            return { point, severity: sev };
          }
          if (typeof item === "string" && item.trim()) {
            return { point: item.trim(), severity: "medium" };
          }
          return null;
        })
        .filter((x): x is AffectsYouItem => x !== null)
    : [];

  const questions: string[] = Array.isArray(record.questions)
    ? record.questions
        .map((q) => (typeof q === "string" ? q.trim() : ""))
        .filter((q) => q.length > 0)
    : [];

  if (!plain && affectsYou.length === 0 && questions.length === 0) {
    throw new Error("Model reply had none of the expected fields");
  }

  // Surface the riskiest clauses first. Array.sort is stable, so the model's
  // "most important first" ordering is preserved within each severity tier.
  const severityRank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  affectsYou.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return { plain, affectsYou, questions };
}
