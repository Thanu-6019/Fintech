import { fmt } from "./utils";

const TEMPLATES = {
  executive: "Provide: 1) 2-sentence executive summary, 2) 3 prioritized action items with expected impact, 3) one-line email subject to CEO. Max 180 words. Professional CFO tone.",
  bullet:    "Provide a bullet-point analysis: risks (3 bullets), opportunities (3 bullets), immediate actions (3 bullets). Max 150 words.",
  email:     "Draft a concise email to stakeholders summarizing the simulation. Include subject line, greeting, 3-paragraph body (situation, outlook, recommendations), and sign-off. Max 200 words.",
};

/**
 * Calls the Anthropic API to generate an AI CFO summary for a simulation.
 * @param {object} simResult - Result object from runMonteCarlo()
 * @param {string} simName   - Name of the simulation
 * @param {string} template  - "executive" | "bullet" | "email"
 */
export async function fetchAISummary(simResult, simName, template = "executive") {
  const { p10, p50, p90, survivalRate, avgRunway } = simResult;

  const prompt = `You are a senior startup CFO analyzing simulation results for "${simName}".

Key metrics:
- P10 (pessimistic) runway: ${p10.runway} months, cash: ${fmt(p10.finalCash)}
- P50 (base case) runway: ${p50.runway} months, cash: ${fmt(p50.finalCash)}
- P90 (optimistic) runway: ${p90.runway} months, cash: ${fmt(p90.finalCash)}
- Survival rate: ${survivalRate}% of scenarios are cash-positive
- Average runway across all scenarios: ${avgRunway} months

${TEMPLATES[template] || TEMPLATES.executive}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  return data.content?.[0]?.text || "Unable to generate summary.";
}
