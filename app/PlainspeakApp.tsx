"use client";

import { useState } from "react";
import type { Explanation, ReadingLevel } from "@/lib/explain";

const LEVELS: { id: ReadingLevel; label: string }[] = [
  { id: "child", label: "Like I'm 10" },
  { id: "plain", label: "Plain English" },
  { id: "detailed", label: "Full detail" },
];

const EXAMPLES: { label: string; situation: string; text: string }[] = [
  {
    label: "Apartment lease",
    situation: "I'm the tenant",
    text: `LEASE AGREEMENT. The Tenant shall pay rent of $2,400 per month, due on the 1st. A late fee of $150 applies if rent is received after the 3rd. Landlord may increase rent by up to 12% upon renewal with 30 days' notice. The security deposit of $4,800 is non-refundable if the Tenant vacates before the 12-month term ends. Tenant is responsible for all repairs under $500. Landlord may enter the premises with 24 hours' notice. This lease auto-renews unless either party gives 60 days' written notice.`,
  },
  {
    label: "Medical letter",
    situation: "I'm the patient",
    text: `Following your recent visit, your lipid panel indicates an LDL-C of 165 mg/dL and triglycerides of 220 mg/dL, consistent with hyperlipidemia. We recommend initiating atorvastatin 20mg nightly and a follow-up panel in 12 weeks. Please monitor for myalgia. Your HbA1c of 5.9% places you in the pre-diabetic range; lifestyle modification is advised. Contact the clinic if you experience unexplained muscle pain or dark urine.`,
  },
  {
    label: "Terms of service",
    situation: "I'm a new user signing up",
    text: `By creating an account you grant us a perpetual, irrevocable, worldwide license to use, reproduce, and create derivative works from any content you upload. We may share your data with third-party partners for marketing. Disputes are resolved by binding arbitration; you waive the right to a class action. We may terminate your account at any time without notice. Fees are non-refundable. We reserve the right to modify these terms at any time, and continued use constitutes acceptance.`,
  },
];

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  low: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

export default function PlainspeakApp({
  initialDoc = "",
  initialSituation = "",
  initialResult = null,
  initialResultsView = false,
  focusCard,
}: {
  initialDoc?: string;
  initialSituation?: string;
  initialResult?: Explanation | null;
  initialResultsView?: boolean;
  // Recorded-demo only: render just one result card full-screen so the
  // narrated card is never hidden behind the caption band.
  focusCard?: "plain" | "affects" | "questions";
}) {
  const [doc, setDoc] = useState(initialDoc);
  const [situation, setSituation] = useState(initialSituation);
  const [level, setLevel] = useState<ReadingLevel>("plain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Explanation | null>(initialResult);
  // ?demo=lease seeds this true server-side so the recorded walkthrough shows a
  // results-focused layout with no hydration race.
  const [resultsView, setResultsView] = useState(initialResultsView);

  function loadExample(e: (typeof EXAMPLES)[number]) {
    setDoc(e.text);
    setSituation(e.situation);
    setResult(null);
    setError(null);
  }

  async function explain() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: doc, readingLevel: level, situation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data as Explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
      <header className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          AI that reads the fine print for you
        </div>
        <h1 className="bg-gradient-to-r from-violet-300 via-white to-sky-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          Plainspeak
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-balance text-white/60">
          Paste any confusing document. Get it in plain words, the parts that
          actually affect <em>you</em>, and the questions you should ask before
          you sign.
        </p>
      </header>

      {!resultsView && (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/40 backdrop-blur sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/40">Try one:</span>
            {EXAMPLES.map((e, i) => (
              <button
                key={e.label}
                data-demo={`example-${i}`}
                onClick={() => loadExample(e)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-white/25 hover:text-white"
              >
                {e.label}
              </button>
            ))}
          </div>

          <textarea
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            placeholder="Paste a lease, a medical letter, terms of service, a government form…"
            rows={7}
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/90 outline-none transition placeholder:text-white/30 focus:border-violet-400/50"
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-white/40">
                Your situation (optional)
              </label>
              <input
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. I'm the tenant"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition placeholder:text-white/30 focus:border-violet-400/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/40">
                Explain it…
              </label>
              <div className="inline-flex rounded-lg border border-white/10 bg-black/30 p-0.5">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLevel(l.id)}
                    className={`rounded-md px-3 py-1.5 text-xs transition ${
                      level === l.id
                        ? "bg-violet-500/30 text-white"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            id="explain-btn"
            onClick={explain}
            disabled={loading || !doc.trim()}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <span className="size-4 rounded-full border-2 border-white/40 border-t-white spin" />
                Reading it for you…
              </>
            ) : (
              "Make it plain"
            )}
          </button>

          {error && (
            <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
              {error}
            </p>
          )}
        </section>
      )}

      {resultsView && (
        <div className="mt-8 flex items-center justify-center text-sm text-white/50">
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            Reading: <span className="text-white/80">Apartment lease</span> ·
            explained for a tenant
          </span>
        </div>
      )}

      {result && (
        <section id="results" className="mt-6 space-y-4 rise">
          {(!focusCard || focusCard === "plain") && (
            <Card
              id="card-plain"
              title="In plain words"
              accent="from-violet-400 to-violet-600"
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {result.plain}
              </p>
            </Card>
          )}

          {(!focusCard || focusCard === "affects") &&
            result.affectsYou.length > 0 && (
            <Card
              id="card-affects"
              title="What affects you"
              accent="from-rose-400 to-amber-500"
            >
              <ul className="space-y-2.5">
                {result.affectsYou.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        SEVERITY_STYLES[item.severity] ?? SEVERITY_STYLES.medium
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-white/80">{item.point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {(!focusCard || focusCard === "questions") &&
            result.questions.length > 0 && (
            <Card
              id="card-questions"
              title="Questions to ask"
              accent="from-sky-400 to-emerald-500"
            >
              <ul className="space-y-2">
                {result.questions.map((q, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-white/80"
                  >
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-sky-400" />
                    {q}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <p className="px-1 text-center text-xs text-white/30">
            Plainspeak helps you understand a document. It is not legal or
            medical advice.
          </p>
        </section>
      )}

      <footer className="mt-12 text-center text-xs text-white/30">
        Built for FutureAI Global Hackathon 2026 · Powered by Claude
      </footer>
    </main>
  );
}

function Card({
  id,
  title,
  accent,
  children,
}: {
  id?: string;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
    >
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <span className={`h-4 w-1 rounded-full bg-gradient-to-b ${accent}`} />
        {title}
      </h2>
      {children}
    </div>
  );
}
