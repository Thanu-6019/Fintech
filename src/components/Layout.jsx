import { useState } from "react";
import { C } from "../lib/theme";
import { Badge } from "./ui";

// ── SVG icon set for clean sidebar ───────────────────────────────────────────
const Icon = ({ name }) => {
  const icons = {
    dashboard:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
    merchants:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    portfolio:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    simulation: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
    ai:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
    salary:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    budget:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 002 1.58h9.78a2 2 0 001.95-1.57l1.65-7.43H5.12"/></svg>,
    bills:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>,
    reports:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>,
    admin:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    settings:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  };
  return icons[name] || null;
};

export function Sidebar({ page, setPage, userType, role, collapsed }) {
  const bizNav = [
    { id: "dashboard",  label: "Dashboard" },
    { id: "portfolio",  label: "Portfolio" },
    { id: "simulation", label: "Simulation Studio" },
    { id: "ai",         label: "AI Insights" },
    { id: "salary",     label: "Salary Planner" },
    { id: "bills",      label: "Bill Management" },
    { id: "reports",    label: "Reports" },
    ...(role === "admin" ? [{ id: "admin", label: "Admin" }] : []),
    { id: "settings",   label: "Settings" },
  ];
  const empNav = [
    { id: "dashboard",  label: "Dashboard" },
    { id: "budget",     label: "Budget Planner" },
    { id: "simulation", label: "Monte Carlo" },
    { id: "ai",         label: "AI Insights" },
    { id: "bills",      label: "Bill Management" },
    { id: "reports",    label: "Reports" },
    { id: "settings",   label: "Settings" },
  ];
  const items = userType === "business" ? bizNav : empNav;

  return (
    <div style={{
      width: collapsed ? 64 : 220,
      minHeight: "100vh",
      background: C.bgDeep,
      borderRight: `1px solid ${C.border}`,
      padding: "20px 10px",
      display: "flex",
      flexDirection: "column",
      transition: "width .25s",
      flexShrink: 0,
      overflowX: "hidden",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 28px", overflow: "hidden" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.accent2}, ${C.accent3})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
          boxShadow: `0 0 14px ${C.accent2}50`,
        }}>💰</div>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-.02em", whiteSpace: "nowrap", color: C.text }}>
            fintech<span style={{ color: C.accent, textShadow: `0 0 8px ${C.accent}80` }}>.ai</span>
          </span>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1 }}>
        {items.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              className={active ? "nav-item-active" : "nav-item"}
              onClick={() => setPage(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 10px",
                borderRadius: active ? "8px 0 0 8px" : 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "'Sora',sans-serif",
                fontWeight: active ? 600 : 500,
                fontSize: 13,
                marginBottom: 2,
                width: "100%",
                background: active ? `${C.accent}15` : "transparent",
                color: active ? C.accent : C.muted,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textAlign: "left",
                borderRight: active ? `2px solid ${C.accent}` : "2px solid transparent",
              }}
            >
              <span style={{
                flexShrink: 0,
                color: active ? C.accent : C.muted,
                filter: active ? `drop-shadow(0 0 4px ${C.accent}80)` : "none",
              }}>
                <Icon name={item.id} />
              </span>
              {!collapsed && item.label}
              {!collapsed && item.id === "simulation" && role === "viewer" && (
                <span style={{ marginLeft: "auto", fontSize: 10, color: C.muted, background: C.border, borderRadius: 4, padding: "1px 5px" }}>locked</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom user type indicator */}
      {!collapsed && (
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: ".06em", paddingLeft: 8 }}>
            {userType === "business" ? "🏢 Business Mode" : "👤 Employee Mode"}
          </p>
        </div>
      )}
    </div>
  );
}

export function Header({ user, setUser, userType, setUserType, setPage, notifications, role }) {
  const [dd, setDd]               = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch]       = useState("");
  const ROLE_COLORS = { admin: C.rose, analyst: C.accent, viewer: C.green };
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div style={{
      height: 60,
      background: C.bgDeep,
      borderBottom: `1px solid ${C.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 200,
    }}>
      {/* Left: Role badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Badge label={role} color={ROLE_COLORS[role] || C.accent} />
        {unread > 0 && <span className="pulse" style={{ width: 8, height: 8, background: C.rose, borderRadius: "50%", display: "inline-block", boxShadow: `0 0 6px ${C.rose}` }} />}
      </div>

      {/* Right: Search + toggles + notif + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {/* Search bar — matches reference style */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{ position: "absolute", left: 10 }} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "7px 12px 7px 32px",
              fontSize: 13, color: C.textSoft, width: 160,
              fontFamily: "'Sora',sans-serif", outline: "none",
              transition: "border .2s, box-shadow .2s",
            }}
            onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 2px ${C.accent}20`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Business / Employee toggle */}
        <div style={{ display: "flex", background: C.card, borderRadius: 9, padding: 3, gap: 2, border: `1px solid ${C.border}` }}>
          {["business", "employee"].map(t => (
            <button key={t} onClick={() => { setUserType(t); setPage("dashboard"); }}
              style={{ padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 11, transition: "all .2s", background: userType === t ? `linear-gradient(135deg,${C.accent2},${C.accent3})` : "transparent", color: userType === t ? "#fff" : C.muted, boxShadow: userType === t ? `0 2px 8px ${C.accent2}40` : "none" }}>
              {t === "business" ? "🏢 Biz" : "👤 Emp"}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setNotifOpen(n => !n)}
            style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, cursor: "pointer", fontSize: 16, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={notifOpen ? C.accent : C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, background: C.rose, borderRadius: "50%", fontSize: 9, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, boxShadow: `0 0 6px ${C.rose}80` }}>{unread}</span>
            )}
          </button>
          {notifOpen && (
            <div style={{ position: "absolute", right: 0, top: 42, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,.5)", padding: 8, minWidth: 300, zIndex: 300 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, padding: "4px 10px 10px", textTransform: "uppercase", letterSpacing: ".05em" }}>Notifications</p>
              {notifications.map((n, i) => (
                <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: n.read ? "transparent" : C.accent + "10", marginBottom: 2, borderLeft: n.read ? "none" : `2px solid ${C.accent}` }}>
                  <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: C.text }}>{n.title}</p>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avatar / dropdown */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setDd(d => !d)}
            style={{ width: 34, height: 34, borderRadius: "50%", border: `2px solid ${C.accent}50`, cursor: "pointer", background: `linear-gradient(135deg,${C.accent2},${C.accent3})`, color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "'Sora',sans-serif", boxShadow: `0 0 10px ${C.accent2}40` }}>
            {user.name[0].toUpperCase()}
          </button>
          {dd && (
            <div style={{ position: "absolute", right: 0, top: 42, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,.5)", padding: 8, minWidth: 200, zIndex: 300 }}>
              <p style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: C.text }}>{user.name}</p>
              <p style={{ padding: "0 12px 8px", fontSize: 11, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{user.email}</p>
              <button onClick={() => setPage("settings")} style={{ width: "100%", padding: "8px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", color: C.textSoft, fontSize: 13, borderRadius: 7, fontFamily: "'Sora',sans-serif" }}>⚙ Settings</button>
              <button onClick={() => setUser(null)} style={{ width: "100%", padding: "8px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", color: C.rose, fontSize: 13, fontWeight: 600, borderRadius: 7, fontFamily: "'Sora',sans-serif" }}>🚪 Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
