// Deterministic demo fixture for the recorded walkthrough. The result below is a
// REAL Claude (claude-sonnet-4-6, temperature 0) response to the sample lease,
// captured once and frozen so the demo renders instantly and identically every
// run. The live app generates this same shape on demand from the API route.

import type { Explanation } from "./explain";

export const DEMO_LEASE_DOC = `LEASE AGREEMENT. The Tenant shall pay rent of $2,400 per month, due on the 1st. A late fee of $150 applies if rent is received after the 3rd. Landlord may increase rent by up to 12% upon renewal with 30 days' notice. The security deposit of $4,800 is non-refundable if the Tenant vacates before the 12-month term ends. Tenant is responsible for all repairs under $500. Landlord may enter the premises with 24 hours' notice. This lease auto-renews unless either party gives 60 days' written notice.`;

export const DEMO_LEASE_SITUATION = "I'm the tenant";

export const DEMO_LEASE_RESULT: Explanation = {
  plain:
    "This is a rental contract between you (the tenant) and a landlord. Here are the key terms: You pay $2,400 a month, due on the 1st of each month. If it arrives after the 3rd, you owe an extra $150. Your security deposit is $4,800, but if you leave before 12 months are up, you lose the entire amount, no matter the reason. You are on the hook for any repair that costs less than $500 (things like a broken faucet or a faulty light fixture). The landlord can walk into your home with just 24 hours' notice. When your lease year ends, it automatically starts again for another year unless you or the landlord send a written notice at least 60 days before the end date. At renewal, the landlord can raise your rent by as much as 12%, on $2,400 that would be up to $288 more per month.",
  affectsYou: [
    {
      point:
        "Your $4,800 security deposit is completely non-refundable if you leave for any reason before the full 12 months are up, even if there is no damage to the unit.",
      severity: "high",
    },
    {
      point:
        "You personally must pay for any repair under $500. This could add up quickly if multiple small things break in the same month.",
      severity: "high",
    },
    {
      point:
        "The lease auto-renews every year. If you don't send written notice 60 days before your end date, you are locked in for another full year.",
      severity: "high",
    },
    {
      point:
        "At renewal, your rent can jump by up to 12% (up to $288/month more) with only 30 days' notice, less time than the 60 days you need to give to leave.",
      severity: "medium",
    },
    {
      point:
        "A $150 late fee kicks in if your payment arrives even one day late (after the 3rd). That's a 6.25% penalty on one month's rent.",
      severity: "medium",
    },
    {
      point:
        "The landlord can enter your home with just 24 hours' notice. The document does not say what counts as valid notice (text, email, letter) or limit the hours they can enter.",
      severity: "low",
    },
  ],
  questions: [
    "If I need to break the lease early due to a serious reason (job loss, medical emergency, etc.), is there any circumstance under which I can get any portion of the $4,800 security deposit back?",
    "What exactly counts as written notice for the 60-day auto-renewal cancellation, does an email work, or does it have to be a physical letter sent a specific way?",
    "For repairs under $500, am I required to use specific contractors, or can I choose my own? And do I need your approval before making the repair?",
    "How will you give 24-hour entry notice, text, email, phone call, and are there restricted hours when you will not enter?",
    "Can you confirm in writing the exact date my 12-month lease term ends, so I know the deadline for sending my 60-day notice?",
  ],
};
