import { useState } from "react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { C } from "../lib/theme";
import { fmt, fmtK } from "../lib/utils";
import { Card, Btn, KpiCard, Alert, Badge, ProgressBar } from "../components/ui";

function EmptyStateCard({ icon, title, body, action, onAction }) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center", border: `1.5px dashed ${C.border}` }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: action ? 18 : 0, lineHeight: 1.6, maxWidth: 280 }}>{body}</p>
      {action && <Btn onClick={onAction} variant="outline" size="sm">{action}</Btn>}
    </Card>
  );
}

export default function DashboardPage({ userType, userName, bills, simulations, setPage }) {
  const [range, setRange] = useState(6);

  const totalBills   = bills.reduce((a, b) => a + parseFloat(b.amount || 0), 0);
  const hasBills     = bills.length > 0;
  const hasSims      = simulations.length > 0;
  const isEmpty      = !hasBills && !hasSims;
  const latestSim    = hasSims ? simulations[simulations.length - 1] : null;
  const p50Runway    = latestSim?.result?.p50?.runway ?? null;
  const survivalRate = latestSim?.result?.survivalRate ?? null;

  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const COLORS_MAP = { Software: C.accent, Rent: C.rose, Internet: C.teal, Utilities: C.amber, Food: C.green, Transport: C.teal, Other: C.muted };

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <div className="fu" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>{greeting}, {userName.split(" ")[0]} 👋</h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>
            {isEmpty ? "Let's set up your financial workspace" : `Financial overview · ${now.toLocaleString("en-IN", { month: "long", year: "numeric" })}`}
          </p>
        </div>
        {hasSims && (
          <div style={{ display: "flex", gap: 6 }}>
            {[3, 6, 12].map(r => (
              <button key={r} onClick={() => setRange(r)}
                style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${range === r ? C.accent : C.border}`, background: range === r ? C.accent : "transparent", color: range === r ? "#fff" : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
                {r}M
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── EMPTY: nothing added yet ── */}
      {isEmpty && (
        <>
          <div className="fu1" style={{ background: `linear-gradient(135deg,${C.accent}0A,${C.accent2}08)`, border: `1px solid ${C.accent}20`, borderRadius: 16, padding: "24px 28px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 48, flexShrink: 0 }}>🚀</div>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Welcome to fintech.ai</h2>
              <p style={{ fontSize: 14, color: C.textSoft, lineHeight: 1.6 }}>
                Your AI-powered CFO is ready. Start by adding your monthly bills to unlock dashboard insights, then run a Monte Carlo simulation to see your financial runway.
              </p>
            </div>
          </div>

          <div className="fu2" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Setup checklist</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Add your monthly bills", sub: "Go to Bills → track rent, utilities, subscriptions", action: "Go to Bills", page: "bills", icon: "📋" },
                { label: userType === "business" ? "Run your first salary plan" : "Create a budget plan", sub: userType === "business" ? "Set total budget, desired profit, team members" : "Set income and savings goal", action: userType === "business" ? "Open Salary Planner" : "Open Budget Planner", page: userType === "business" ? "salary" : "budget", icon: "💸" },
                { label: "Run a Monte Carlo simulation", sub: "Project P10/P50/P90 runway scenarios", action: "Open Simulation Studio", page: "simulation", icon: "🧪" },
                { label: "Get an AI CFO summary", sub: "Let Claude analyse your simulation results", action: "Open AI Insights", page: "ai", icon: "🤖" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.accent + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{item.label}</p>
                    <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.sub}</p>
                  </div>
                  <Btn onClick={() => setPage(item.page)} variant="outline" size="sm">{item.action} →</Btn>
                </div>
              ))}
            </div>
          </div>

          <div className="fu3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <EmptyStateCard icon="📋" title="No bills yet" body="Add your recurring monthly expenses to see cost breakdown and runway projections." action="+ Add First Bill" onAction={() => setPage("bills")} />
            <EmptyStateCard icon="🧪" title="No simulations yet" body="Run a Monte Carlo simulation to see P10/P50/P90 cash flow projections across 200 scenarios." action="Run First Simulation" onAction={() => setPage("simulation")} />
          </div>
        </>
      )}

      {/* ── PARTIAL: bills but no simulations ── */}
      {hasBills && !hasSims && (
        <>
          <div className="fu1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
            <KpiCard label="Monthly Bills" value={fmtK(totalBills)} sub={`${bills.length} recurring`} color={C.amber} icon="📋" />
            <KpiCard label="Largest Bill" value={fmtK(Math.max(...bills.map(b => parseFloat(b.amount || 0))))} sub={[...bills].sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))[0]?.name || "—"} color={C.rose} icon="💸" />
            <KpiCard label="Simulations" value="0" sub="Run one to unlock insights" color={C.muted} icon="🧪" />
            <KpiCard label="AI Summaries" value="0" sub="Available after simulation" color={C.muted} icon="🤖" />
          </div>
          <Alert type="info">You have {bills.length} bill{bills.length !== 1 ? "s" : ""} totalling {fmtK(totalBills)}/mo. Run a simulation to see how this affects your runway.</Alert>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <Card className="fu2">
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📋 Bills Breakdown</h3>
              {bills.slice(0, 6).map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < Math.min(bills.length, 6) - 1 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 13, color: C.textSoft }}>{b.name}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: C.amber }}>{fmt(parseFloat(b.amount || 0))}</span>
                </div>
              ))}
              {bills.length > 6 && <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>+{bills.length - 6} more bills</p>}
            </Card>
            <EmptyStateCard icon="🧪" title="Ready to simulate" body={`You have ${fmtK(totalBills)}/mo in bills. Run a Monte Carlo simulation to project your runway.`} action="Run Simulation →" onAction={() => setPage("simulation")} />
          </div>
        </>
      )}

      {/* ── FULL: bills + simulations ── */}
      {hasBills && hasSims && (
        <>
          {p50Runway !== null && p50Runway <= 3 && (
            <Alert type="danger">🚨 Runway critical — P50 projects only {p50Runway} months! Consider running a cost-cutting simulation immediately.</Alert>
          )}
          <div className="fu1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
            <KpiCard label="Monthly Bills" value={fmtK(totalBills)} sub={`${bills.length} recurring`} color={C.amber} icon="📋" />
            <KpiCard label="P50 Runway" value={p50Runway !== null ? `${p50Runway} mo` : "—"} sub="Base case projection" color={p50Runway !== null && p50Runway <= 3 ? C.rose : p50Runway !== null && p50Runway <= 6 ? C.amber : C.green} icon="⛽" />
            <KpiCard label="Survival Rate" value={survivalRate !== null ? `${survivalRate}%` : "—"} sub="Cash-positive scenarios" color={survivalRate !== null && parseFloat(survivalRate) < 50 ? C.rose : C.green} icon="🎲" />
            <KpiCard label="Simulations Run" value={simulations.length} sub="Total scenarios" color={C.accent} icon="🧪" />
          </div>

          <div className="fu2" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 18 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 14 }}>📉 Latest Simulation — Cash Flow</h3>
                <Badge label={latestSim?.name || ""} color={C.accent} />
              </div>
              {latestSim?.result?.chartData ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={latestSim.result.chartData.slice(0, range * 2)}>
                    <defs>
                      <linearGradient id="p90g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={0.25} /><stop offset="95%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                      <linearGradient id="p10g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.rose} stopOpacity={0.18} /><stop offset="95%" stopColor={C.rose} stopOpacity={0} /></linearGradient>
                      <linearGradient id="p50g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.15} /><stop offset="95%" stopColor={C.accent} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} axisLine={{ stroke: C.border }} tickLine={false} />
                    <YAxis tickFormatter={v => fmtK(v)} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, background: C.card, color: C.text }} />
                    <ReferenceLine y={0} stroke={C.rose} strokeDasharray="4 4" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="p90" stroke={C.green} strokeWidth={2.5} fill="url(#p90g2)" name="P90 (Optimistic)" />
                    <Area type="monotone" dataKey="p50" stroke={C.accent} strokeWidth={2.5} fill="url(#p50g2)" name="P50 (Base Case)" />
                    <Area type="monotone" dataKey="p10" stroke={C.rose} strokeWidth={2} fill="url(#p10g2)" name="P10 (Conservative)" />
                    <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14 }}>No chart data yet</div>
              )}
            </Card>
            <Card>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>💹 Bills by Category</h3>
              {(() => {
                const byCategory = {};
                bills.forEach(b => { byCategory[b.category] = (byCategory[b.category] || 0) + parseFloat(b.amount || 0); });
                return Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, amt], i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: C.textSoft, fontWeight: 500 }}>{cat}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS_MAP[cat] || C.accent, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(amt)}</span>
                    </div>
                    <ProgressBar value={amt} max={totalBills} color={COLORS_MAP[cat] || C.accent} height={6} />
                  </div>
                ));
              })()}
            </Card>
          </div>

          <div className="fu3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Card>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🧪 Simulation History</h3>
              {simulations.slice().reverse().slice(0, 4).map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < Math.min(simulations.length, 4) - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</p>
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.date}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: s.result?.p50?.runway <= 3 ? C.rose : C.green }}>{s.result?.p50?.runway || "—"} mo</p>
                    <p style={{ fontSize: 11, color: C.muted }}>P50 runway</p>
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🤖 AI CFO Tips</h3>
              {[
                totalBills > 0 ? `📊 Your bills are ${fmtK(totalBills)}/mo. ${p50Runway !== null ? `P50 runway is ${p50Runway} months.` : "Run a simulation to check runway."}` : "📋 No bills added yet — start tracking recurring expenses.",
                p50Runway !== null && p50Runway <= 6 ? "🚨 Runway under 6 months — try the Cost Cutting preset in Simulation Studio." : p50Runway !== null ? "✅ Runway looks healthy. Consider modelling an aggressive growth scenario." : "💡 Add bills and run a simulation to get personalised CFO recommendations.",
                simulations.length > 1 ? `📈 You've run ${simulations.length} simulations. Compare them in AI Insights for an executive summary.` : "🧪 Try different presets (Conservative, Aggressive, Cost Cutting) to compare outcomes.",
              ].map((tip, i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 9, padding: "9px 13px", fontSize: 13, color: C.textSoft, lineHeight: 1.5, marginBottom: 8 }}>{tip}</div>
              ))}
            </Card>
          </div>
        </>
      )}

      {/* Edge: sims but no bills */}
      {!hasBills && hasSims && (
        <>
          <div className="fu1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
            <KpiCard label="P50 Runway" value={p50Runway !== null ? `${p50Runway} mo` : "—"} sub="Latest simulation" color={C.green} icon="⛽" />
            <KpiCard label="Survival Rate" value={survivalRate !== null ? `${survivalRate}%` : "—"} color={C.teal} icon="🎲" />
            <KpiCard label="Simulations" value={simulations.length} color={C.accent} icon="🧪" />
            <KpiCard label="Monthly Bills" value="₹0" sub="No bills added yet" color={C.muted} icon="📋" />
          </div>
          <Alert type="warning">You have {simulations.length} simulation{simulations.length !== 1 ? "s" : ""} but no bills tracked. Add recurring expenses for more accurate projections.</Alert>
          <div style={{ marginTop: 16 }}>
            <EmptyStateCard icon="📋" title="Add your bills" body="Bills feed directly into salary and budget planners, and improve simulation accuracy." action="+ Add Bills" onAction={() => setPage("bills")} />
          </div>
        </>
      )}
    </div>
  );
}
