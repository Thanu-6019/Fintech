import { useState } from "react";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { C } from "../lib/theme";
import { fmt, fmtK, pct, rand } from "../lib/utils";
import { SEED_MERCHANTS, SEED_PORTFOLIOS } from "../lib/seedData";
import { Card, Badge, KpiCard, Sparkline, ProgressBar, DonutChart } from "../components/ui";

export function MerchantsPage() {
  const [sort, setSort]       = useState("revenue");
  const [filter, setFilter]   = useState("");
  const [selected, setSelected] = useState(null);

  const sorted = [...SEED_MERCHANTS]
    .filter(m => m.name.toLowerCase().includes(filter.toLowerCase()) || m.category.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => b[sort] - a[sort]);

  return (
    <div style={{ padding: 24 }}>
      <div className="fu" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>🏪 Merchant Explorer</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Browse and analyze merchant performance</p>
      </div>

      <div className="fu1" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 18, alignItems: "start" }}>
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search merchants or categories…"
          style={{ padding: "9px 14px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: C.card, color: C.text, fontFamily: "'Sora',sans-serif" }} />
        <div style={{ display: "flex", gap: 8 }}>
          {["revenue", "growth", "txns"].map(s => (
            <button key={s} onClick={() => setSort(s)}
              style={{ padding: "9px 14px", borderRadius: 9, border: `1px solid ${sort === s ? C.accent : C.border}`, background: sort === s ? C.accent : "transparent", color: sort === s ? "#fff" : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", textTransform: "capitalize" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="fu2" style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 18 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.bg }}>
                {["Merchant", "Category", "Region", "Revenue", "Growth", "Transactions", "Trend"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(m => (
                <tr key={m.id} className="row-hover" onClick={() => setSelected(selected?.id === m.id ? null : m)}
                  style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: selected?.id === m.id ? C.accent + "08" : "transparent", transition: "background .15s" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 14 }}>{m.name}</td>
                  <td style={{ padding: "12px 16px" }}><Badge label={m.category} color={C.teal} /></td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted }}>{m.region}</td>
                  <td style={{ padding: "12px 16px", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600 }}>{fmtK(m.revenue)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: m.growth >= 0 ? C.green : C.rose }}>{m.growth >= 0 ? "+" : ""}{m.growth}%</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: C.textSoft }}>{m.txns.toLocaleString()}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Sparkline data={Array.from({ length: 8 }, (_, i) => m.revenue * (0.85 + i * 0.02 + rand(-0.03, 0.04)))} color={m.growth >= 0 ? C.green : C.rose} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {selected && (
          <Card className="fu" style={{ alignSelf: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>✕</button>
            </div>
            <Badge label={selected.category} color={C.teal} />
            <Badge label={selected.region} color={C.muted} style={{ marginLeft: 6 }} />
            <div style={{ marginTop: 16 }}>
              {[
                { l: "Revenue", v: fmt(selected.revenue), c: C.accent },
                { l: "Growth", v: `${selected.growth >= 0 ? "+" : ""}${selected.growth}%`, c: selected.growth >= 0 ? C.green : C.rose },
                { l: "Transactions", v: selected.txns.toLocaleString(), c: C.teal },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 13, color: C.muted }}>{item.l}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: item.c, fontFamily: "'JetBrains Mono',monospace" }}>{item.v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Revenue trend (8 months)</p>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={Array.from({ length: 8 }, (_, i) => ({ m: `M${i + 1}`, v: Math.round(selected.revenue * (0.85 + i * 0.02 + rand(-0.03, 0.04))) }))}>
                  <Line type="monotone" dataKey="v" stroke={C.accent} strokeWidth={2} dot={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: C.muted }} />
                  <Tooltip formatter={v => fmt(v)} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", background: selected.growth < 0 ? C.rose + "10" : C.green + "10", borderRadius: 9, fontSize: 13, color: selected.growth < 0 ? C.rose : C.green, fontWeight: 600 }}>
              {selected.growth < 0 ? "⚠ Declining — consider intervention" : "✅ Healthy growth trajectory"}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export function PortfolioPage() {
  const [sel, setSel] = useState(0);
  const port       = SEED_PORTFOLIOS[sel];
  const totalValue = port.positions.reduce((a, p) => a + p.shares * p.price, 0);

  return (
    <div style={{ padding: 24 }}>
      <div className="fu" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>📈 Portfolio Explorer</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Monitor your investment positions</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {SEED_PORTFOLIOS.map((p, i) => (
          <button key={i} onClick={() => setSel(i)}
            style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${sel === i ? C.accent : C.border}`, background: sel === i ? C.accent + "10" : "transparent", color: sel === i ? C.accent : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="fu1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }}>
        <KpiCard label="Portfolio Value" value={fmtK(totalValue)} color={C.accent} icon="💼" sub="Market value" />
        <KpiCard label="Total Gain" value={`+${port.gain}%`} color={C.green} icon="📈" sub="All time" />
        <KpiCard label="Positions" value={port.positions.length} color={C.teal} icon="🎯" sub="Active holdings" />
      </div>
      <div className="fu2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontWeight: 700, fontSize: 14 }}>Holdings</h3>
          </div>
          {port.positions.map((pos, i) => {
            const val = pos.shares * pos.price;
            const w   = pct(val, totalValue);
            return (
              <div key={i} style={{ padding: "14px 20px", borderBottom: i < port.positions.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{pos.symbol}</span>
                    <Badge label={pos.sector} color={C.teal} style={{ marginLeft: 8 }} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: C.accent }}>{fmt(val)}</p>
                    <p style={{ fontSize: 11, color: C.muted }}>{pos.shares} × {fmt(pos.price)}</p>
                  </div>
                </div>
                <ProgressBar value={parseFloat(w)} max={100} color={[C.accent, C.teal, C.green, C.accent2][i % 4]} />
                <p style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{w}% of portfolio</p>
              </div>
            );
          })}
        </Card>
        <Card>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Portfolio Composition</h3>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <DonutChart size={130} label={`${port.positions.length}\nStocks`} segments={port.positions.map((p, i) => ({ value: p.shares * p.price, color: [C.accent, C.teal, C.green, C.accent2][i % 4] }))} />
          </div>
          {port.positions.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: [C.accent, C.teal, C.green, C.accent2][i % 4] }} />
                <span style={{ fontSize: 13, color: C.textSoft }}>{p.symbol}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'JetBrains Mono',monospace" }}>{pct(p.shares * p.price, totalValue)}%</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
