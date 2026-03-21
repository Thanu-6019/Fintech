import { C } from "../lib/theme";
import { clamp } from "../lib/utils";

export function Card({ children, style = {}, className = "" }) {
  return (
    <div className={`card-hover ${className}`} style={{
      background: C.card, borderRadius: 16,
      border: `1px solid ${C.border}`,
      boxShadow: "0 4px 24px rgba(0,0,0,.35)",
      padding: 24, ...style,
    }}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", style = {}, disabled = false, size = "md" }) {
  const sz = {
    sm: { padding: "7px 16px",  fontSize: 12 },
    md: { padding: "10px 22px", fontSize: 14 },
    lg: { padding: "13px 28px", fontSize: 15 },
  };
  const v = {
    primary: {
      background: `linear-gradient(135deg, ${C.accent2}, ${C.accent3})`,
      color: "#fff",
      boxShadow: `0 4px 18px ${C.accent2}50`,
    },
    teal: {
      background: `linear-gradient(135deg, ${C.accent}, #00B4D8)`,
      color: "#0D0F1A",
      boxShadow: `0 4px 18px ${C.accent}40`,
    },
    outline: {
      background: "transparent",
      color: C.accent,
      border: `1.5px solid ${C.accent}`,
      boxShadow: `0 0 8px ${C.accent}20`,
    },
    ghost:   { background: "transparent", color: C.muted },
    danger:  { background: `linear-gradient(135deg,${C.rose},#e11d48)`, color: "#fff", boxShadow: `0 4px 14px ${C.rose}40` },
    success: { background: `linear-gradient(135deg,${C.green},#059669)`, color: "#fff" },
    amber:   { background: `linear-gradient(135deg,${C.amber},#d97706)`, color: "#fff" },
    dark:    { background: C.cardHov, color: C.textSoft, border: `1px solid ${C.border}` },
  };
  return (
    <button
      className="btn-hover"
      style={{
        fontFamily: "'Sora',sans-serif", fontWeight: 600, borderRadius: 10,
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        transition: "all .2s", opacity: disabled ? 0.5 : 1,
        ...sz[size], ...v[variant], ...style,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, type = "text", placeholder = "", prefix = "", style = {} }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13, fontWeight: 600 }}>
            {prefix}
          </span>
        )}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="neon-input"
          style={{
            paddingLeft: prefix ? 26 : 14, ...style,
          }}
        />
      </div>
    </div>
  );
}

export function Badge({ label, color = C.accent }) {
  return (
    <span style={{
      background: color + "22", color, fontSize: 11, fontWeight: 700,
      padding: "3px 10px", borderRadius: 20, letterSpacing: ".05em",
      textTransform: "uppercase", display: "inline-block",
      border: `1px solid ${color}35`,
    }}>
      {label}
    </span>
  );
}

export function KpiCard({ label, value, sub, color = C.accent, icon, delta }) {
  return (
    <Card style={{ borderTop: `2px solid ${color}`, padding: "18px 20px", background: C.card }} className="fu">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{label}</p>
          <p style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: C.muted, marginTop: 5 }}>{sub}</p>}
          {delta !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: delta >= 0 ? C.green : C.rose }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%</span>
              <span style={{ fontSize: 11, color: C.muted }}>vs last month</span>
            </div>
          )}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: color + "18", border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function Sparkline({ data, color = C.accent, width = 80, height = 32 }) {
  if (!data || data.length < 2) return null;
  const mn  = Math.min(...data), mx = Math.max(...data), range = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - mn) / range) * (height - 4) + 2}`).join(" ");
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProgressBar({ value, max, color = C.accent, height = 8 }) {
  return (
    <div style={{ height, background: C.border, borderRadius: height / 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${clamp((value / max) * 100, 0, 100)}%`, background: color, borderRadius: height / 2, transition: "width .7s ease", boxShadow: `0 0 6px ${color}60` }} />
    </div>
  );
}

export function DonutChart({ segments, size = 100, label }) {
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  let off = 0;
  const total = segments.reduce((a, s) => a + s.value, 0);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={12} />
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circ, gap = circ - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={12}
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-off} strokeLinecap="butt"
              style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dasharray .6s", filter: `drop-shadow(0 0 4px ${seg.color}80)` }} />
          );
          off += dash;
          return el;
        })}
      </svg>
      {label && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center", lineHeight: 1.2 }}>
          {label}
        </div>
      )}
    </div>
  );
}

export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, color = C.accent, unit = "%" }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft }}>{label}</label>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace" }}>{value > 0 ? "+" : ""}{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, height: 4, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 2 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

export function Alert({ type = "info", children }) {
  const s = {
    info:    { bg: C.accent2 + "18", border: C.accent2, icon: "💡" },
    warning: { bg: C.amber   + "18", border: C.amber,   icon: "⚠️" },
    danger:  { bg: C.rose    + "18", border: C.rose,    icon: "🚨" },
    success: { bg: C.green   + "18", border: C.green,   icon: "✅" },
  };
  const st = s[type];
  return (
    <div style={{ background: st.bg, border: `1px solid ${st.border}35`, borderLeft: `3px solid ${st.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, boxShadow: `0 0 12px ${st.border}15` }}>
      <span style={{ fontSize: 14 }}>{st.icon}</span>
      <p style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, padding: 28, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: `0 24px 80px rgba(0,0,0,.6), 0 0 0 1px ${C.border}`, border: `1px solid ${C.borderBright}` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{title}</h2>
          <button onClick={onClose} style={{ background: C.bgDeep, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 16, color: C.muted, lineHeight: 1, borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
