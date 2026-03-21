import { useState } from "react";
import { C } from "../lib/theme";
import { fetchAISummary } from "../lib/aiSummary";
import { exportSimPDF } from "../lib/exportUtils";
import { Card, Btn } from "../components/ui";

export default function AIPage({ simulations, setSimulations, aiContext }) {
  const [selIdx, setSelIdx]   = useState(simulations.length - 1);
  const [template, setTemplate] = useState("executive");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [copied, setCopied]   = useState(false);

  const sim = simulations[selIdx];

  const generate = async () => {
    if (!sim) return;
    setLoading(true);
    setSummary("");
    try {
      const text = await fetchAISummary(sim.result, sim.name, template);
      setSummary(text);
      setSimulations(s => s.map((x, i) => i === selIdx ? { ...x, aiSummary: text } : x));
    } catch {
      setSummary(
        `⚠ Could not connect to AI. Showing mock summary:\n\n` +
        `**Executive Summary**: Based on the simulation, the P50 scenario projects ${sim.result?.p50?.runway} months of runway with ${sim.result?.survivalRate}% survival probability.\n\n` +
        `**Action Items**:\n` +
        `1) Accelerate revenue by targeting enterprise contracts (High impact, Medium effort).\n` +
        `2) Reduce burn by deferring non-critical hires (Medium impact, Low effort).\n` +
        `3) Review pricing model — a 5% increase could extend runway by ~2 months (Medium impact, Low effort).\n\n` +
        `**CEO Email Subject**: Q2 Financial Outlook — ${sim.result?.survivalRate}% path to profitability identified`
      );
    }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TEMPLATES = ["executive", "bullet", "email"];
  const TEMPLATE_LABELS = { executive: "📋 Executive Summary", bullet: "• Bullet Analysis", email: "📧 Email Draft" };

  if (!simulations.length) {
    return (
      <div style={{ padding: 24 }}>
        <div className="fu" style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>🤖 AI Insights</h1>
        </div>
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
          <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No simulations yet</h3>
          <p style={{ color: C.muted, fontSize: 14 }}>Run a simulation first to generate AI CFO insights.</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="fu" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>🤖 AI CFO Insights</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Powered by Claude · Executive-grade analysis</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
        {/* Left panel */}
        <div>
          <Card style={{ marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📁 Select Simulation</h3>
            {simulations.map((s, i) => (
              <button key={i} onClick={() => { setSelIdx(i); setSummary(s.aiSummary || ""); }}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${selIdx === i ? C.accent : C.border}`, background: selIdx === i ? C.accent + "10" : "transparent", color: selIdx === i ? C.accent : C.textSoft, textAlign: "left", cursor: "pointer", fontFamily: "'Sora',sans-serif", marginBottom: 6, fontSize: 13, fontWeight: selIdx === i ? 600 : 400, transition: "all .2s" }}>
                <p style={{ fontWeight: 600 }}>{s.name}</p>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.date} · P50: {s.result?.p50?.runway}mo</p>
                {s.aiSummary && <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>✓ Summary saved</span>}
              </button>
            ))}
          </Card>

          <Card>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📝 Summary Style</h3>
            {TEMPLATES.map(t => (
              <button key={t} onClick={() => setTemplate(t)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${template === t ? C.accent2 : C.border}`, background: template === t ? C.accent2 + "10" : "transparent", color: template === t ? C.accent2 : C.textSoft, textAlign: "left", cursor: "pointer", fontFamily: "'Sora',sans-serif", marginBottom: 6, fontSize: 13, fontWeight: template === t ? 600 : 400 }}>
                {TEMPLATE_LABELS[t]}
              </button>
            ))}
            <Btn onClick={generate} disabled={loading || !sim} style={{ width: "100%", marginTop: 8 }}>
              {loading ? "⏳ Generating..." : summary ? "🔄 Regenerate" : "✨ Generate Summary"}
            </Btn>
          </Card>
        </div>

        {/* Right panel */}
        <div>
          {sim && (
            <Card style={{ marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {[
                  { l: "P10 Runway", v: `${sim.result?.p10?.runway}mo`, c: C.rose },
                  { l: "P50 Runway", v: `${sim.result?.p50?.runway}mo`, c: C.amber },
                  { l: "P90 Runway", v: `${sim.result?.p90?.runway}mo`, c: C.green },
                  { l: "Survival",   v: `${sim.result?.survivalRate}%`, c: parseFloat(sim.result?.survivalRate) > 70 ? C.green : C.rose },
                ].map((k, i) => (
                  <div key={i} style={{ background: k.c + "10", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{k.l}</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: k.c, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{k.v}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card style={{ minHeight: 360 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14 }}>{TEMPLATE_LABELS[template]}</h3>
              {summary && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={copy} variant="outline" size="sm">{copied ? "✅ Copied!" : "📋 Copy"}</Btn>
                  <Btn onClick={() => exportSimPDF(sim.result, sim.name, summary)} variant="ghost" size="sm">📄 Export PDF</Btn>
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[100, 80, 90, 70, 85].map((w, i) => (
                  <div key={i} className="shimmer" style={{ height: 18, borderRadius: 6, width: `${w}%` }} />
                ))}
                <p style={{ color: C.muted, fontSize: 13, marginTop: 8, textAlign: "center" }}>Claude is analysing your simulation…</p>
              </div>
            ) : summary ? (
              <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.75, color: C.textSoft, background: C.bg, padding: 18, borderRadius: 12, border: `1px solid ${C.border}` }}>
                {summary}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 12 }}>
                <span style={{ fontSize: 48 }}>🧠</span>
                <p style={{ color: C.muted, fontSize: 14, textAlign: "center" }}>Select a simulation and template,<br />then click Generate Summary</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
