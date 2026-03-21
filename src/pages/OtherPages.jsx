import { useState } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { C } from "../lib/theme";
import { fmt } from "../lib/utils";
import { exportCSV, exportSimPDF } from "../lib/exportUtils";
import { Card, Btn, KpiCard, Alert, Input, Badge, ProgressBar } from "../components/ui";

// ─── Bills Page ───────────────────────────────────────────────────────────────
const BILL_ICONS  = { Utilities:"⚡", Rent:"🏠", Internet:"🌐", Software:"💻", Salaries:"👥", Food:"🍱", Transport:"🚗", Insurance:"🛡", EMI:"🏦", Other:"📦" };
const BILL_COLORS = { Utilities:C.accent, Rent:C.rose, Internet:C.teal, Software:C.accent2, Salaries:C.green, Food:C.amber, Transport:C.teal, Insurance:C.navy, EMI:C.orange, Other:C.muted };
const BILL_CATS   = ["Utilities","Rent","Internet","Software","Salaries","Food","Transport","Insurance","EMI","Other"];

export function BillsPage({ bills, setBills }) {
  const [form, setForm] = useState({ name: "", amount: "", category: "Utilities", recurrence: "monthly" });

  const addBill = () => {
    if (!form.name || !form.amount) return;
    setBills(b => [...b, { ...form, id: Date.now() }]);
    setForm({ name: "", amount: "", category: "Utilities", recurrence: "monthly" });
  };
  const rem   = id => setBills(b => b.filter(x => x.id !== id));
  const total = bills.reduce((a, b) => a + parseFloat(b.amount || 0), 0);

  const byCategory = {};
  bills.forEach(b => { byCategory[b.category] = (byCategory[b.category] || 0) + parseFloat(b.amount || 0); });

  return (
    <div style={{ padding: 24 }}>
      <div className="fu" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>📋 Monthly Bills</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Track all recurring expenses</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        {/* Left: add form + summary */}
        <div>
          <Card style={{ marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>➕ Add Bill</h3>
            <Input label="Bill Name" value={form.name}   onChange={v => setForm(p => ({ ...p, name: v }))}   placeholder="Electricity, AWS…" />
            <Input label="Amount"    value={form.amount} onChange={v => setForm(p => ({ ...p, amount: v }))} prefix="₹" type="number" />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ width: "100%", padding: "9px 11px", border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 14, background: C.bg, color: C.text, fontFamily: "'Sora',sans-serif" }}>
                {BILL_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Recurrence</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["monthly", "quarterly", "yearly"].map(r => (
                  <button key={r} onClick={() => setForm(p => ({ ...p, recurrence: r }))}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1px solid ${form.recurrence === r ? C.accent : C.border}`, background: form.recurrence === r ? C.accent + "10" : "transparent", color: form.recurrence === r ? C.accent : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora',sans-serif", textTransform: "capitalize" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Btn onClick={addBill} style={{ width: "100%" }}>Add Bill</Btn>
          </Card>

          <Card>
            <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Monthly Total</p>
            <p style={{ fontSize: 30, fontWeight: 700, color: C.amber, fontFamily: "'JetBrains Mono',monospace", marginTop: 6 }}>{fmt(total)}</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{bills.length} active bills</p>
            <div style={{ marginTop: 14 }}>
              {Object.entries(byCategory).map(([cat, amt], i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: C.textSoft }}>{BILL_ICONS[cat] || "📦"} {cat}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(amt)}</span>
                  </div>
                  <ProgressBar value={amt} max={total} color={BILL_COLORS[cat] || C.muted} height={5} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: bill list */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 700, fontSize: 14 }}>Bill List</h3>
            <Btn onClick={() => exportCSV(bills.map(b => ({ Name: b.name, Amount: b.amount, Category: b.category, Recurrence: b.recurrence })), "bills.csv")} variant="ghost" size="sm">📊 Export</Btn>
          </div>
          {bills.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
              <p style={{ fontSize: 32 }}>📋</p><p style={{ marginTop: 12 }}>No bills yet</p>
            </div>
          ) : bills.map((bill, i) => (
            <div key={bill.id} className="row-hover" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", borderBottom: i < bills.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: (BILL_COLORS[bill.category] || C.muted) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {BILL_ICONS[bill.category] || "📦"}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{bill.name}</p>
                  <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                    <Badge label={bill.category}              color={BILL_COLORS[bill.category] || C.muted} />
                    <Badge label={bill.recurrence || "monthly"} color={C.teal} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: C.amber, fontSize: 15 }}>{fmt(parseFloat(bill.amount))}</span>
                <button onClick={() => rem(bill.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.rose, fontSize: 18, lineHeight: 1 }}>✕</button>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
export function ReportsPage({ simulations }) {
  const mockReports = [
    { name: "Q1 2026 Financial Report",   type: "PDF", size: "2.4 MB", date: "Mar 1, 2026",  sim: "Q1 Growth Scenario" },
    { name: "January Salary Plan",        type: "CSV", size: "12 KB",  date: "Jan 31, 2026", sim: "—" },
    { name: "December Budget Analysis",   type: "PDF", size: "1.8 MB", date: "Dec 31, 2025", sim: "Cost Optimization" },
  ];
  const allReports = [
    ...simulations.map(s => ({ name: `${s.name} Report`, type: "TXT", size: "~8 KB", date: s.date, sim: s.name, result: s.result, aiSummary: s.aiSummary })),
    ...mockReports,
  ];

  return (
    <div style={{ padding: 24 }}>
      <div className="fu" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>📄 Reports</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Download and manage generated reports</p>
      </div>
      <div className="fu1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Total Reports"  value={allReports.length}                          color={C.accent} icon="📄" />
        <KpiCard label="Simulations"    value={simulations.length}                         color={C.teal}   icon="🧪" />
        <KpiCard label="AI Summaries"   value={simulations.filter(s => s.aiSummary).length} color={C.green}  icon="🤖" />
      </div>
      <Card className="fu2" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontWeight: 700, fontSize: 14 }}>All Reports</h3>
        </div>
        {allReports.map((r, i) => (
          <div key={i} className="row-hover" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderBottom: i < allReports.length - 1 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: r.type === "PDF" ? C.rose + "15" : r.type === "CSV" ? C.green + "15" : C.accent + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {r.type === "PDF" ? "📄" : r.type === "CSV" ? "📊" : "📝"}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</p>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{r.date} · {r.size} · {r.sim}</p>
                {r.aiSummary && <Badge label="AI Summary Included" color={C.green} />}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {r.result
                ? <Btn size="sm" variant="outline" onClick={() => exportSimPDF(r.result, r.name, r.aiSummary)}>⬇ Download</Btn>
                : <Btn size="sm" variant="ghost">⬇ Download</Btn>}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
export function AdminPage({ simulations }) {
  const ROLE_C = { admin: C.rose, analyst: C.accent, viewer: C.green };
  const users  = [
    { name: "Rahul Sharma", email: "admin@fintech.ai",   role: "admin",   sims: simulations.length, lastActive: "Just now" },
    { name: "Priya Mehta",  email: "analyst@fintech.ai", role: "analyst", sims: 3,                  lastActive: "2h ago" },
    { name: "Vikram Das",   email: "viewer@fintech.ai",  role: "viewer",  sims: 0,                  lastActive: "1d ago" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div className="fu" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>⚙️ Admin Panel</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Usage metrics · User management · System health</p>
      </div>
      <div className="fu1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Total Users"      value="3"                  color={C.accent} icon="👥" />
        <KpiCard label="Simulations Run"  value={simulations.length} color={C.teal}   icon="🧪" />
        <KpiCard label="System Status"    value="Online"             color={C.green}  icon="✅" />
      </div>
      <div className="fu2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Card>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>👥 Users</h3>
          {users.map((u, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < users.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accent2})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>{u.name[0]}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{u.lastActive}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: C.muted }}>{u.sims} sims</span>
                <Badge label={u.role} color={ROLE_C[u.role]} />
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📊 Usage Overview</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[{ name: "Simulations", v: simulations.length }, { name: "Reports", v: 3 }, { name: "Exports", v: 5 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.muted }} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="v" fill={C.accent} radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: "10px 13px", background: C.green + "10", borderRadius: 9, fontSize: 13, color: C.green, fontWeight: 600 }}>✅ All systems operational</div>
        </Card>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export function SettingsPage({ user }) {
  const [notifs, setNotifs] = useState({ runway: true, simulation: true, weekly: true });
  const [saved,  setSaved]  = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div style={{ padding: 24 }}>
      <div className="fu" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>🔧 Settings</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Account · Notifications · Security</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div>
          <Card className="fu1">
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>👤 Profile</h3>
            <Input label="Full Name" value={user.name}  onChange={() => {}} placeholder="Your name" />
            <Input label="Email"     value={user.email} onChange={() => {}} type="email" />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Role</label>
              <div style={{ padding: "9px 12px", background: C.bg, borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.textSoft, display: "flex", alignItems: "center", gap: 8 }}>
                <Badge label={user.role} color={{ admin: C.rose, analyst: C.accent, viewer: C.green }[user.role] || C.accent} />
                <span style={{ fontSize: 12, color: C.muted }}>Role assigned by admin</span>
              </div>
            </div>
            <Btn onClick={save} style={{ width: "100%" }}>{saved ? "✅ Saved!" : "Save Changes"}</Btn>
          </Card>
        </div>
        <div>
          <Card className="fu1" style={{ marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>🔔 Notifications</h3>
            {[
              { k: "runway",     l: "Runway alert (< 3 months)", sub: "Critical low runway warning" },
              { k: "simulation", l: "Simulation completed",      sub: "When a Monte Carlo run finishes" },
              { k: "weekly",     l: "Weekly digest",             sub: "Summary email every Monday" },
            ].map(item => (
              <div key={item.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{item.l}</p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.sub}</p>
                </div>
                <button onClick={() => setNotifs(n => ({ ...n, [item.k]: !n[item.k] }))}
                  style={{ width: 42, height: 24, borderRadius: 12, background: notifs[item.k] ? C.green : C.border, border: "none", cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: notifs[item.k] ? 18 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                </button>
              </div>
            ))}
          </Card>
          <Card className="fu2">
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>🔐 Security</h3>
            <Alert type="info">Your data is encrypted and stored locally. Credentials are hashed before saving.</Alert>
            <Btn variant="outline" style={{ width: "100%", marginTop: 4 }} size="sm">Change Password</Btn>
            <Btn variant="ghost"   style={{ width: "100%", marginTop: 8, color: C.muted }} size="sm">Download My Data</Btn>
          </Card>
        </div>
      </div>
    </div>
  );
}
