import PlainspeakApp from "./PlainspeakApp";
import {
  DEMO_LEASE_DOC,
  DEMO_LEASE_RESULT,
  DEMO_LEASE_SITUATION,
} from "@/lib/demo-fixture";

// `?demo=fill` prefills the sample lease; `?demo=lease` also seeds the frozen
// real Claude result, all server-side so the recorded demo never races client
// hydration. Normal visitors (no `demo` param) get the empty app.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; focus?: string }>;
}) {
  const { demo, focus } = await searchParams;
  const prefill = demo === "fill" || demo === "lease";
  const focusCard =
    focus === "plain" || focus === "affects" || focus === "questions"
      ? focus
      : undefined;
  return (
    <PlainspeakApp
      initialDoc={prefill ? DEMO_LEASE_DOC : ""}
      initialSituation={prefill ? DEMO_LEASE_SITUATION : ""}
      initialResult={demo === "lease" ? DEMO_LEASE_RESULT : null}
      initialResultsView={demo === "lease"}
      focusCard={focusCard}
    />
  );
}
