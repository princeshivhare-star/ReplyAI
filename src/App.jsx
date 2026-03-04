import { useState, useEffect, useRef } from "react";

/* ─── FONTS & GLOBAL CSS ─── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap');`;

const G = {
  bg: "#08090d",
  s1: "#0f1018",
  s2: "#161820",
  card: "#1c1e28",
  border: "#252733",
  b2: "#2e3145",
  accent: "#ff5c3a",
  a2: "#ff8c5a",
  teal: "#00d4aa",
  blue: "#4f8fff",
  ig: "#e1306c",
  fb: "#1877f2",
  text: "#f2f3ff",
  muted: "#6b6e8a",
  dim: "#404360",
  ok: "#00d4aa",
  warn: "#f59e0b",
};

const injectCSS = () => {
  const style = document.createElement("style");
  style.innerHTML = `
    ${FONTS}
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:${G.bg};font-family:'Outfit',sans-serif;color:${G.text};min-height:100vh}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:${G.border};border-radius:2px}
    input,textarea,select{font-family:'Outfit',sans-serif}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes floatBg{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-20px) rotate(3deg)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes checkPop{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
    .fu{animation:fadeUp 0.5s ease both}
    .fi{animation:fadeIn 0.4s ease both}
    .d1{animation-delay:0.05s}.d2{animation-delay:0.12s}.d3{animation-delay:0.19s}.d4{animation-delay:0.26s}.d5{animation-delay:0.33s}
    .spin{animation:spin 1s linear infinite}
    .pulse-anim{animation:pulse 2s ease infinite}
    .check-pop{animation:checkPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both}
  `;
  document.head.appendChild(style);
};

/* ─── SHARED COMPONENTS ─── */
const Inp = ({ label, placeholder, value, onChange, type = "text", icon, hint, error, prefix }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 500, color: G.muted, marginBottom: 7, letterSpacing: "0.2px" }}>{label}</div>}
    <div style={{ position: "relative" }}>
      {prefix && <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: G.muted, userSelect: "none" }}>{prefix}</span>}
      {icon && <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>{icon}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", background: G.s1, border: `1.5px solid ${error ? "#ef4444" : G.border}`,
          borderRadius: 12, padding: `11px 14px 11px ${icon ? 40 : prefix ? 30 : 14}px`,
          color: G.text, fontSize: 14, outline: "none", transition: "border-color 0.2s",
        }}
        onFocus={e => e.target.style.borderColor = error ? "#ef4444" : G.accent}
        onBlur={e => e.target.style.borderColor = error ? "#ef4444" : G.border}
      />
    </div>
    {hint && <div style={{ fontSize: 12, color: G.dim, marginTop: 5 }}>{hint}</div>}
    {error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 5 }}>⚠ {error}</div>}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", full = false, disabled = false, loading = false }) => {
  const styles = {
    primary: { background: `linear-gradient(135deg, ${G.accent}, ${G.a2})`, color: "#fff", boxShadow: `0 4px 20px rgba(255,92,58,0.35)` },
    teal: { background: `linear-gradient(135deg, ${G.teal}, #00b894)`, color: G.bg, boxShadow: `0 4px 20px rgba(0,212,170,0.3)` },
    ghost: { background: G.card, color: G.text, border: `1.5px solid ${G.border}` },
    outline: { background: "transparent", color: G.accent, border: `1.5px solid ${G.accent}` },
    danger: { background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.3)" },
  };
  const sizes = { sm: "8px 14px", md: "11px 22px", lg: "14px 32px", xl: "16px 40px" };
  return (
    <button onClick={!disabled && !loading ? onClick : undefined} style={{
      ...styles[variant], padding: sizes[size], borderRadius: 12,
      fontFamily: "'Outfit',sans-serif", fontSize: size === "sm" ? 13 : size === "xl" ? 16 : 14,
      fontWeight: 600, cursor: disabled || loading ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      display: "inline-flex", alignItems: "center", gap: 7, border: "none",
      transition: "transform 0.15s, box-shadow 0.15s", width: full ? "100%" : "auto",
      justifyContent: "center",
    }}
      onMouseEnter={e => { if (!disabled && !loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      {loading ? <span className="spin" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} /> : children}
    </button>
  );
};

const Badge = ({ children, color = "orange" }) => {
  const map = {
    orange: { bg: "rgba(255,92,58,0.15)", color: "#ff8c5a", border: "rgba(255,92,58,0.3)" },
    teal: { bg: "rgba(0,212,170,0.12)", color: "#00d4aa", border: "rgba(0,212,170,0.25)" },
    blue: { bg: "rgba(79,143,255,0.12)", color: "#7eb0ff", border: "rgba(79,143,255,0.25)" },
    red: { bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "rgba(239,68,68,0.25)" },
    ig: { bg: "rgba(225,48,108,0.15)", color: "#f06292", border: "rgba(225,48,108,0.3)" },
    fb: { bg: "rgba(24,119,242,0.15)", color: "#63a4ff", border: "rgba(24,119,242,0.3)" },
  };
  const c = map[color] || map.orange;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {children}
    </span>
  );
};

const Toggle = ({ on, onToggle }) => (
  <button onClick={onToggle} style={{
    width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
    background: on ? G.teal : G.border, transition: "background 0.3s", flexShrink: 0,
  }}>
    <span style={{
      position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18,
      borderRadius: "50%", background: "#fff", transition: "left 0.3s",
    }} />
  </button>
);

const StepDots = ({ total, current }) => (
  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 32 }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        height: 6, borderRadius: 3, transition: "all 0.3s",
        width: i === current ? 24 : 6,
        background: i <= current ? G.accent : G.border,
      }} />
    ))}
  </div>
);

/* ─── KEYWORD TEMPLATES ─── */
const TEMPLATES = [
  {
    id: "ecom", label: "🛍️ E-Commerce", desc: "For online stores & product sellers",
    rules: [
      { keyword: "price", reply: "Hi! 👋 Our prices start from just $19. Check our website for full pricing or DM us for a custom quote!", matchType: "contains" },
      { keyword: "shipping", reply: "We ship worldwide! 🚀 Standard: 3-5 days. Express: 1-2 days. Free shipping on orders $50+!", matchType: "contains" },
      { keyword: "discount", reply: "Great news! 🎁 Use code SAVE20 for 20% off. Valid this week only. Shop now!", matchType: "contains" },
      { keyword: "return", reply: "We offer a 30-day hassle-free return policy. 💯 Contact us at support@store.com to start a return.", matchType: "contains" },
      { keyword: "available", reply: "Yes, still in stock! ✅ Limited quantities left. Order now before it's gone. Link in bio!", matchType: "contains" },
    ],
  },
  {
    id: "service", label: "💼 Service Business", desc: "For freelancers, agencies & consultants",
    rules: [
      { keyword: "quote", reply: "Hi! I'd love to help 😊 Please DM me your project details and I'll send a custom quote within 24 hours!", matchType: "contains" },
      { keyword: "portfolio", reply: "Check out my portfolio at the link in my bio! 🎨 I'd be happy to discuss how I can help your brand.", matchType: "contains" },
      { keyword: "availability", reply: "I'm currently taking on new clients for next month! 📅 DM me to book a free discovery call.", matchType: "contains" },
      { keyword: "collab", reply: "Love your interest in collaborating! 🤝 DM me with your project brief and let's talk!", matchType: "contains" },
    ],
  },
  {
    id: "food", label: "🍕 Restaurant / Food", desc: "For restaurants, cafes & food brands",
    rules: [
      { keyword: "menu", reply: "Our full menu is on our website! 📋 Link in bio. We also have daily specials — follow us to stay updated!", matchType: "contains" },
      { keyword: "reservation", reply: "We'd love to have you! 🍽️ Book a table via the link in bio or call us at (555) 000-1234.", matchType: "contains" },
      { keyword: "delivery", reply: "Yes, we deliver! 🛵 Order through our app or DoorDash. Free delivery on orders over $30!", matchType: "contains" },
      { keyword: "hours", reply: "We're open Mon–Fri 9am–10pm, Weekends 10am–11pm. ⏰ See you soon!", matchType: "contains" },
    ],
  },
  {
    id: "blank", label: "✏️ Start from Scratch", desc: "Build your own custom keyword rules",
    rules: [],
  },
];

const PLANS = [
  {
    id: "starter", name: "Starter", price: 19, period: "mo",
    features: ["5 keyword rules", "1 Instagram account", "500 auto-replies/mo", "Basic analytics", "Email support"],
    limit: "Perfect for solo creators",
    color: G.teal,
  },
  {
    id: "pro", name: "Pro", price: 49, period: "mo", popular: true,
    features: ["20 keyword rules", "2 platforms (IG + FB)", "Unlimited replies", "Advanced analytics", "Priority support", "AI reply suggestions"],
    limit: "Best for growing businesses",
    color: G.accent,
  },
  {
    id: "agency", name: "Agency", price: 149, period: "mo",
    features: ["Unlimited rules", "10 accounts", "All platforms", "White-label dashboard", "API access", "Dedicated manager"],
    limit: "For agencies & power users",
    color: G.blue,
  },
];

/* ══════════════════════════════════════════════
   SCREEN 1 — LANDING PAGE
══════════════════════════════════════════════ */
const Landing = ({ onStart }) => {
  return (
    <div style={{ minHeight: "100vh", background: G.bg, position: "relative", overflow: "hidden" }}>
      {/* Bg blobs */}
      <div style={{ position: "fixed", top: -200, right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,92,58,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -200, left: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 60px", borderBottom: `1px solid ${G.border}` }}>
        <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 22 }}>
          <span style={{ color: G.accent }}>Reply</span><span style={{ color: G.teal }}>AI</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={onStart}>Login</Btn>
          <Btn variant="primary" size="sm" onClick={onStart}>Get Started Free →</Btn>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 40px 60px", textAlign: "center" }}>
        <div className="fu" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,92,58,0.1)", border: "1px solid rgba(255,92,58,0.3)", borderRadius: 20, padding: "5px 14px", fontSize: 13, color: G.a2, fontWeight: 600, marginBottom: 24 }}>
          ⚡ AI-Powered Social Media Automation
        </div>
        <h1 className="fu d1" style={{ fontFamily: "'Clash Display',sans-serif", fontSize: "clamp(38px,5vw,64px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 20 }}>
          Auto-Reply to Every<br />
          <span style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundImage: `linear-gradient(135deg, ${G.accent}, ${G.a2}, ${G.teal})`, backgroundSize: "200%" }}>
            Comment & DM
          </span>{" "}Instantly
        </h1>
        <p className="fu d2" style={{ fontSize: 18, color: G.muted, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Set keywords, write replies, connect Instagram & Facebook — and let AI handle every incoming message 24/7. No coding needed.
        </p>
        <div className="fu d3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="primary" size="xl" onClick={onStart}>Start Free Trial →</Btn>
          <Btn variant="ghost" size="xl">▶ Watch Demo</Btn>
        </div>
        <div className="fu d4" style={{ marginTop: 24, fontSize: 13, color: G.dim }}>
          ✓ No credit card required &nbsp;·&nbsp; ✓ Setup in 2 minutes &nbsp;·&nbsp; ✓ Cancel anytime
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 40px 80px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { icon: "⚡", title: "Instant Replies", desc: "Auto-reply in under 1 second to any comment or DM that matches your keywords." },
          { icon: "🎯", title: "Keyword Targeting", desc: "Set exact or partial keyword matches per platform. Smart, flexible, and powerful." },
          { icon: "📊", title: "Real-time Analytics", desc: "Track how many replies were sent, which keywords fired, and conversion rates." },
          { icon: "📸", title: "Instagram + Facebook", desc: "Connect multiple accounts across both platforms in one unified dashboard." },
          { icon: "🤖", title: "AI Smart Replies", desc: "Let AI suggest better reply copy based on your brand tone and past performance." },
          { icon: "🔒", title: "Spam Protection", desc: "Built-in spam and bot detection keeps your auto-replies going only to real users." },
        ].map((f, i) => (
          <div key={i} className="fu" style={{ animationDelay: `${i * 0.07}s`, background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 22, transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = G.accent + "60"}
            onMouseLeave={e => e.currentTarget.style.borderColor = G.border}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{f.title}</div>
            <div style={{ fontSize: 13.5, color: G.muted, lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* PRICING */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 40px 100px", textAlign: "center" }}>
        <h2 className="fu" style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 36, fontWeight: 700, marginBottom: 10 }}>Simple Pricing</h2>
        <p className="fu d1" style={{ color: G.muted, marginBottom: 40 }}>Start free, upgrade when you're ready</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, alignItems: "start" }}>
          {PLANS.map((p, i) => (
            <div key={p.id} style={{
              background: p.popular ? `linear-gradient(160deg, rgba(255,92,58,0.08), ${G.card})` : G.card,
              border: `1.5px solid ${p.popular ? G.accent : G.border}`,
              borderRadius: 20, padding: 28, position: "relative",
              transform: p.popular ? "scale(1.03)" : "scale(1)",
              boxShadow: p.popular ? `0 0 40px rgba(255,92,58,0.15)` : "none",
            }}>
              {p.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: G.accent, color: "#fff", padding: "3px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>⭐ Most Popular</div>}
              <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: G.dim, marginBottom: 16 }}>{p.limit}</div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 42, fontWeight: 700, color: p.color }}>${p.price}</span>
                <span style={{ color: G.muted, fontSize: 14 }}>/{p.period}</span>
              </div>
              <div style={{ marginBottom: 24 }}>
                {p.features.map(f => (
                  <div key={f} style={{ fontSize: 13.5, color: G.muted, padding: "6px 0", borderBottom: `1px solid ${G.border}`, display: "flex", gap: 8, alignItems: "center", textAlign: "left" }}>
                    <span style={{ color: G.teal }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <Btn variant={p.popular ? "primary" : "ghost"} size="md" full onClick={onStart}>Get Started →</Btn>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   SCREEN 2 — SIGN UP
══════════════════════════════════════════════ */
const SignUp = ({ onNext, data, setData }) => {
  const [err, setErr] = useState({});
  const validate = () => {
    const e = {};
    if (!data.name?.trim()) e.name = "Full name is required";
    if (!data.email?.trim() || !data.email.includes("@")) e.email = "Valid email required";
    if (!data.password || data.password.length < 6) e.password = "Minimum 6 characters";
    setErr(e);
    return Object.keys(e).length === 0;
  };
  return (
    <AuthShell step={0} title="Create your account" subtitle="Start automating your Instagram & Facebook replies today">
      <Inp label="Full Name" placeholder="Your name" value={data.name || ""} onChange={v => setData(d => ({ ...d, name: v }))} icon="👤" error={err.name} />
      <Inp label="Email Address" placeholder="you@email.com" value={data.email || ""} onChange={v => setData(d => ({ ...d, email: v }))} icon="✉" error={err.email} />
      <Inp label="Password" type="password" placeholder="Min 6 characters" value={data.password || ""} onChange={v => setData(d => ({ ...d, password: v }))} icon="🔒" error={err.password} />
      <Btn variant="primary" size="lg" full onClick={() => validate() && onNext()}>Continue →</Btn>
      <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: G.dim }}>
        By continuing you agree to our <span style={{ color: G.accent, cursor: "pointer" }}>Terms</span> & <span style={{ color: G.accent, cursor: "pointer" }}>Privacy Policy</span>
      </div>
    </AuthShell>
  );
};

/* ══════════════════════════════════════════════
   SCREEN 3 — CONNECT PLATFORM
══════════════════════════════════════════════ */
const ConnectPlatform = ({ onNext, data, setData }) => {
  const [platform, setPlatform] = useState(data.platform || "instagram");
  const [username, setUsername] = useState(data.username || "");
  const [page, setPage] = useState(data.page || "");
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [err, setErr] = useState("");

  const handleVerify = () => {
    if (!username.trim()) { setErr("Please enter your username"); return; }
    setErr(""); setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setVerified(true);
      setData(d => ({ ...d, platform, username, page }));
    }, 1800);
  };

  return (
    <AuthShell step={1} title="Connect your account" subtitle="Link your Instagram or Facebook to enable auto-replies">
      {/* Platform Select */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { id: "instagram", label: "Instagram", icon: "📸", color: G.ig },
          { id: "facebook", label: "Facebook", icon: "👥", color: G.fb },
        ].map(p => (
          <div key={p.id} onClick={() => { setPlatform(p.id); setVerified(false); }}
            style={{
              padding: "14px 16px", borderRadius: 14, cursor: "pointer", textAlign: "center",
              border: `2px solid ${platform === p.id ? p.color : G.border}`,
              background: platform === p.id ? p.color + "15" : G.s1,
              transition: "all 0.2s",
            }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>{p.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: platform === p.id ? p.color : G.muted }}>{p.label}</div>
          </div>
        ))}
      </div>

      {platform === "instagram" ? (
        <>
          <Inp label="Instagram Username" placeholder="yourhandle" prefix="@" value={username} onChange={setUsername} error={err} />
          <Inp label="Business/Creator Account Email" placeholder="linked email" value={page} onChange={setPage} icon="✉" hint="Used to verify your account ownership" />
        </>
      ) : (
        <>
          <Inp label="Facebook Page Name" placeholder="Your Page Name" value={page} onChange={setPage} icon="👥" />
          <Inp label="Facebook Profile Username" placeholder="yourprofile" prefix="fb.com/" value={username} onChange={setUsername} error={err} />
        </>
      )}

      {!verified ? (
        <Btn variant="ghost" size="lg" full onClick={handleVerify} loading={checking}>
          {checking ? "Verifying..." : "🔗 Verify Account"}
        </Btn>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: "rgba(0,212,170,0.08)", border: "1.5px solid rgba(0,212,170,0.3)", borderRadius: 12, marginBottom: 14 }}>
            <span className="check-pop" style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: G.teal }}>Account verified!</div>
              <div style={{ fontSize: 12, color: G.dim }}>@{username} is ready to connect</div>
            </div>
          </div>
          <Btn variant="primary" size="lg" full onClick={onNext}>Continue →</Btn>
        </div>
      )}
    </AuthShell>
  );
};

/* ══════════════════════════════════════════════
   SCREEN 4 — CHOOSE PLAN
══════════════════════════════════════════════ */
const ChoosePlan = ({ onNext, data, setData }) => {
  const [selected, setSelected] = useState(data.plan || "pro");
  const [paying, setPaying] = useState(false);
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [processing, setProcessing] = useState(false);
  const plan = PLANS.find(p => p.id === selected);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => { setData(d => ({ ...d, plan: selected })); setProcessing(false); onNext(); }, 2200);
  };

  return (
    <AuthShell step={2} title="Choose your plan" subtitle="Upgrade anytime. Cancel anytime.">
      {/* Plan cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {PLANS.map(p => (
          <div key={p.id} onClick={() => setSelected(p.id)} style={{
            padding: "14px 16px", borderRadius: 14, cursor: "pointer",
            border: `2px solid ${selected === p.id ? p.color : G.border}`,
            background: selected === p.id ? p.color + "10" : G.s1,
            transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${selected === p.id ? p.color : G.dim}`,
                background: selected === p.id ? p.color : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {selected === p.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {p.name} {p.popular && <Badge color="orange">Popular</Badge>}
                </div>
                <div style={{ fontSize: 12, color: G.dim }}>{p.limit}</div>
              </div>
            </div>
            <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 18, color: p.color }}>
              ${p.price}<span style={{ fontSize: 12, fontWeight: 400, color: G.muted }}>/mo</span>
            </div>
          </div>
        ))}
      </div>

      {!paying ? (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: G.s1, border: `1px solid ${G.border}`, borderRadius: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 14 }}>7-day free trial included</div>
            <Badge color="teal">✓ No charge today</Badge>
          </div>
          <Btn variant="primary" size="lg" full onClick={() => setPaying(true)}>
            Continue to Payment →
          </Btn>
        </>
      ) : (
        <div style={{ background: G.s1, border: `1px solid ${G.border}`, borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 13, color: G.muted, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            🔒 Secure payment · 256-bit SSL encrypted
          </div>
          <Inp label="Name on Card" placeholder="Your Full Name" value={cardName} onChange={setCardName} />
          <Inp label="Card Number" placeholder="1234 5678 9012 3456" value={cardNum}
            onChange={v => setCardNum(v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Inp label="Expiry" placeholder="MM / YY" value={expiry} onChange={v => setExpiry(v.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d)/, "$1 / $2"))} />
            <Inp label="CVV" placeholder="•••" value={cvv} onChange={v => setCvv(v.replace(/\D/g, "").slice(0, 3))} />
          </div>
          <div style={{ padding: "10px 14px", background: `${plan.color}10`, border: `1px solid ${plan.color}30`, borderRadius: 10, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: G.muted }}>{plan.name} Plan · {plan.limit}</span>
            <span style={{ fontWeight: 700, color: plan.color }}>${plan.price}/mo</span>
          </div>
          <Btn variant="primary" size="lg" full onClick={handlePay} loading={processing}>
            {processing ? "Processing..." : `🔒 Subscribe — $${plan.price}/mo`}
          </Btn>
        </div>
      )}
    </AuthShell>
  );
};

/* ══════════════════════════════════════════════
   SCREEN 5 — KEYWORD SETUP
══════════════════════════════════════════════ */
const KeywordSetup = ({ onNext, data, setData }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rules, setRules] = useState([]);
  const [customForm, setCustomForm] = useState({ keyword: "", reply: "", matchType: "contains" });
  const [adding, setAdding] = useState(false);

  const applyTemplate = (tmpl) => {
    setSelectedTemplate(tmpl.id);
    setRules(tmpl.rules.map((r, i) => ({ ...r, id: i + 1, active: true })));
  };

  const addCustom = () => {
    if (!customForm.keyword.trim() || !customForm.reply.trim()) return;
    setRules(rs => [...rs, { ...customForm, id: Date.now(), active: true }]);
    setCustomForm({ keyword: "", reply: "", matchType: "contains" });
    setAdding(false);
  };

  const removeRule = id => setRules(rs => rs.filter(r => r.id !== id));

  const handleFinish = () => {
    setData(d => ({ ...d, rules }));
    onNext();
  };

  return (
    <AuthShell step={3} title="Set up your auto-replies" subtitle="Choose a template or build your own keyword rules" wide>
      {!selectedTemplate ? (
        <>
          <div style={{ fontSize: 13, color: G.muted, marginBottom: 14 }}>Choose a starting template:</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => applyTemplate(t)} style={{
                padding: "16px", borderRadius: 14, cursor: "pointer",
                border: `1.5px solid ${G.border}`, background: G.s1,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = G.accent; e.currentTarget.style.background = "rgba(255,92,58,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.background = G.s1; }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{t.label.split(" ")[0]}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t.label.slice(3)}</div>
                <div style={{ fontSize: 12, color: G.muted }}>{t.desc}</div>
                {t.rules.length > 0 && <div style={{ fontSize: 11, color: G.teal, marginTop: 6 }}>✓ {t.rules.length} rules included</div>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {TEMPLATES.find(t => t.id === selectedTemplate)?.label} — {rules.length} rules
            </div>
            <button onClick={() => { setSelectedTemplate(null); setRules([]); }} style={{ fontSize: 12, color: G.muted, background: "none", border: "none", cursor: "pointer" }}>
              ← Change template
            </button>
          </div>

          {/* Rules list */}
          <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 14 }}>
            {rules.map(r => (
              <div key={r.id} style={{ background: G.s1, border: `1px solid ${G.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <Badge color="orange">"{r.keyword}"</Badge>
                      <span style={{ fontSize: 11, color: G.dim, background: G.card, padding: "2px 8px", borderRadius: 6 }}>{r.matchType}</span>
                    </div>
                    <div style={{ fontSize: 13, color: G.muted, lineHeight: 1.5, paddingLeft: 4, borderLeft: `2px solid ${G.accent}`, paddingLeft: 8 }}>{r.reply}</div>
                  </div>
                  <button onClick={() => removeRule(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: G.dim, fontSize: 16, flexShrink: 0 }}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Add custom rule */}
          {adding ? (
            <div style={{ background: G.s1, border: `1.5px solid ${G.accent}40`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <Inp label="Keyword" placeholder="e.g. price" value={customForm.keyword} onChange={v => setCustomForm(f => ({ ...f, keyword: v }))} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: G.muted, marginBottom: 7 }}>Match Type</div>
                  <select value={customForm.matchType} onChange={e => setCustomForm(f => ({ ...f, matchType: e.target.value }))} style={{ width: "100%", background: G.bg, border: `1.5px solid ${G.border}`, borderRadius: 12, padding: "11px 14px", color: G.text, fontSize: 14, outline: "none" }}>
                    <option value="contains">Contains</option>
                    <option value="exact">Exact Match</option>
                    <option value="startsWith">Starts With</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: G.muted, marginBottom: 7 }}>Auto-Reply Message</div>
                <textarea value={customForm.reply} onChange={e => setCustomForm(f => ({ ...f, reply: e.target.value }))} placeholder="Write the reply message..." style={{ width: "100%", background: G.bg, border: `1.5px solid ${G.border}`, borderRadius: 12, padding: "11px 14px", color: G.text, fontSize: 14, outline: "none", resize: "vertical", minHeight: 70 }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="teal" size="sm" onClick={addCustom}>✓ Add Rule</Btn>
                <Btn variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{ width: "100%", padding: "11px", border: `1.5px dashed ${G.border}`, borderRadius: 12, background: "none", color: G.muted, cursor: "pointer", fontSize: 14, marginBottom: 14, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = G.accent; e.currentTarget.style.color = G.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.muted; }}>
              + Add Custom Rule
            </button>
          )}

          <Btn variant="primary" size="lg" full onClick={handleFinish} disabled={rules.length === 0}>
            Launch My AutoReply Setup →
          </Btn>
        </>
      )}
    </AuthShell>
  );
};

/* ═══ AuthShell wrapper ═══ */
const AuthShell = ({ step, title, subtitle, children, wide = false }) => (
  <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px" }}>
    <div style={{ width: "100%", maxWidth: wide ? 640 : 440 }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 24, marginBottom: 20 }}>
          <span style={{ color: G.accent }}>Reply</span><span style={{ color: G.teal }}>AI</span>
        </div>
        <StepDots total={5} current={step} />
        <h2 className="fu" style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 26, marginBottom: 8 }}>{title}</h2>
        <p className="fu d1" style={{ fontSize: 14, color: G.muted }}>{subtitle}</p>
      </div>
      <div className="fu d2" style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 20, padding: 28 }}>
        {children}
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════
   SCREEN 6 — SUCCESS + DASHBOARD
══════════════════════════════════════════════ */
const Dashboard = ({ data }) => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [rules, setRules] = useState(
    (data.rules || []).map((r, i) => ({ ...r, triggerCount: Math.floor(Math.random() * 80) + 5 }))
  );
  const [showAddRule, setShowAddRule] = useState(false);
  const [form, setForm] = useState({ keyword: "", matchType: "contains", reply: "", active: true });
  const [editId, setEditId] = useState(null);
  const [filterPlat, setFilterPlat] = useState("all");
  const [simIdx, setSimIdx] = useState(0);
  const [simRunning, setSimRunning] = useState(false);

  const totalReplies = rules.reduce((a, r) => a + r.triggerCount, 0);
  const activeRules = rules.filter(r => r.active).length;
  const planInfo = PLANS.find(p => p.id === data.plan) || PLANS[1];

  useEffect(() => {
    let t;
    if (simRunning && simIdx < SIM_MSGS.length) t = setTimeout(() => setSimIdx(i => i + 1), 1300);
    else if (simRunning) setSimRunning(false);
    return () => clearTimeout(t);
  }, [simRunning, simIdx]);

  const toggleRule = id => setRules(rs => rs.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const deleteRule = id => setRules(rs => rs.filter(r => r.id !== id));
  const saveRule = () => {
    if (!form.keyword.trim() || !form.reply.trim()) return;
    if (editId) { setRules(rs => rs.map(r => r.id === editId ? { ...r, ...form } : r)); setEditId(null); }
    else setRules(rs => [...rs, { ...form, id: Date.now(), active: true, triggerCount: 0 }]);
    setForm({ keyword: "", matchType: "contains", reply: "", active: true });
    setShowAddRule(false);
  };

  const navItems = [
    { id: "dashboard", icon: "⬡", label: "Dashboard" },
    { id: "rules", icon: "◈", label: "Keyword Rules" },
    { id: "simulate", icon: "◎", label: "Simulator" },
    { id: "analytics", icon: "◇", label: "Analytics" },
    { id: "settings", icon: "◉", label: "Settings" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: G.bg }}>
      {/* SIDEBAR */}
      <div style={{ width: 230, background: G.s1, borderRight: `1px solid ${G.border}`, display: "flex", flexDirection: "column", padding: "22px 14px", gap: 3, flexShrink: 0 }}>
        <div style={{ padding: "0 6px 22px" }}>
          <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 22 }}>
            <span style={{ color: G.accent }}>Reply</span><span style={{ color: G.teal }}>AI</span>
          </div>
          <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>Social Automation</div>
        </div>

        {navItems.map(n => (
          <div key={n.id} onClick={() => setActiveNav(n.id)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
            cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all 0.2s",
            color: activeNav === n.id ? G.text : G.muted,
            background: activeNav === n.id ? `linear-gradient(135deg, rgba(255,92,58,0.15), rgba(0,212,170,0.08))` : "transparent",
            border: `1px solid ${activeNav === n.id ? "rgba(255,92,58,0.35)" : "transparent"}`,
          }}>
            <span style={{ fontSize: 15 }}>{n.icon}</span>{n.label}
          </div>
        ))}

        <div style={{ marginTop: "auto" }}>
          <div style={{ padding: "14px", background: `${planInfo.color}12`, borderRadius: 12, border: `1px solid ${planInfo.color}30`, marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: planInfo.color, fontWeight: 700, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>★ {planInfo.name} Plan</div>
            <div style={{ fontSize: 12, color: G.muted, marginBottom: 7 }}>{rules.length} of {planInfo.id === "starter" ? 5 : planInfo.id === "pro" ? 20 : "∞"} rules</div>
            <div style={{ background: G.border, borderRadius: 4, height: 4 }}>
              <div style={{ width: `${Math.min((rules.length / (planInfo.id === "starter" ? 5 : 20)) * 100, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${planInfo.color}, ${G.teal})`, borderRadius: 4 }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: G.s2 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${G.accent}, ${G.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
              {data.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{data.name || "User"}</div>
              <div style={{ fontSize: 11, color: G.muted }}>@{data.username || "account"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 30px" }}>

        {/* ─── DASHBOARD ─── */}
        {activeNav === "dashboard" && (
          <div className="fu">
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 26 }}>Good day, {data.name?.split(" ")[0] || "there"}! 👋</h1>
              <p style={{ color: G.muted, fontSize: 14, marginTop: 4 }}>Your AutoReply is live and working 24/7</p>
            </div>

            {/* Live platform badges */}
            <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 20, background: `${G.ig}15`, border: `1px solid ${G.ig}40`, fontSize: 13, color: G.ig, fontWeight: 600 }}>
                📸 Instagram <span style={{ color: G.teal, fontSize: 11 }}>● Live</span>
              </div>
              {data.platform === "facebook" || data.plan !== "starter" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 20, background: `${G.fb}15`, border: `1px solid ${G.fb}40`, fontSize: 13, color: G.blue, fontWeight: 600 }}>
                  👥 Facebook <span style={{ color: G.teal, fontSize: 11 }}>● Live</span>
                </div>
              ) : null}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
              {[
                { label: "Total Replies", value: totalReplies, color: G.accent, icon: "↩" },
                { label: "Active Rules", value: `${activeRules}/${rules.length}`, color: G.teal, icon: "◈" },
                { label: "Avg Response", value: "< 1s", color: G.blue, icon: "⚡" },
                { label: "Plan", value: planInfo.name, color: planInfo.color, icon: "★" },
              ].map(s => (
                <div key={s.label} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 18, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Clash Display',sans-serif", fontSize: 26, fontWeight: 700 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: G.muted, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Live Activity Feed</div>
              {rules.slice(0, 5).map((r, i) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 4 ? `1px solid ${G.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${G.accent}, ${G.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                      {String.fromCharCode(65 + (i * 3) % 26)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>Keyword: <span style={{ color: G.a2 }}>"{r.keyword}"</span> triggered</div>
                      <div style={{ fontSize: 12, color: G.muted }}>{[2, 7, 14, 23, 38][i]}m ago</div>
                    </div>
                  </div>
                  <Badge color="teal">✓ {r.triggerCount} replies</Badge>
                </div>
              ))}
              {rules.length === 0 && <div style={{ color: G.muted, fontSize: 14, textAlign: "center", padding: 20 }}>No rules yet — add some to see activity!</div>}
            </div>
          </div>
        )}

        {/* ─── KEYWORD RULES ─── */}
        {activeNav === "rules" && (
          <div className="fu">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
              <div>
                <h1 style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 26 }}>Keyword Rules</h1>
                <p style={{ color: G.muted, fontSize: 14, marginTop: 3 }}>Auto-reply when keywords are detected</p>
              </div>
              <Btn variant="primary" onClick={() => { setEditId(null); setForm({ keyword: "", matchType: "contains", reply: "", active: true }); setShowAddRule(true); }}>
                ⚡ New Rule
              </Btn>
            </div>

            {showAddRule && (
              <div className="fu" style={{ background: G.card, border: `1.5px solid ${G.accent}50`, borderRadius: 16, padding: 20, marginBottom: 18 }}>
                <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
                  {editId ? "✎ Edit Rule" : "⚡ New Keyword Rule"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                  <Inp label="Keyword / Phrase" placeholder="e.g. price" value={form.keyword} onChange={v => setForm(f => ({ ...f, keyword: v }))} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: G.muted, marginBottom: 7 }}>Match Type</div>
                    <select value={form.matchType} onChange={e => setForm(f => ({ ...f, matchType: e.target.value }))} style={{ width: "100%", background: G.s1, border: `1.5px solid ${G.border}`, borderRadius: 12, padding: "11px 14px", color: G.text, fontSize: 14, outline: "none" }}>
                      <option value="contains">Contains</option>
                      <option value="exact">Exact Match</option>
                      <option value="startsWith">Starts With</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: G.muted, marginBottom: 7 }}>Auto-Reply Message</div>
                  <textarea value={form.reply} onChange={e => setForm(f => ({ ...f, reply: e.target.value }))} placeholder="Type the reply that will be sent..." style={{ width: "100%", background: G.s1, border: `1.5px solid ${G.border}`, borderRadius: 12, padding: "11px 14px", color: G.text, fontSize: 14, outline: "none", resize: "vertical", minHeight: 80 }} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="primary" onClick={saveRule}>{editId ? "✓ Save" : "⚡ Add Rule"}</Btn>
                  <Btn variant="ghost" onClick={() => { setShowAddRule(false); setEditId(null); }}>Cancel</Btn>
                </div>
              </div>
            )}

            {rules.map(r => (
              <div key={r.id} style={{ background: G.s1, border: `1px solid ${G.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10, transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = G.accent + "50"}
                onMouseLeave={e => e.currentTarget.style.borderColor = G.border}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
                      <Badge color="orange">"{r.keyword}"</Badge>
                      <span style={{ fontSize: 12, color: G.dim, background: G.card, padding: "2px 8px", borderRadius: 6, border: `1px solid ${G.border}` }}>{r.matchType}</span>
                      <Badge color="teal">↩ {r.triggerCount} replies</Badge>
                    </div>
                    <div style={{ fontSize: 13.5, color: G.muted, lineHeight: 1.5, paddingLeft: 10, borderLeft: `2px solid ${G.accent}` }}>{r.reply}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <Toggle on={r.active} onToggle={() => toggleRule(r.id)} />
                    <Btn variant="ghost" size="sm" onClick={() => { setForm({ keyword: r.keyword, matchType: r.matchType, reply: r.reply, active: r.active }); setEditId(r.id); setShowAddRule(true); }}>✎</Btn>
                    <Btn variant="danger" size="sm" onClick={() => deleteRule(r.id)}>✕</Btn>
                  </div>
                </div>
              </div>
            ))}

            {rules.length === 0 && (
              <div style={{ textAlign: "center", padding: 50, color: G.muted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
                <div style={{ fontSize: 15, marginBottom: 8 }}>No rules yet</div>
                <div style={{ fontSize: 13 }}>Create your first keyword rule to start auto-replying</div>
              </div>
            )}
          </div>
        )}

        {/* ─── SIMULATOR ─── */}
        {activeNav === "simulate" && (
          <div className="fu">
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 26 }}>Live Simulator</h1>
              <p style={{ color: G.muted, fontSize: 14, marginTop: 3 }}>Preview how your auto-replies will appear</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18 }}>
              <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 18, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "12px 18px", borderBottom: `1px solid ${G.border}`, background: G.s1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${G.ig}, #a855f7)` }} />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>@{data.username || "yourbrand"}</div>
                    <Badge color="teal">● Live</Badge>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    {["#ef4444", "#f59e0b", "#10b981"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                  </div>
                </div>
                {/* Convo */}
                <div style={{ padding: "18px 18px 10px", minHeight: 300, maxHeight: 320, overflowY: "auto" }}>
                  {SIM_MSGS.slice(0, simIdx).map((msg, i) => (
                    <div key={i} style={{ display: "flex", gap: 9, marginBottom: 14, flexDirection: msg.type === "bot" ? "row-reverse" : "row", animation: "fadeUp 0.4s ease" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: msg.type === "bot" ? `linear-gradient(135deg,${G.accent},${G.teal})` : G.s2, border: `1px solid ${G.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {msg.type === "bot" ? "⚡" : msg.avatar}
                      </div>
                      <div style={{ maxWidth: "72%" }}>
                        <div style={{ fontSize: 11, color: G.dim, marginBottom: 3, textAlign: msg.type === "bot" ? "right" : "left" }}>
                          {msg.type === "bot" ? "🤖 AutoReply" : `@${msg.name}`}
                        </div>
                        <div style={{
                          padding: "9px 13px", borderRadius: msg.type === "bot" ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                          background: msg.type === "bot" ? `linear-gradient(135deg,rgba(255,92,58,0.2),rgba(0,212,170,0.1))` : G.s2,
                          border: `1px solid ${msg.type === "bot" ? "rgba(255,92,58,0.3)" : G.border}`,
                          fontSize: 13.5, lineHeight: 1.5,
                        }}>{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Controls */}
                <div style={{ padding: "12px 18px", borderTop: `1px solid ${G.border}`, display: "flex", gap: 10 }}>
                  <Btn variant="primary" onClick={() => { setSimIdx(0); setSimRunning(true); }} disabled={simRunning}>
                    {simRunning ? "⏳ Running..." : "▶ Run Simulation"}
                  </Btn>
                  <Btn variant="ghost" onClick={() => { setSimIdx(0); setSimRunning(false); }}>↺ Reset</Btn>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 18 }}>
                  <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>⚡ How It Works</div>
                  {["User comments/DMs", "AI scans for keyword", "Matching rule fires", "Reply sent in < 1s"].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: `linear-gradient(135deg,${G.accent},${G.teal})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontSize: 12.5, color: G.muted }}>{s}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 18 }}>
                  <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Active Keywords</div>
                  {rules.filter(r => r.active).slice(0, 5).map(r => (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <span style={{ color: G.teal, fontSize: 10 }}>●</span>
                      <Badge color="orange">"{r.keyword}"</Badge>
                    </div>
                  ))}
                  {rules.filter(r => r.active).length === 0 && <div style={{ fontSize: 12, color: G.dim }}>No active rules</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ANALYTICS ─── */}
        {activeNav === "analytics" && (
          <div className="fu">
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 26 }}>Analytics</h1>
              <p style={{ color: G.muted, fontSize: 14, marginTop: 3 }}>Track your auto-reply performance</p>
            </div>
            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 20, marginBottom: 18 }}>
              <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Reply Volume — Last 7 Days</div>
              <div style={{ height: 130, display: "flex", alignItems: "flex-end", gap: 8 }}>
                {[22, 45, 38, 71, 58, 83, 96].map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ height: `${v}%`, width: "100%", borderRadius: "6px 6px 0 0", background: `linear-gradient(180deg, ${G.accent}, ${G.teal}60)` }} />
                    <div style={{ fontSize: 11, color: G.muted }}>{"MTWTFSS"[i]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 20 }}>
              <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Rule Performance</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 70px" }}>
                {["Keyword", "Triggers", "Replies", "Status"].map(h => (
                  <div key={h} style={{ fontSize: 12, color: G.muted, fontWeight: 600, padding: "7px 0", borderBottom: `1px solid ${G.border}`, textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</div>
                ))}
                {rules.map(r => (<>
                  <div key={r.id + "k"} style={{ padding: "12px 0", borderBottom: `1px solid ${G.border}` }}><Badge color="orange">"{r.keyword}"</Badge></div>
                  <div key={r.id + "t"} style={{ padding: "12px 0", borderBottom: `1px solid ${G.border}`, fontFamily: "'Clash Display',sans-serif", fontWeight: 700 }}>{r.triggerCount}</div>
                  <div key={r.id + "r"} style={{ padding: "12px 0", borderBottom: `1px solid ${G.border}`, fontFamily: "'Clash Display',sans-serif", fontWeight: 700, color: G.teal }}>{r.triggerCount}</div>
                  <div key={r.id + "s"} style={{ padding: "12px 0", borderBottom: `1px solid ${G.border}` }}><Badge color={r.active ? "teal" : "red"}>{r.active ? "On" : "Off"}</Badge></div>
                </>))}
              </div>
            </div>
          </div>
        )}

        {/* ─── SETTINGS ─── */}
        {activeNav === "settings" && (
          <div className="fu">
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 26 }}>Settings</h1>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Connected Account</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: G.s1, borderRadius: 12, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${G.ig}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📸</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>@{data.username || "yourhandle"}</div>
                    <div style={{ fontSize: 12, color: G.teal }}>● Connected · Instagram</div>
                  </div>
                </div>
                <Btn variant="ghost" size="sm">+ Add Another Account</Btn>
              </div>

              <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 20 }}>
                <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Automation Settings</div>
                {[
                  { label: "Reply to Comments", on: true },
                  { label: "Reply to DMs", on: true },
                  { label: "AI Smart Suggestions", on: true },
                  { label: "Spam Detection", on: true },
                  { label: "Daily Email Report", on: false },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${G.border}` }}>
                    <span style={{ fontSize: 14 }}>{s.label}</span>
                    <Toggle on={s.on} onToggle={() => { }} />
                  </div>
                ))}
              </div>

              <div style={{ gridColumn: "span 2", background: `linear-gradient(135deg, rgba(255,92,58,0.1), rgba(0,212,170,0.06))`, border: `1.5px solid ${G.accent}40`, borderRadius: 16, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
                      ★ {planInfo.name} Plan <Badge color="teal">Active</Badge>
                    </div>
                    <div style={{ color: G.muted, fontSize: 13, marginBottom: 10 }}>${planInfo.price}/month · Renews in 30 days</div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {planInfo.features.map(f => <div key={f} style={{ fontSize: 13, color: G.teal }}>✓ {f}</div>)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Btn variant="ghost">Manage Billing</Btn>
                    <Btn variant="primary">↑ Upgrade</Btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const SIM_MSGS = [
  { type: "user", text: "What's the price for this?", avatar: "A", name: "alex.ig" },
  { type: "bot", text: "Hi! 👋 Our prices start from just $19. Check our website for full pricing or DM us for a custom quote!", name: "AutoReply" },
  { type: "user", text: "Do you offer free shipping?", avatar: "M", name: "mia_style" },
  { type: "bot", text: "We ship worldwide! 🚀 Standard: 3-5 days. Express: 1-2 days. Free shipping on orders $50+!", name: "AutoReply" },
  { type: "user", text: "Is there a discount code?", avatar: "J", name: "john99" },
  { type: "bot", text: "Great news! 🎁 Use code SAVE20 for 20% off. Valid this week only. Shop now!", name: "AutoReply" },
];

/* ══════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState("landing"); // landing, signup, connect, plan, keywords, dashboard
  const [userData, setUserData] = useState({});

  useEffect(() => { injectCSS(); }, []);

  const screens = {
    landing: <Landing onStart={() => setScreen("signup")} />,
    signup: <SignUp onNext={() => setScreen("connect")} data={userData} setData={setUserData} />,
    connect: <ConnectPlatform onNext={() => setScreen("plan")} data={userData} setData={setUserData} />,
    plan: <ChoosePlan onNext={() => setScreen("keywords")} data={userData} setData={setUserData} />,
    keywords: <KeywordSetup onNext={() => setScreen("dashboard")} data={userData} setData={setUserData} />,
    dashboard: <Dashboard data={userData} />,
  };

  return screens[screen] || screens.landing;
}

