import { useState } from "react";
import { AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { C } from "../lib/theme";
import { fmt, fmtK } from "../lib/utils";
import { runMonteCarlo } from "../lib/simulation";
import { exportCSV, exportSimPDF } from "../lib/exportUtils";
import { Card, Btn, KpiCard, Alert, Input, Slider, ProgressBar } from "../components/ui";

const CASH_RESERVE_DEFAULT = 5000000;

const PRESETS = [
  { name: "Conservative",     revenueDelta: 2,  expenseDelta: 1,   hireDelta: 0,  priceDelta: 0 },
  { name: "Aggressive Growth",revenueDelta: 15, expenseDelta: 12,  hireDelta: 5,  priceDelta: 5 },
  { name: "Cost Cutting",     revenueDelta: 0,  expenseDelta: -8,  hireDelta: -2, priceDelta: 3 },
];

export default function SimulationPage({ role, simulations, setSimulations, setPage, setAiContext }) {
  const [inputs, setInputs] = useState({
    name: "Q2 Growth Scenario", months: 12, revenueDelta: 5, expenseDelta: 3,
    hireDelta: 2, priceDelta: 2, currentRevenue: 500000, currentBurn: 380000,
    cashReserve: CASH_RESERVE_DEFAULT,
  });
  const [result, setResult]       = useState(null);
  const [running, setRunning]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [activeTab, setActiveTab] = useState("cash");

  const inp = (k, v) => setInputs(p => ({ ...p, [k]: v }));

  const runSim = () => {
    if (role === "viewer") return;
    setRunning(true); setProgress(0); setResult(null);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 8;
      setProgress(Math.min(p, 95));
      if (p >= 95) clearInterval(iv);
    }, 180);
    setTimeout(() => {
      const r = runMonteCarlo(inputs);
      setResult(r);
      setProgress(100);
      setRunning(false);
      clearInterval(iv);
      const newSim = { id: Date.now(), name: inputs.name, inputs: { ...inputs }, result: r, date: new Date().toLocaleDateString("en-IN"), aiSummary: null };
      setSimulations(s => [...s, newSim]);
      setAiContext(newSim);
    }, 2400);
  };

  const tabs = ["cash", "revenue", "burn"];

  return (
    <div style={{ padding: 24 }}>
      <div className="fu" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>🧪 Simulation Studio</h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Monte Carlo what-if engine · N=200 scenarios</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => setInputs(prev => ({ ...prev, ...p, name: p.name + " Scenario" }))}
              style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.textSoft, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {role === "viewer" && <Alert type="warning">You have viewer access — simulation runs are disabled. Contact your admin to upgrade.</Alert>}

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        {/* Left: controls */}
        <div>
          <Card style={{ marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>⚙️ Configuration</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Simulation Name</label>
              <input value={inputs.name} onChange={e => inp("name", e.target.value)}
                style={{ width: "100%", padding: "9px 11px", border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 14, background: C.bg, color: C.text, fontFamily: "'Sora',sans-serif" }} />
            </div>
            <Input label="Time Horizon (months)"      value={inputs.months}         onChange={v => inp("months",        parseInt(v) || 1)}         type="number" />
            <Input label="Current Monthly Revenue"    value={inputs.currentRevenue} onChange={v => inp("currentRevenue", parseFloat(v) || 0)}        type="number" prefix="₹" />
            <Input label="Current Monthly Burn"       value={inputs.currentBurn}    onChange={v => inp("currentBurn",    parseFloat(v) || 0)}        type="number" prefix="₹" />
            <Input label="Cash Reserve"               value={inputs.cashReserve}    onChange={v => inp("cashReserve",    parseFloat(v) || 0)}        type="number" prefix="₹" />
          </Card>
          <Card style={{ marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>🎛 Adjustment Sliders</h3>
            <Slider label="Revenue Growth Delta" value={inputs.revenueDelta} onChange={v => inp("revenueDelta", v)} min={-20} max={40}  color={C.green} />
            <Slider label="Expense Change Delta" value={inputs.expenseDelta} onChange={v => inp("expenseDelta", v)} min={-30} max={30}  color={C.rose} />
            <Slider label="New Hires"            value={inputs.hireDelta}    onChange={v => inp("hireDelta",    v)} min={0}   max={20} step={1} color={C.amber} unit=" ppl" />
            <Slider label="Price Adjustment"     value={inputs.priceDelta}   onChange={v => inp("priceDelta",   v)} min={-15} max={25}  color={C.teal} />
          </Card>
          <Btn onClick={runSim} disabled={running || role === "viewer"} style={{ width: "100%" }} size="lg">
            {running ? `⏳ Running… ${Math.round(progress)}%` : "▶ Run Monte Carlo Simulation"}
          </Btn>
          {running && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 6 }}>
                <span>Running 200 scenarios…</span><span>{Math.round(progress)}%</span>
              </div>
              <ProgressBar value={progress} max={100} color={C.accent} height={6} />
            </div>
          )}
        </div>

        {/* Right: results */}
        <div>
          {result ? (
            <>
              <div className="fu" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "P10 Runway", value: `${result.p10.runway} mo`, sub: fmt(result.p10.finalCash), color: C.rose,  icon: "📉" },
                  { label: "P50 Runway", value: `${result.p50.runway} mo`, sub: fmt(result.p50.finalCash), color: C.amber, icon: "📊" },
                  { label: "P90 Runway", value: `${result.p90.runway} mo`, sub: fmt(result.p90.finalCash), color: C.green, icon: "📈" },
                ].map((k, i) => <KpiCard key={i} {...k} />)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <KpiCard label="Survival Rate" value={`${result.survivalRate}%`} color={parseFloat(result.survivalRate) > 70 ? C.green : C.rose} icon="🎲" sub="Cash-positive scenarios" />
                <KpiCard label="Avg Runway"    value={`${result.avgRunway} mo`}  color={C.teal}  icon="⛽" sub="Across all 200 runs" />
              </div>

              {parseFloat(result.survivalRate) < 50 && <Alert type="danger">Only {result.survivalRate}% of scenarios survive! Consider the Cost Cutting preset or request an AI recommendation.</Alert>}
              {result.p50.runway <= 3 && <Alert type="warning">Base case runway is only {result.p50.runway} months — critically low. Immediate financial restructuring recommended.</Alert>}

              <Card style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 14 }}>📉 Projected Outcomes</h3>
                  <div style={{ display: "flex", gap: 6 }}>
                    {tabs.map(t => (
                      <button key={t} onClick={() => setActiveTab(t)}
                        style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${activeTab === t ? C.accent : C.border}`, background: activeTab === t ? C.accent : "transparent", color: activeTab === t ? "#fff" : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", textTransform: "capitalize" }}>
                        {t === "cash" ? "Cash Flow" : t === "revenue" ? "Revenue" : "Burn"}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  {activeTab === "cash" ? (
                    <AreaChart data={result.chartData}>
                      <defs>
                        <linearGradient id="p90g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.2} /><stop offset="95%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                        <linearGradient id="p10g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.rose}  stopOpacity={0.15} /><stop offset="95%" stopColor={C.rose}  stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} />
                      <YAxis tickFormatter={v => fmtK(v)} tick={{ fontSize: 11, fill: C.muted }} />
                      <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <ReferenceLine y={0} stroke={C.rose} strokeDasharray="4 4" strokeWidth={1.5} />
                      <Area type="monotone" dataKey="p90" stroke={C.green} strokeWidth={2}   fill="url(#p90g)" name="P90 (Optimistic)" />
                      <Area type="monotone" dataKey="p50" stroke={C.amber} strokeWidth={2.5} fill="none"        name="P50 (Base)" />
                      <Area type="monotone" dataKey="p10" stroke={C.rose}  strokeWidth={2}   fill="url(#p10g)" name="P10 (Pessimistic)" />
                      <Legend />
                    </AreaChart>
                  ) : activeTab === "revenue" ? (
                    <LineChart data={result.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} />
                      <YAxis tickFormatter={v => fmtK(v)} tick={{ fontSize: 11, fill: C.muted }} />
                      <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="revenue" stroke={C.accent} strokeWidth={2.5} dot={false} name="Revenue (P50)" />
                    </LineChart>
                  ) : (
                    <LineChart data={result.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} />
                      <YAxis tickFormatter={v => fmtK(v)} tick={{ fontSize: 11, fill: C.muted }} />
                      <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="burn" stroke={C.rose} strokeWidth={2.5} dot={false} name="Burn Rate (P50)" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </Card>

              <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={() => setPage("ai")}                                             variant="outline" style={{ flex: 1 }}>🤖 Get AI Summary</Btn>
                <Btn onClick={() => exportSimPDF(result, inputs.name, null)}                   variant="ghost"   style={{ flex: 1 }}>📄 Export Report</Btn>
                <Btn onClick={() => exportCSV(result.chartData, `${inputs.name}.csv`)}         variant="ghost"   style={{ flex: 1 }}>📊 Export CSV</Btn>
              </div>
            </>
          ) : (
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16 }}>
              <div style={{ fontSize: 56 }}>🧪</div>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>Ready to simulate</h3>
              <p style={{ color: C.muted, fontSize: 14, textAlign: "center", maxWidth: 340 }}>Configure your scenario on the left. We'll run 200 Monte Carlo iterations to project P10, P50, and P90 outcomes.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {PRESETS.map((p, i) => (
                  <Btn key={i} onClick={() => setInputs(prev => ({ ...prev, ...p, name: p.name + " Scenario" }))} variant="outline" size="sm">{p.name}</Btn>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
