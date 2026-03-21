import { useState, useEffect, useCallback } from "react";
import { C, STYLE } from "./lib/theme";
import { loadUserData, saveUserData } from "./lib/storage";

import AuthPage                          from "./components/AuthPage";
import { Sidebar, Header }               from "./components/Layout";

import DashboardPage                     from "./pages/DashboardPage";
import { PortfolioPage }                 from "./pages/MerchantsPortfolio";
import SimulationPage                    from "./pages/SimulationPage";
import AIPage                            from "./pages/AIPage";
import { SalaryPlannerPage, BudgetPlannerPage } from "./pages/PlannerPages";
import { BillsPage, ReportsPage, AdminPage, SettingsPage } from "./pages/OtherPages";

export default function App() {
  const [user, setUser]               = useState(null);
  const [userType, setUserType]       = useState("business");
  const [page, setPage]               = useState("dashboard");
  const [bills, setBillsRaw]          = useState([]);
  const [simulations, setSimsRaw]     = useState([]);
  const [aiContext, setAiContext]      = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Auto-save bills whenever they change
  const setBills = useCallback((updater) => {
    setBillsRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (user?.id) saveUserData(user.id, { bills: next, simulations });
      return next;
    });
  }, [user, simulations]);

  // Auto-save simulations whenever they change
  const setSimulations = useCallback((updater) => {
    setSimsRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (user?.id) saveUserData(user.id, { bills, simulations: next });
      return next;
    });
  }, [user, bills]);

  // On login: load that user's persisted data
  const handleLogin = useCallback(async (userData) => {
    const normalizedUser = {
      ...userData,
      email: (userData.email || "").replace(/@gamil\.com$/i, "@gmail.com"),
    };
    setUser(normalizedUser);
    setUserType(normalizedUser.user_type || "business");
    setPage("dashboard");
    setDataLoading(true);

    const saved  = await loadUserData(normalizedUser.id);
    const isNew  = (saved.bills || []).length === 0 && (saved.simulations || []).length === 0;

    setBillsRaw(saved.bills || []);
    setSimsRaw(saved.simulations || []);
    setNotifications(
      isNew
        ? [{ title: "👋 Welcome to fintech.ai!", body: "Start by adding your monthly bills, then run a simulation.", read: false }]
        : [{ title: `✅ Welcome back, ${normalizedUser.name.split(" ")[0]}!`, body: "Your data has been restored.", read: false }]
    );
    setDataLoading(false);
  }, []);

  // Sign out: clear all local state
  const handleSignOut = useCallback(() => {
    setUser(null);
    setBillsRaw([]);
    setSimsRaw([]);
    setNotifications([]);
    setAiContext(null);
    setPage("dashboard");
  }, []);

  // Runway alert
  useEffect(() => {
    if (!user) return;
    const total = bills.reduce((a, b) => a + parseFloat(b.amount || 0), 0);
    if (total > 300000) {
      setNotifications(n => {
        if (n.some(x => x.title.includes("Runway"))) return n;
        return [{ title: "🚨 Runway alert", body: "High monthly bills detected. Run a simulation to check your runway.", read: false }, ...n];
      });
    }
  }, [bills, user]);

  // ── Auth screen ──────────────────────────────────────────────────────────────
  if (!user) return <AuthPage onLogin={handleLogin} />;

  // ── Loading while restoring data ─────────────────────────────────────────────
  if (dataLoading) return (
    <div style={{ minHeight: "100vh", background: C.bgDeep, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <style>{STYLE}</style>
      <div className="spin" style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", boxShadow: `0 0 12px ${C.accent}50` }} />
      <p style={{ color: C.muted, fontSize: 14 }}>Loading your workspace…</p>
    </div>
  );

  const role = user.role || "analyst";

  const renderPage = () => {
    switch (page) {
      case "portfolio":  return <PortfolioPage />;
      case "simulation": return <SimulationPage role={role} simulations={simulations} setSimulations={setSimulations} setPage={setPage} setAiContext={setAiContext} />;
      case "ai":         return <AIPage simulations={simulations} setSimulations={setSimulations} aiContext={aiContext} />;
      case "salary":     return <SalaryPlannerPage bills={bills} />;
      case "budget":     return <BudgetPlannerPage bills={bills} />;
      case "bills":      return <BillsPage bills={bills} setBills={setBills} />;
      case "reports":    return <ReportsPage simulations={simulations} />;
      case "admin":      return role === "admin" ? <AdminPage simulations={simulations} /> : <DashboardPage userType={userType} userName={user.name} bills={bills} simulations={simulations} setPage={setPage} />;
      case "settings":   return <SettingsPage user={user} />;
      default:           return <DashboardPage userType={userType} userName={user.name} bills={bills} simulations={simulations} setPage={setPage} />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg }}>
      <style>{STYLE}</style>
      <Sidebar page={page} setPage={setPage} userType={userType} role={role} collapsed={false} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto", background: C.bg }}>
        <Header
          user={user} setUser={handleSignOut}
          userType={userType} setUserType={setUserType}
          setPage={setPage} notifications={notifications} role={role}
        />
        <main style={{ flex: 1, background: C.bg }}>{renderPage()}</main>
      </div>
    </div>
  );
}
