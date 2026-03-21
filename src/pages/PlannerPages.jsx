import { useState } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { C } from "../lib/theme";
import { fmt, fmtK } from "../lib/utils";
import { exportCSV } from "../lib/exportUtils";
import { Card, Btn, Alert, Input, Badge, ProgressBar } from "../components/ui";

export function SalaryPlannerPage({ bills }) {
  const [budget, setBudget] = useState("500000");
  const [profit, setProfit] = useState("50000");
  const [employees, setEmployees] = useState([
    { name: "Arjun", role: "CTO",       base: "150000" },
    { name: "Priya", role: "Designer",  base: "90000"  },
    { name: "Rohit", role: "Engineer",  base: "120000" },
    { name: "Meera", role: "Marketing", base: "80000"  },
  ]);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const totalBills = bills.reduce((a, b) => a + parseFloat(b.amount || 0), 0);
  const addEmp   = () => setEmployees(e => [...e, { name: "", role: "", base: "" }]);
  const remEmp   = i  => setEmployees(e => e.filter((_, idx) => idx !== i));
  const updEmp   = (i, k, v) => setEmployees(e => e.map((emp, idx) => idx === i ? { ...emp, [k]: v } : emp));

  const calc = () => {
    setLoading(true);
    setTimeout(() => {
      const tot    = parseFloat(budget || 0);
      const prof   = parseFloat(profit || 0);
      const avail  = tot - prof - totalBills;
      const totalW = employees.reduce((a, e) => a + parseFloat(e.base || 1), 0);
      const dist   = employees.map(e => ({
        name:      e.name,
        role:      e.role,
        allocated: parseFloat(((parseFloat(e.base || 1) / totalW) * avail).toFixed(0)),
        pct:       parseFloat(((parseFloat(e.base || 1) / totalW) * 100).toFixed(1)),
      }));
      setResult({ totalBudget: tot, desiredProfit: prof, totalBills, available: avail, dist });
      setLoading(false);
    }, 600);
  };

  const PALETTE = [C.accent, C.teal, C.green, C.accent2, C.amber, C.rose];

  return (
    <div style={{ padding: 24 }}>
      <div className="fu" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>💸 Salary Planner</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Fair distribution engine for your team</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        <div>
          <Card style={{ marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Budget Setup</h3>
            <Input label="Total Monthly Budget"   value={budget} onChange={setBudget} prefix="₹" type="number" />
            <Input label="Desired Profit / Reserve" value={profit} onChange={setProfit} prefix="₹" type="number" />
            <div style={{ padding: "10px 13px", background: C.amber + "12", borderRadius: 9, fontSize: 13, color: C.textSoft, border: `1px solid ${C.amber}30` }}>
              <strong>Bills auto-included:</strong> {fmt(totalBills)}
            </div>
          </Card>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14 }}>Team Members</h3>
              <Btn onClick={addEmp} variant="outline" size="sm">+ Add</Btn>
            </div>
            {employees.map((emp, i) => (
              <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
                <input value={emp.name} onChange={e => updEmp(i, "name", e.target.value)} placeholder="Name"   style={{ flex: 1, padding: "7px 9px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Sora',sans-serif", background: C.bg, color: C.text, minWidth: 0 }} />
                <input value={emp.role} onChange={e => updEmp(i, "role", e.target.value)} placeholder="Role"   style={{ flex: 1, padding: "7px 9px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Sora',sans-serif", background: C.bg, color: C.text, minWidth: 0 }} />
                <input value={emp.base} onChange={e => updEmp(i, "base", e.target.value)} placeholder="₹Base" type="number" style={{ width: 80, padding: "7px 9px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Sora',sans-serif", background: C.bg, color: C.text }} />
                <button onClick={() => remEmp(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.rose, fontSize: 16, flexShrink: 0 }}>✕</button>
              </div>
            ))}
            <Btn onClick={calc} disabled={loading} style={{ width: "100%", marginTop: 8 }}>
              {loading ? "Calculating…" : "⚡ Calculate Plan"}
            </Btn>
          </Card>
        </div>

        <div>
          {result ? (
            <Card className="fu">
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📋 Salary Distribution</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { l: "Total Budget",   v: fmtK(result.totalBudget),            c: C.accent },
                  { l: "Profit Reserve", v: fmtK(result.desiredProfit),          c: C.green  },
                  { l: "Bills",          v: fmtK(result.totalBills),             c: C.amber  },
                  { l: "Salary Pool",    v: fmtK(Math.max(result.available, 0)), c: C.teal   },
                ].map((k, i) => (
                  <div key={i} style={{ background: k.c + "10", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{k.l}</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: k.c, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{k.v}</p>
                  </div>
                ))}
              </div>
              {result.available <= 0 ? (
                <Alert type="danger">Budget too tight! Bills + profit reserve exceed total budget by {fmt(Math.abs(result.available))}.</Alert>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160} style={{ marginBottom: 16 }}>
                    <BarChart data={result.dist} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis type="number" tickFormatter={v => fmtK(v)} tick={{ fontSize: 11, fill: C.muted }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: C.textSoft }} width={60} />
                      <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="allocated" fill={C.accent} radius={[0, 4, 4, 0]} name="Salary" />
                    </BarChart>
                  </ResponsiveContainer>
                  {result.dist.map((emp, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: PALETTE[i % 6] + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: 14 }}>{emp.name}</p>
                            <Badge label={emp.role} color={PALETTE[i % 4]} />
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: C.accent, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(emp.allocated)}</span>
                      </div>
                      <ProgressBar value={emp.pct} max={100} color={PALETTE[i % 5]} />
                      <p style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{emp.pct}% of salary pool</p>
                    </div>
                  ))}
                  <Btn onClick={() => exportCSV(result.dist, "salary-plan.csv")} variant="ghost" size="sm">📊 Export CSV</Btn>
                </>
              )}
            </Card>
          ) : (
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 12 }}>
              <span style={{ fontSize: 48 }}>💸</span>
              <p style={{ color: C.muted, textAlign: "center", fontSize: 14 }}>Configure the team and hit<br /><strong>Calculate Plan</strong></p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export function BudgetPlannerPage({ bills }) {
  const [income, setIncome]   = useState("85000");
  const [savings, setSavings] = useState("15000");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const totalBills = bills.reduce((a, b) => a + parseFloat(b.amount || 0), 0);

  const CATS = [
    { name: "Food & Groceries", icon: "🍱", pct: 30, color: C.accent  },
    { name: "Transport",        icon: "🚗", pct: 15, color: C.teal    },
    { name: "Entertainment",    icon: "🎬", pct: 10, color: C.accent2 },
    { name: "Healthcare",       icon: "🏥", pct: 10, color: C.rose    },
    { name: "Clothing",         icon: "👕", pct: 10, color: C.amber   },
    { name: "Misc",             icon: "📦", pct: 25, color: C.green   },
  ];

  const calc = () => {
    setLoading(true);
    setTimeout(() => {
      const inc      = parseFloat(income  || 0);
      const sav      = parseFloat(savings || 0);
      const spendable = inc - totalBills - sav;
      setResult({
        income: inc, savings: sav, totalBills, spendable,
        cats: CATS.map(c => ({ ...c, amount: parseFloat(((c.pct / 100) * Math.max(spendable, 0)).toFixed(0)) })),
      });
      setLoading(false);
    }, 500);
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="fu" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>🪙 Budget Planner</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>50/30/20 rule powered smart budget</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        <div>
          <Card>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Income Setup</h3>
            <Input label="Monthly Income" value={income}  onChange={setIncome}  prefix="₹" type="number" />
            <Input label="Savings Goal"   value={savings} onChange={setSavings} prefix="₹" type="number" />
            <div style={{ padding: "10px 13px", background: C.amber + "12", borderRadius: 9, fontSize: 13, marginBottom: 14, border: `1px solid ${C.amber}30` }}>
              Bills: {fmt(totalBills)} · Spendable: {fmt(Math.max(parseFloat(income || 0) - totalBills - parseFloat(savings || 0), 0))}
            </div>
            <Btn onClick={calc} disabled={loading} style={{ width: "100%" }}>
              {loading ? "Calculating…" : "⚡ Build My Plan"}
            </Btn>
          </Card>
        </div>

        <div>
          {result ? (
            <Card className="fu">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
                {[
                  { l: "Income",  v: fmt(result.income),     c: C.accent },
                  { l: "Bills",   v: fmt(result.totalBills), c: C.amber  },
                  { l: "Savings", v: fmt(result.savings),    c: C.green  },
                ].map((k, i) => (
                  <div key={i} style={{ background: k.c + "10", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>{k.l}</p>
                    <p style={{ fontSize: 17, fontWeight: 700, color: k.c, fontFamily: "'JetBrains Mono',monospace", marginTop: 4 }}>{k.v}</p>
                  </div>
                ))}
              </div>
              {result.spendable <= 0 ? (
                <Alert type="danger">Over budget by {fmt(Math.abs(result.spendable))}! Reduce bills or lower savings goal.</Alert>
              ) : (
                <>
                  <p style={{ fontWeight: 700, fontSize: 13, color: C.muted, marginBottom: 12 }}>Spending suggestions for {fmt(result.spendable)}:</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    {result.cats.map((cat, i) => (
                      <div key={i} style={{ background: cat.color + "0D", border: `1px solid ${cat.color}25`, borderRadius: 12, padding: "13px 15px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                          <span style={{ fontSize: 18 }}>{cat.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: cat.color, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(cat.amount)}</span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{cat.name}</p>
                        <ProgressBar value={cat.pct} max={100} color={cat.color} />
                        <p style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{cat.pct}%</p>
                      </div>
                    ))}
                  </div>
                  <Btn onClick={() => exportCSV(result.cats, "budget-plan.csv")} variant="ghost" size="sm">📊 Export CSV</Btn>
                </>
              )}
            </Card>
          ) : (
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360, gap: 12 }}>
              <span style={{ fontSize: 48 }}>🪙</span>
              <p style={{ color: C.muted, textAlign: "center", fontSize: 14 }}>Enter income & savings goal,<br />then hit <strong>Build My Plan</strong></p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
