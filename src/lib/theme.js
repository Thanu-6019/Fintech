// ─── Dark Neon Design Tokens ──────────────────────────────────────────────────
export const C = {
  bg:       "#0D0F1A",
  bgDeep:   "#080A12",
  card:     "#161929",
  cardHov:  "#1E2236",
  accent:   "#00E5C3",       // neon teal
  accent2:  "#7C3AED",       // purple
  accent3:  "#4F46E5",       // indigo
  teal:     "#00E5C3",
  green:    "#22D3AE",
  amber:    "#FBBF24",
  rose:     "#FB7185",
  orange:   "#FB923C",
  muted:    "#8B8FA8",
  border:   "#2A2D4A",
  borderBright: "#3D4166",
  text:     "#F0F2FF",
  textSoft: "#C5C9E8",
  navy:     "#1E1B4B",
  glow:     "#00E5C320",
  glowPurple: "#7C3AED20",
};

export const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sora', sans-serif; background: ${C.bg}; color: ${C.text}; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: ${C.bgDeep}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: ${C.borderBright}; }
  input, select, textarea { font-family: 'Sora', sans-serif; }
  input[type="range"] { accent-color: ${C.accent}; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin     { to { transform:rotate(360deg); } }
  @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes glow-pulse { 0%,100%{box-shadow:0 0 12px ${C.accent}40;} 50%{box-shadow:0 0 28px ${C.accent}80;} }
  @keyframes neon-flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.7} 94%{opacity:1} }

  .fu  { animation: fadeUp .4s ease both; }
  .fu1 { animation: fadeUp .4s .07s ease both; }
  .fu2 { animation: fadeUp .4s .14s ease both; }
  .fu3 { animation: fadeUp .4s .21s ease both; }
  .fu4 { animation: fadeUp .4s .28s ease both; }
  .spin { animation: spin .8s linear infinite; }
  .pulse { animation: pulse 1.4s ease infinite; }
  .shimmer { background: linear-gradient(90deg,${C.card} 25%,${C.cardHov} 50%,${C.card} 75%); background-size:400px 100%; animation:shimmer 1.2s infinite; }

  .btn-hover { transition: all .2s ease; }
  .btn-hover:hover { filter: brightness(1.12); transform: translateY(-1px); }

  .card-hover { transition: border-color .2s, box-shadow .2s; }
  .card-hover:hover { border-color: ${C.accent}50 !important; box-shadow: 0 0 16px ${C.accent}15 !important; }

  .nav-item { transition: all .18s ease; }
  .nav-item:hover { background: ${C.accent}12 !important; color: ${C.accent} !important; }
  .nav-item-active { background: ${C.accent}18 !important; color: ${C.accent} !important; border-right: 2px solid ${C.accent}; box-shadow: inset 0 0 12px ${C.accent}10; }

  .row-hover:hover { background: ${C.cardHov} !important; }

  .neon-input {
    width: 100%; padding: 12px 14px;
    border: 1.5px solid ${C.border};
    border-radius: 10px; font-size: 14px;
    background: ${C.bgDeep}; color: ${C.text};
    font-family: 'Sora', sans-serif;
    transition: border .2s, box-shadow .2s;
    outline: none;
  }
  .neon-input:focus {
    border-color: ${C.accent};
    box-shadow: 0 0 0 3px ${C.accent}25, 0 0 12px ${C.accent}20;
  }
  .neon-input::placeholder { color: ${C.muted}; }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: ${C.accent} !important;
    box-shadow: 0 0 0 3px ${C.accent}25, 0 0 12px ${C.accent}20 !important;
  }
`;
