import { useState, useEffect, useRef, useCallback } from "react";
import { C, STYLE } from "../lib/theme";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── Monte Carlo Animation Engine ─────────────────────────────────────────────
function generateSimRun(seed, months = 24) {
  let cash = 5000000, rev = 480000, burn = 390000;
  const path = [];
  const rng = (s) => { s = Math.sin(s) * 43758.5453; return s - Math.floor(s); };
  for (let m = 0; m < months; m++) {
    const noise = (rng(seed + m * 0.37) - 0.5) * 0.08;
    rev = rev * (1 + 0.04 + noise);
    burn = burn * 1.02;
    cash += rev - burn;
    path.push(cash);
  }
  return path;
}

function AnimatedChart() {
  const canvasRef = useRef(null);
  const frameRef  = useRef(0);
  const phaseRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    // Pre-generate 12 simulation runs
    const runs = Array.from({ length: 12 }, (_, i) => generateSimRun(i * 3.14 + 1, 24));
    const allVals = runs.flat();
    const minV = Math.min(...allVals), maxV = Math.max(...allVals);
    const range = maxV - minV || 1;
    const PAD = { top: 30, bottom: 30, left: 10, right: 10 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    const toX = (i, n) => PAD.left + (i / (n - 1)) * plotW;
    const toY = (v) => PAD.top + (1 - (v - minV) / range) * plotH;

    // Color palette for runs — neon teal to purple spectrum
    const colors = [
      "#00E5C3", "#22D3AE", "#00B4D8", "#7C3AED", "#4F46E5",
      "#00E5C3", "#22D3AE", "#00B4D850", "#7C3AED50", "#4F46E550",
      "#00E5C330", "#22D3AE30",
    ];

    let animFrame;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = "#2A2D4A";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = PAD.top + (i / 4) * plotH;
        ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
      }
      for (let i = 0; i <= 6; i++) {
        const x = PAD.left + (i / 6) * plotW;
        ctx.beginPath(); ctx.moveTo(x, PAD.top); ctx.lineTo(x, H - PAD.bottom); ctx.stroke();
      }

      const progress = Math.min(phaseRef.current / 80, 1); // animate in over 80 frames
      const pts = Math.max(2, Math.round(progress * 24));

      // Draw each run up to current progress
      runs.forEach((run, ri) => {
        const clr = colors[ri % colors.length];
        const isHighlight = ri < 3; // top 3 runs are fully opaque
        ctx.strokeStyle = clr;
        ctx.lineWidth = isHighlight ? 2 : 1;
        ctx.shadowBlur = isHighlight ? 8 : 0;
        ctx.shadowColor = clr;
        ctx.globalAlpha = isHighlight ? 0.9 : 0.35;
        ctx.beginPath();
        for (let i = 0; i < pts && i < run.length; i++) {
          const x = toX(i, run.length), y = toY(run[i]);
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      // Animated scanning line
      if (progress < 1) {
        const scanX = PAD.left + progress * plotW;
        const grad = ctx.createLinearGradient(scanX - 30, 0, scanX, 0);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, "#00E5C360");
        ctx.fillStyle = grad;
        ctx.fillRect(scanX - 30, PAD.top, 30, plotH);

        ctx.strokeStyle = "#00E5C3";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00E5C3";
        ctx.beginPath(); ctx.moveTo(scanX, PAD.top); ctx.lineTo(scanX, H - PAD.bottom); ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Labels
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#8B8FA8";
      ctx.globalAlpha = 0.7;
      ["M1","M6","M12","M18","M24"].forEach((lbl, i) => {
        ctx.fillText(lbl, PAD.left + (i / 4) * plotW - 8, H - 8);
      });
      ctx.globalAlpha = 1;

      phaseRef.current += 1;
      // After full draw, slow loop with gentle pulse
      if (phaseRef.current > 80 + 120) phaseRef.current = 0; // restart loop
      animFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={460}
      height={220}
      style={{ width: "100%", height: 220, display: "block" }}
    />
  );
}

// ─── Floating Metric Pill ──────────────────────────────────────────────────────
function MetricPill({ icon, label, value, color, delay = 0 }) {
  return (
    <div className="fu" style={{
      animationDelay: `${delay}s`,
      display: "inline-flex", alignItems: "center", gap: 10,
      background: `${color}12`, border: `1px solid ${color}35`,
      borderRadius: 12, padding: "10px 16px",
      boxShadow: `0 0 16px ${color}20`,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <p style={{ fontSize: 11, color: "#8B8FA8", textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>{label}</p>
        <p style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.2 }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Animated Particles (pure CSS via inline keyframes) ─────────────────────
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 53) % 90}%`,
    top:  `${10 + (i * 37) % 80}%`,
    size: 2 + (i % 3),
    color: i % 3 === 0 ? C.accent : i % 3 === 1 ? C.accent2 : C.accent3,
    dur: 3 + (i % 4),
    delay: i * 0.4,
  }));

  return (
    <>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: p.left, top: p.top,
          width: p.size, height: p.size,
          borderRadius: "50%",
          background: p.color,
          boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          animation: `pulse ${p.dur}s ${p.delay}s ease-in-out infinite`,
          pointerEvents: "none",
        }} />
      ))}
    </>
  );
}

// ─── Left panel — Graphics ─────────────────────────────────────────────────────
function GraphicsPanel() {
  const [tick, setTick] = useState(0);
  const features = [
    { icon: "🧪", text: "Monte Carlo Simulation Engine" },
    { icon: "🤖", text: "AI CFO Summaries via Claude" },
    { icon: "📊", text: "P10 / P50 / P90 Runway Projections" },
    { icon: "💸", text: "Salary & Budget Planning" },
    { icon: "📋", text: "Bill & Expense Management" },
  ];

  useEffect(() => {
    const t = setInterval(() => setTick(n => (n + 1) % features.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      flex: 1, minHeight: "100vh",
      background: `linear-gradient(160deg, #080A12 0%, #0D0F1A 50%, #0F1120 100%)`,
      display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      padding: "48px 44px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background glow orbs */}
      <div style={{ position: "absolute", top: -80, left: -80, width: 380, height: 380, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}12, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, right: -60, width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent2}15, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", right: "20%", width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent3}10, transparent 70%)`, pointerEvents: "none" }} />

      {/* Floating neon particles */}
      <Particles />

      {/* Top — Logo + tagline */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: `linear-gradient(135deg, ${C.accent2}, ${C.accent3})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: `0 0 24px ${C.accent2}60`,
          }}>💰</div>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.03em", color: C.text }}>
            fintech<span style={{ color: C.accent, textShadow: `0 0 14px ${C.accent}` }}>.ai</span>
          </span>
        </div>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, maxWidth: 340 }}>
          Your AI-powered CFO platform with Monte Carlo simulation, financial projections, and intelligent insights.
        </p>
      </div>

      {/* Middle — Animated Monte Carlo Chart */}
      <div style={{ position: "relative", zIndex: 1 }} className="fu1">
        <div style={{
          background: `${C.card}CC`,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "20px 20px 12px",
          boxShadow: `0 8px 40px rgba(0,0,0,.5), 0 0 0 1px ${C.accent}10`,
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Monte Carlo Simulation</p>
              <p style={{ fontSize: 11, color: C.muted }}>200 scenarios · 24-month projection</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[C.green, C.accent, C.rose].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 20, height: 2, background: c, borderRadius: 1, boxShadow: `0 0 4px ${c}` }} />
                  <span style={{ fontSize: 10, color: C.muted }}>{["P90","P50","P10"][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <AnimatedChart />
        </div>
      </div>

      {/* Metrics row */}
      <div className="fu2" style={{ display: "flex", gap: 10, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
        <MetricPill icon="⛽" label="P50 Runway" value="18 mo" color={C.green} delay={0.1} />
        <MetricPill icon="🎲" label="Survival Rate" value="87%" color={C.accent} delay={0.2} />
        <MetricPill icon="💰" label="Cash Reserve" value="₹50L" color={C.accent2} delay={0.3} />
      </div>

      {/* Bottom — rotating feature highlight */}
      <div className="fu3" style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          background: `${C.accent}08`,
          border: `1px solid ${C.accent}25`,
          borderRadius: 12,
          padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: `0 0 20px ${C.accent}10`,
        }}>
          <span style={{ fontSize: 24, flexShrink: 0, transition: "all .4s" }}>{features[tick].icon}</span>
          <div>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>Platform Feature</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.text, transition: "all .3s" }}>{features[tick].text}</p>
          </div>
          {/* Dot progress indicator */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {features.map((_, i) => (
              <div key={i} style={{
                width: i === tick ? 18 : 5, height: 5, borderRadius: 3,
                background: i === tick ? C.accent : C.border,
                boxShadow: i === tick ? `0 0 8px ${C.accent}` : "none",
                transition: "all .3s ease",
              }} />
            ))}
          </div>
        </div>

        {/* Footer credit */}
        <p style={{ fontSize: 11, color: C.muted, marginTop: 20, opacity: 0.6 }}>
          © 2026 fintech.ai · Powered by Monte Carlo + Claude AI
        </p>
      </div>
    </div>
  );
}

// ─── Main Auth Page ────────────────────────────────────────────────────────────
export default function AuthPage({ onLogin }) {
  const [step, setStep]               = useState("check");
  const [email, setEmail]             = useState("");
  const [form, setForm]               = useState({ name: "", password: "", user_type: "business", role: "analyst" });
  const [err, setErr]                 = useState("");
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass]       = useState(false);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const roles = ["admin", "analyst", "viewer"];

  const editDistance = (a, b) => {
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  };

  const isLikelyMisspelledGmail = (domain) => {
    if (domain === "gmail.com") return false;
    return editDistance(domain, "gmail.com") <= 2;
  };

  const normalizeEmail = (value) => value.trim().toLowerCase();
  const isValidEmail = (value) => {
    const normalized = normalizeEmail(value);
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z]{2,}$/i;
    if (!emailRegex.test(normalized)) return false;
    const domain = normalized.split("@")[1] || "";
    if (isLikelyMisspelledGmail(domain)) return false;
    return true;
  };

  useEffect(() => {}, []);

  const checkEmail = async () => {
    setErr("");
    const trimmed = normalizeEmail(email);
    if (!isValidEmail(trimmed))
      return setErr("Email or password is incorrect");
    try {
      setLoading(true);
      const result = await apiPost("/api/auth/exists", { email: trimmed });
      if (result.exists) { setStep("signin"); }
      else { setStep("signup"); setForm(p => ({ ...p, name: "" })); }
    } catch {
      setErr("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    setErr("");
    if (!form.password) return setErr("Email or password is incorrect");
    try {
      setLoading(true);
      const result = await apiPost("/api/auth/login", {
        email: normalizeEmail(email),
        password: form.password,
      });
      onLogin({ ...result.user, token: result.token });
    } catch {
      setErr("Email or password is incorrect");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    setErr("");
    if (!isValidEmail(email))    return setErr("Enter a valid email address");
    if (!form.name.trim())        return setErr("Full name is required");
    if (form.password.length < 6) return setErr("Password must be 6+ characters");
    try {
      setLoading(true);
      const result = await apiPost("/api/auth/register", {
        name: form.name.trim(),
        email: normalizeEmail(email),
        password: form.password,
        user_type: form.user_type,
        role: form.role,
      });
      onLogin({ ...result.user, token: result.token });
    } catch (e) {
      if ((e.message || "").toLowerCase().includes("already")) {
        setStep("signin");
        setErr("Email already registered — please sign in");
      } else {
        setErr(e.message || "Unable to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSSO = () => {
    setGoogleLoading(true); setErr("");
    setTimeout(async () => {
      const mockProfile = {
        email: `user${Math.floor(Math.random() * 9000 + 1000)}@gmail.com`,
        name: "Google User",
      };
      const mockPassword = `g_oauth_${Date.now()}`;
      try {
        const reg = await apiPost("/api/auth/register", {
          name: mockProfile.name,
          email: mockProfile.email.toLowerCase(),
          password: mockPassword,
          user_type: "employee",
          role: "analyst",
        });
        onLogin({ ...reg.user, token: reg.token, authProvider: "google" });
      } catch (e) {
        if ((e.message || "").toLowerCase().includes("already")) {
          const login = await apiPost("/api/auth/login", {
            email: mockProfile.email.toLowerCase(),
            password: mockPassword,
          }).catch(() => null);
          if (login?.user) {
            onLogin({ ...login.user, token: login.token, authProvider: "google" });
          } else {
            setErr("Google sign-in unavailable for existing mock user");
          }
        } else {
          setErr("Unable to connect to server");
        }
      } finally {
        setGoogleLoading(false);
      }
    }, 1400);
  };

  const resetToEmail = () => { setStep("check"); setErr(""); setForm(p => ({ ...p, password: "" })); };

  const Spinner = () => (
    <span className="spin" style={{ display: "inline-block", width: 16, height: 16, border: `2px solid rgba(255,255,255,.25)`, borderTopColor: "#fff", borderRadius: "50%" }} />
  );

  const inputBase = {
    width: "100%", padding: "12px 14px",
    border: `1.5px solid ${C.border}`,
    borderRadius: 10, fontSize: 14,
    background: "#080A12", color: C.text,
    fontFamily: "'Sora',sans-serif",
    transition: "border .2s, box-shadow .2s",
    outline: "none",
  };
  const focusIn  = e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accent}25, 0 0 12px ${C.accent}20`; };
  const focusOut = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; };

  const Label = ({ children }) => (
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>
      {children}
    </label>
  );

  const LoginBtn = ({ onClick, disabled, children }) => (
    <button onClick={onClick} disabled={disabled} className="btn-hover"
      style={{ width: "100%", padding: "13px 0", background: `linear-gradient(135deg, ${C.accent2} 0%, ${C.accent3} 100%)`, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Sora',sans-serif", boxShadow: `0 4px 20px ${C.accent2}50, 0 0 0 1px ${C.accent2}20`, opacity: disabled ? 0.7 : 1, marginBottom: 12 }}>
      {children}
    </button>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bgDeep }}>
      <style>{STYLE}</style>

      {/* ── Left: Graphics Panel ── */}
      <GraphicsPanel />

      {/* ── Right: Login Panel ── */}
      <div style={{
        width: 480, minHeight: "100vh", flexShrink: 0,
        background: C.bgDeep,
        borderLeft: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 44px",
        position: "relative",
      }}>
        {/* Subtle right-panel glow */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent2}12, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}10, transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }} className="fu">

          {/* ── Email check step ── */}
          {step === "check" && (
            <div className="fu">
              <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4, color: C.text }}>Welcome back</h2>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>Sign in to your fintech.ai workspace</p>

              <div style={{ marginBottom: 14 }}>
                <Label>Email</Label>
                <input type="email" value={email} placeholder="you@company.com"
                  onChange={e => { setEmail(e.target.value); setErr(""); }}
                  onKeyDown={e => e.key === "Enter" && checkEmail()}
                  onFocus={focusIn} onBlur={focusOut}
                  style={inputBase} autoFocus />
              </div>

              {err && <p style={{ color: C.rose, fontSize: 13, marginBottom: 10, fontWeight: 500 }}>⚠ {err}</p>}

              <LoginBtn onClick={checkEmail} disabled={loading}>
                {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Spinner /> Checking…</span> : "Login"}
              </LoginBtn>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 11, color: C.muted }}>or</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              <button onClick={handleGoogleSSO} disabled={googleLoading} className="btn-hover"
                style={{ width: "100%", padding: "12px 0", background: "#1E2236", color: C.textSoft, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: googleLoading ? "not-allowed" : "pointer", fontFamily: "'Sora',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: googleLoading ? 0.7 : 1, transition: "all .2s" }}>
                {googleLoading
                  ? <><span className="spin" style={{ display: "inline-block", width: 18, height: 18, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%" }} /> Connecting…</>
                  : (<><svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>Login with Google</>)}
              </button>
            </div>
          )}

          {/* ── Sign In step ── */}
          {step === "signin" && (
            <div className="fu">
              <button onClick={resetToEmail} style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 20, fontFamily: "'Sora',sans-serif", padding: 0 }}>← Back</button>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: C.text }}>Sign in</h2>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "10px 14px", background: "#080A12", borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent2},${C.accent3})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{email.trim()[0]?.toUpperCase()}</div>
                <span style={{ fontSize: 13, color: C.textSoft, fontWeight: 500 }}>{email.trim()}</span>
              </div>

              <div style={{ marginBottom: 14 }}>
                <Label>Password</Label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={form.password} placeholder="••••••••"
                    onChange={e => f("password", e.target.value)} onKeyDown={e => e.key === "Enter" && signIn()}
                    onFocus={focusIn} onBlur={focusOut}
                    style={{ ...inputBase, paddingRight: 44 }} autoFocus />
                  <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16 }}>{showPass ? "🙈" : "👁"}</button>
                </div>
              </div>

              {err && <p style={{ color: C.rose, fontSize: 13, marginBottom: 10, fontWeight: 500 }}>⚠ {err}</p>}
              <LoginBtn onClick={signIn} disabled={loading}>
                {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Spinner /> Signing in…</span> : "Sign In →"}
              </LoginBtn>
              <p style={{ textAlign: "center", fontSize: 12, color: C.muted }}>
                Not your account?{" "}
                <button onClick={resetToEmail} style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontWeight: 600, fontSize: 12, fontFamily: "'Sora',sans-serif" }}>Use a different email</button>
              </p>
            </div>
          )}

          {/* ── Sign Up step ── */}
          {step === "signup" && (
            <div className="fu">
              <button onClick={resetToEmail} style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginBottom: 20, fontFamily: "'Sora',sans-serif", padding: 0 }}>← Back</button>

              <div style={{ background: `${C.accent}10`, border: `1px solid ${C.accent}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>✨</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>New account</p>
                  <p style={{ fontSize: 12, color: C.muted }}>Creating workspace for <strong style={{ color: C.textSoft }}>{email.trim()}</strong></p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, marginBottom: 12 }}>
                  <Label>Full Name</Label>
                  <input type="text" value={form.name} placeholder="Your Name"
                    onChange={e => f("name", e.target.value)}
                    onFocus={focusIn} onBlur={focusOut} style={inputBase} autoFocus />
                </div>
              </div>

              <div style={{ marginBottom: 14, position: "relative" }}>
                <Label>Create Password</Label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={form.password} placeholder="Min 6 characters"
                    onChange={e => f("password", e.target.value)} onKeyDown={e => e.key === "Enter" && signUp()}
                    onFocus={focusIn} onBlur={focusOut}
                    style={{ ...inputBase, paddingRight: 44 }} />
                  <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16 }}>{showPass ? "🙈" : "👁"}</button>
                </div>
                {form.password && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", transition: "width .3s, background .3s", width: form.password.length >= 10 ? "100%" : form.password.length >= 6 ? "60%" : "30%", background: form.password.length >= 10 ? C.green : form.password.length >= 6 ? C.amber : C.rose, boxShadow: `0 0 4px ${form.password.length >= 6 ? C.green : C.rose}` }} />
                    </div>
                    <p style={{ fontSize: 11, color: form.password.length >= 10 ? C.green : form.password.length >= 6 ? C.amber : C.rose, marginTop: 2 }}>
                      {form.password.length >= 10 ? "Strong" : form.password.length >= 6 ? "Good" : "Too short"}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <Label>I am a</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["business","employee"].map(t => (
                    <button key={t} onClick={() => f("user_type", t)}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: `1.5px solid ${form.user_type === t ? C.accent : C.border}`, background: form.user_type === t ? `${C.accent}15` : "transparent", color: form.user_type === t ? C.accent : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all .2s", boxShadow: form.user_type === t ? `0 0 10px ${C.accent}30` : "none" }}>
                      {t === "business" ? "🏢 Business" : "👤 Employee"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <Label>Role</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  {roles.map(r => (
                    <button key={r} onClick={() => f("role", r)}
                      style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1.5px solid ${form.role === r ? C.accent2 : C.border}`, background: form.role === r ? `${C.accent2}15` : "transparent", color: form.role === r ? C.accent2 : C.muted, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Sora',sans-serif", transition: "all .2s", textTransform: "capitalize", boxShadow: form.role === r ? `0 0 10px ${C.accent2}30` : "none" }}>{r}</button>
                  ))}
                </div>
              </div>

              {err && <p style={{ color: C.rose, fontSize: 13, marginBottom: 10, fontWeight: 500 }}>⚠ {err}</p>}
              <LoginBtn onClick={signUp} disabled={loading}>
                {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Spinner /> Creating…</span> : "Create Account →"}
              </LoginBtn>
              <p style={{ textAlign: "center", fontSize: 12, color: C.muted }}>
                Already registered?{" "}
                <button onClick={resetToEmail} style={{ background: "none", border: "none", cursor: "pointer", color: C.accent, fontWeight: 600, fontSize: 12, fontFamily: "'Sora',sans-serif" }}>Sign in</button>
              </p>
            </div>
          )}

          {/* Security footer */}
          <p style={{ textAlign: "center", color: C.muted, fontSize: 11, marginTop: 28, opacity: 0.6 }}>
            🔒 Credentials stored securely · Role-based access control
          </p>
        </div>
      </div>
    </div>
  );
}
