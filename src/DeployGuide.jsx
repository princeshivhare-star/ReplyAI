import { useState } from "react";

const G = {
  bg:"#07080f", s1:"#0d0f1c", s2:"#131525", card:"#181a2e",
  border:"#1f2240", b2:"#2a2d52",
  green:"#22c55e", teal:"#06b6d4", accent:"#f97316",
  blue:"#3b82f6", violet:"#a78bfa", gold:"#fbbf24",
  ig:"#e1306c", text:"#eef0ff", muted:"#6366a0", dim:"#2e3260",
};

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap');`;

/* ─── tiny helpers ─── */
const Tag = ({ c="#06b6d4", children }) => (
  <span style={{ display:"inline-flex",alignItems:"center",gap:3, padding:"2px 9px", borderRadius:20, fontSize:11.5, fontWeight:700, background:c+"18", color:c, border:`1px solid ${c}30` }}>{children}</span>
);

const Code = ({ children, inline=false }) => (
  <code style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:inline?12.5:13, background:G.s1, border:`1px solid ${G.border}`, borderRadius:inline?5:8, padding:inline?"2px 7px":"12px 16px", color:"#7dd3fc", display:inline?"inline":"block", lineHeight:1.8, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
    {children}
  </code>
);

const CopyCode = ({ code, label="" }) => {
  const [done, setDone] = useState(false);
  return (
    <div style={{ position:"relative", marginBottom:12 }}>
      {label && <div style={{ fontSize:11, color:G.muted, fontFamily:"'JetBrains Mono',monospace", marginBottom:5 }}>{label}</div>}
      <Code>{code}</Code>
      <button onClick={() => { navigator.clipboard?.writeText(code); setDone(true); setTimeout(()=>setDone(false),2000); }}
        style={{ position:"absolute", top:10, right:10, padding:"3px 10px", borderRadius:6, border:`1px solid ${G.border}`, background:G.s2, color:done?G.green:G.muted, fontSize:11.5, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all .15s" }}>
        {done?"✓ Copied":"Copy"}
      </button>
    </div>
  );
};

const Alert = ({ icon="💡", color=G.teal, children }) => (
  <div style={{ padding:"11px 14px", background:color+"10", border:`1px solid ${color}30`, borderRadius:10, fontSize:13, color:G.muted, lineHeight:1.6, marginBottom:12, display:"flex", gap:9, alignItems:"flex-start" }}>
    <span style={{flexShrink:0}}>{icon}</span><div>{children}</div>
  </div>
);

/* ─── Step wrapper ─── */
const Step = ({ n, title, tag, done, active, children, onClick }) => (
  <div onClick={onClick} style={{ cursor:"pointer", marginBottom:6 }}>
    {/* Header row */}
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", background:active?G.card:G.s1, border:`1.5px solid ${active?G.b2:G.border}`, borderRadius:active?"14px 14px 0 0":14, transition:"all .2s" }}>
      <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, background:done?G.green:active?G.accent:G.dim, color:done||active?"#fff":G.muted, transition:"all .2s" }}>
        {done?"✓":n}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:15, fontWeight:700, color:active||done?G.text:G.muted }}>{title}</div>
      </div>
      {tag && <Tag c={done?G.green:active?G.accent:G.muted}>{tag}</Tag>}
      <span style={{ color:G.muted, fontSize:12 }}>{active?"▲":"▼"}</span>
    </div>
    {/* Body */}
    {active && (
      <div style={{ background:G.card, border:`1.5px solid ${G.b2}`, borderTop:"none", borderRadius:"0 0 14px 14px", padding:"20px 22px" }} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    )}
  </div>
);

/* ─── ENV row ─── */
const EnvRow = ({ name, desc, example, required=true }) => (
  <div style={{ padding:"10px 0", borderBottom:`1px solid ${G.border}`, display:"grid", gridTemplateColumns:"220px 1fr", gap:12, alignItems:"start" }}>
    <div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12.5, color:"#7dd3fc", marginBottom:3 }}>{name}</div>
      {required ? <Tag c={G.accent}>required</Tag> : <Tag c={G.muted}>optional</Tag>}
    </div>
    <div>
      <div style={{ fontSize:13, color:G.muted, marginBottom:4, lineHeight:1.5 }}>{desc}</div>
      {example && <Code inline>{example}</Code>}
    </div>
  </div>
);

export default function DeployGuide() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState({});
  const toggle = n => { setDone(d => ({ ...d, [n]: !d[n] })); };

  const go = n => setStep(step === n ? 0 : n);

  return (
    <div style={{ minHeight:"100vh", background:G.bg, fontFamily:"'Outfit',sans-serif", color:G.text }}>
      <style>{FONTS + `
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${G.border}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .4s ease both}
        a{color:${G.teal};text-decoration:none} a:hover{text-decoration:underline}
      `}</style>

      {/* Header */}
      <div style={{ background:G.s1, borderBottom:`1px solid ${G.border}`, padding:"0 28px", height:54, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, fontWeight:800 }}>
          <span style={{color:G.accent}}>Reply</span><span style={{color:G.teal}}>AI</span>
          <span style={{ fontSize:13, color:G.muted, fontWeight:400, marginLeft:10, fontFamily:"'Outfit',sans-serif" }}>Deployment Guide</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Tag c={G.green}>Vercel</Tag>
          <Tag c={G.ig}>Instagram</Tag>
          <Tag c={G.blue}>Meta API</Tag>
        </div>
      </div>

      <div style={{ maxWidth:820, margin:"0 auto", padding:"32px 24px" }}>

        {/* Intro */}
        <div className="fu" style={{ marginBottom:28, textAlign:"center" }}>
          <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, fontWeight:800, marginBottom:8 }}>
            Deploy to Vercel + Connect Instagram
          </div>
          <div style={{ color:G.muted, fontSize:15, lineHeight:1.6 }}>
            Follow these 7 steps to go live. Takes about <strong style={{color:G.text}}>15–20 minutes</strong>.
          </div>
          {/* Progress bar */}
          <div style={{ display:"flex", gap:4, justifyContent:"center", marginTop:20 }}>
            {[1,2,3,4,5,6,7].map(n => (
              <div key={n} onClick={() => go(n)} style={{ width:36, height:6, borderRadius:3, cursor:"pointer", background:done[n]?G.green:step===n?G.accent:G.border, transition:"all .2s" }} />
            ))}
          </div>
          <div style={{ fontSize:12, color:G.muted, marginTop:6 }}>{Object.keys(done).length} of 7 steps completed</div>
        </div>

        {/* ── STEP 1: GitHub ── */}
        <Step n={1} title="Push your code to GitHub" tag="5 min" done={done[1]} active={step===1} onClick={()=>go(1)}>
          <Alert icon="📁">Create a new GitHub repo and push all your ReplyAI files. Vercel deploys directly from GitHub.</Alert>

          <div style={{ fontSize:13, color:G.muted, marginBottom:10 }}>Run these commands in your project folder:</div>
          <CopyCode label="Terminal" code={`git init
git add .
git commit -m "Initial ReplyAI deploy"
git branch -M main

# Create repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/replyai.git
git push -u origin main`} />

          <Alert icon="💡" color={G.gold}>
            Make sure your project has this structure:<br/>
            <Code inline>api/webhook.js</Code> · <Code inline>api/rules.js</Code> · <Code inline>src/</Code> · <Code inline>vercel.json</Code> · <Code inline>package.json</Code>
          </Alert>

          <button onClick={()=>{ toggle(1); go(2); }} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:G.green, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif" }}>
            ✓ Done — Next Step →
          </button>
        </Step>

        {/* ── STEP 2: Vercel Deploy ── */}
        <Step n={2} title="Deploy to Vercel" tag="3 min" done={done[2]} active={step===2} onClick={()=>go(2)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { n:"1", text:'Go to vercel.com and click "Add New Project"' },
              { n:"2", text:"Import your GitHub repo (search replyai)" },
              { n:"3", text:'Framework: Vite. Click "Deploy"' },
            ].map(s => (
              <div key={s.n} style={{ padding:"14px", background:G.s2, border:`1px solid ${G.border}`, borderRadius:12, textAlign:"center" }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:G.accent, color:"#fff", fontSize:13, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px" }}>{s.n}</div>
                <div style={{ fontSize:13, color:G.muted, lineHeight:1.5 }}>{s.text}</div>
              </div>
            ))}
          </div>

          <Alert icon="🎉" color={G.green}>
            After deploy, Vercel gives you a live URL like <Code inline>https://replyai-xyz.vercel.app</Code><br/>
            <strong style={{color:G.text}}>Copy this URL</strong> — you'll need it in the next steps.
          </Alert>
          <Alert icon="⚠️" color={G.accent}>
            Don't add env variables yet — do that in Step 3 first, then redeploy.
          </Alert>

          <button onClick={()=>{ toggle(2); go(3); }} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:G.green, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif" }}>
            ✓ Deployed — Next Step →
          </button>
        </Step>

        {/* ── STEP 3: Meta App Setup ── */}
        <Step n={3} title="Configure your Meta App" tag="5 min" done={done[3]} active={step===3} onClick={()=>go(3)}>
          <Alert icon="🔗">Go to <strong style={{color:G.teal}}>developers.facebook.com</strong> → Your App → you should already have it set up.</Alert>

          <div style={{ fontSize:14, fontWeight:600, color:G.text, marginBottom:10, marginTop:4 }}>Add the Instagram product:</div>
          <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:16 }}>
            {[
              "App Dashboard → Add Product → find Instagram",
              'Click "Set Up" on Instagram Basic Display',
              "Go to Instagram → Basic Display → Create New App",
              'Add your Instagram test account under "Test Users"',
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:13.5, color:G.muted }}>
                <span style={{ color:G.teal, flexShrink:0, fontWeight:700 }}>{i+1}.</span> {s}
              </div>
            ))}
          </div>

          <div style={{ fontSize:14, fontWeight:600, color:G.text, marginBottom:10 }}>Get your Instagram Access Token:</div>
          <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
            {[
              "Instagram Basic Display → User Token Generator",
              "Click 'Generate Token' next to your Instagram account",
              "A popup opens — log in with Instagram and Allow",
              "Copy the token — it starts with IGQV... or EAA...",
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:13.5, color:G.muted }}>
                <span style={{ color:G.ig, flexShrink:0, fontWeight:700 }}>{i+1}.</span> {s}
              </div>
            ))}
          </div>

          <Alert icon="📝" color={G.violet}>
            Also note your <strong style={{color:G.text}}>App ID</strong> and <strong style={{color:G.text}}>App Secret</strong> from App Dashboard → Settings → Basic.
            And your <strong style={{color:G.text}}>Instagram Account ID</strong> (numeric) — find it at <Code inline>graph.facebook.com/me?fields=id&access_token=YOUR_TOKEN</Code>
          </Alert>

          <button onClick={()=>{ toggle(3); go(4); }} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:G.green, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif" }}>
            ✓ Got my tokens — Next Step →
          </button>
        </Step>

        {/* ── STEP 4: Environment Variables ── */}
        <Step n={4} title="Add Environment Variables in Vercel" tag="3 min" done={done[4]} active={step===4} onClick={()=>go(4)}>
          <Alert icon="🔑">Go to <strong style={{color:G.text}}>Vercel Dashboard → Your Project → Settings → Environment Variables</strong> and add each of these:</Alert>

          <div style={{ marginBottom:14 }}>
            <EnvRow name="WEBHOOK_VERIFY_TOKEN"      desc="A random secret string you make up yourself. You'll paste this into Meta's webhook form." example="replyai_secret_abc123xyz" />
            <EnvRow name="META_APP_SECRET"           desc="Your Meta App Secret (from App Dashboard → Settings → Basic)" example="a1b2c3d4e5f6..." />
            <EnvRow name="INSTAGRAM_ACCOUNT_ID"      desc="Your numeric Instagram Business/Creator Account ID" example="17841234567890" />
            <EnvRow name="INSTAGRAM_ACCESS_TOKEN"    desc="The long-lived Instagram access token from User Token Generator" example="IGQVJ..." />
            <EnvRow name="FACEBOOK_PAGE_ID"          desc="Your Facebook Page ID (optional, for FB comments)" example="123456789" required={false} />
            <EnvRow name="FACEBOOK_ACCESS_TOKEN"     desc="Facebook Page Access Token (optional)" example="EAA..." required={false} />
          </div>

          <Alert icon="🔄" color={G.gold}>
            After adding all variables, go to <strong style={{color:G.text}}>Deployments → Redeploy</strong> so the new env vars take effect.
          </Alert>

          <div style={{ fontSize:13, color:G.muted, marginBottom:10 }}>Verify env vars are working by opening:</div>
          <CopyCode code={`https://YOUR-VERCEL-URL.vercel.app/api/health`} />
          <div style={{ fontSize:13, color:G.muted, marginBottom:14 }}>You should see all the env booleans set to <Code inline>true</Code></div>

          <button onClick={()=>{ toggle(4); go(5); }} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:G.green, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif" }}>
            ✓ Variables added — Next Step →
          </button>
        </Step>

        {/* ── STEP 5: Register Webhook ── */}
        <Step n={5} title="Register Webhook with Meta" tag="5 min" done={done[5]} active={step===5} onClick={()=>go(5)}>
          <Alert icon="📡">Now you tell Meta: <em>"Send all Instagram events to my Vercel URL"</em></Alert>

          <div style={{ fontSize:14, fontWeight:600, color:G.text, marginBottom:10 }}>In Meta Developer Console:</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
            {[
              { step:"1", text:'Go to your Meta App → find "Webhooks" in the left sidebar' },
              { step:"2", text:'Click "Add Callback URL"' },
              { step:"3", text:'Callback URL — paste your Vercel webhook URL:', code:"https://YOUR-VERCEL-URL.vercel.app/webhook" },
              { step:"4", text:'Verify Token — paste your WEBHOOK_VERIFY_TOKEN exactly:', code:"replyai_secret_abc123xyz  (whatever you set in Vercel)" },
              { step:"5", text:'Click "Verify and Save" — Meta will call your URL to verify it ✓' },
              { step:"6", text:'Then click "Add Subscriptions" and check: comments, messages, mentions' },
            ].map(s => (
              <div key={s.step} style={{ padding:"12px 14px", background:G.s2, border:`1px solid ${G.border}`, borderRadius:10 }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", background:G.teal, color:G.bg, fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize:13.5, color:G.text, lineHeight:1.5 }}>{s.text}</div>
                    {s.code && <div style={{ marginTop:6 }}><Code>{s.code}</Code></div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Alert icon="✅" color={G.green}>
            If Meta says <strong style={{color:G.text}}>"Verified"</strong> — your webhook is live! If it fails, double-check your WEBHOOK_VERIFY_TOKEN matches exactly and you redeployed after adding env vars.
          </Alert>

          <button onClick={()=>{ toggle(5); go(6); }} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:G.green, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif" }}>
            ✓ Webhook verified — Next Step →
          </button>
        </Step>

        {/* ── STEP 6: Subscribe to Instagram Events ── */}
        <Step n={6} title="Subscribe to Instagram Webhooks" tag="2 min" done={done[6]} active={step===6} onClick={()=>go(6)}>
          <Alert icon="📸">Instagram webhooks need to be subscribed separately at the <strong style={{color:G.text}}>Instagram account level</strong>, not just the app level.</Alert>

          <div style={{ fontSize:14, fontWeight:600, color:G.text, marginBottom:10 }}>Subscribe via Graph API Explorer:</div>
          <div style={{ fontSize:13, color:G.muted, marginBottom:8 }}>Open the Graph API Explorer at <strong style={{color:G.teal}}>developers.facebook.com/tools/explorer</strong> and run this POST request:</div>

          <CopyCode label="Endpoint" code={`POST /YOUR_IG_ACCOUNT_ID/subscribed_apps`} />
          <CopyCode label="Parameters" code={`subscribed_fields=comments,messages,mentions`} />

          <div style={{ fontSize:13, color:G.muted, marginBottom:8, marginTop:4 }}>Or run it with curl:</div>
          <CopyCode code={`curl -X POST \\
  "https://graph.facebook.com/v19.0/YOUR_IG_ACCOUNT_ID/subscribed_apps" \\
  -d "subscribed_fields=comments,messages,mentions" \\
  -d "access_token=YOUR_INSTAGRAM_ACCESS_TOKEN"`} />

          <Alert icon="💡" color={G.gold}>
            Replace <Code inline>YOUR_IG_ACCOUNT_ID</Code> with your numeric Instagram account ID, and <Code inline>YOUR_INSTAGRAM_ACCESS_TOKEN</Code> with your token.
          </Alert>

          <div style={{ fontSize:13, color:G.muted, marginBottom:10 }}>Expected response:</div>
          <Code>{`{ "success": true }`}</Code>

          <button onClick={()=>{ toggle(6); go(7); }} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:G.green, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif", marginTop:14 }}>
            ✓ Subscribed — Last Step →
          </button>
        </Step>

        {/* ── STEP 7: Test it live ── */}
        <Step n={7} title="Test with your real Instagram account 🎉" tag="Live test" done={done[7]} active={step===7} onClick={()=>go(7)}>
          <Alert icon="🚀" color={G.green}>Everything is set up! Now let's fire a real test.</Alert>

          <div style={{ fontSize:14, fontWeight:600, color:G.text, marginBottom:12 }}>Test auto-reply on comments:</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:18 }}>
            {[
              { icon:"📸", text:'Open Instagram on your phone or browser' },
              { icon:"✍️", text:'Find any post on your connected Instagram account' },
              { icon:"💬", text:'Comment something like: "what\'s the price?" or "do you ship?"' },
              { icon:"⚡", text:'Within a few seconds, your account should auto-reply!' },
              { icon:"📊", text:'Check Vercel Logs: Dashboard → Your Project → Logs to see the event come in' },
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:G.s2, border:`1px solid ${G.border}`, borderRadius:10 }}>
                <span style={{fontSize:18}}>{s.icon}</span>
                <span style={{fontSize:13.5, color:G.muted}}>{s.text}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize:14, fontWeight:600, color:G.text, marginBottom:10 }}>Check Vercel function logs:</div>
          <CopyCode code={`Vercel Dashboard → Your Project → Functions tab → webhook
→ You should see logs like:
  📨 Webhook event: instagram
  🎯 IG comment reply sent for keyword: price
  ✅ Reply delivered`} />

          <div style={{ fontSize:14, fontWeight:600, color:G.text, marginBottom:10 }}>Test the API directly:</div>
          <CopyCode code={`curl -X POST https://YOUR-VERCEL-URL.vercel.app/api/test \\
  -H "Content-Type: application/json" \\
  -d '{"text":"what is the price?","platform":"instagram"}'

# Expected:
# { "matched": true, "keyword": "price", "reply": "Hi! 👋 Our prices..." }`} />

          <Alert icon="🎊" color={G.green}>
            <strong style={{color:G.text}}>Congratulations! Your ReplyAI is live.</strong><br/>
            Every comment matching your keywords on your Instagram will now get an instant auto-reply 24/7.
          </Alert>

          <button onClick={()=>toggle(7)} style={{ padding:"9px 20px", borderRadius:9, border:"none", background:G.green, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'Outfit',sans-serif" }}>
            🎉 I'm Live!
          </button>
        </Step>

        {/* Final checklist */}
        {Object.keys(done).length === 7 && (
          <div style={{ marginTop:24, padding:"22px 24px", background:`linear-gradient(135deg, rgba(34,197,94,0.1), rgba(6,182,212,0.06))`, border:`1.5px solid rgba(34,197,94,0.35)`, borderRadius:18, textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🚀</div>
            <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:22, fontWeight:800, color:G.green, marginBottom:6 }}>You're fully live!</div>
            <div style={{ fontSize:14, color:G.muted, lineHeight:1.6, marginBottom:16 }}>
              ReplyAI is deployed on Vercel and connected to your Instagram.<br/>
              Every matching comment & DM gets an instant auto-reply.
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
              <Tag c={G.green}>✓ Vercel Deployed</Tag>
              <Tag c={G.ig}>✓ Instagram Connected</Tag>
              <Tag c={G.teal}>✓ Webhook Live</Tag>
              <Tag c={G.accent}>✓ Auto-Reply Active</Tag>
            </div>
          </div>
        )}

        {/* Troubleshooting */}
        <div style={{ marginTop:28, background:G.s1, border:`1px solid ${G.border}`, borderRadius:16, padding:22 }}>
          <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:16, fontWeight:700, marginBottom:14 }}>🔧 Troubleshooting</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { q:"Webhook verification fails",      a:'Make sure WEBHOOK_VERIFY_TOKEN in Vercel matches exactly what you entered in Meta. Redeploy after adding env vars.' },
              { q:"No auto-reply on comments",       a:'Check Vercel Logs. Make sure you subscribed to "comments" field. Instagram Business/Creator accounts only (not personal).' },
              { q:"Token expired error",             a:'Instagram tokens expire. Go to User Token Generator and click "Generate Token" again to get a fresh one.' },
              { q:"Webhook verified but no events",  a:'Run the Graph API subscribed_apps POST (Step 6) — you must subscribe at the account level too.' },
              { q:"CORS error on /api routes",       a:'Check your vercel.json has the CORS headers section. Redeploy.' },
            ].map((item,i) => (
              <div key={i} style={{ padding:"11px 14px", background:G.s2, border:`1px solid ${G.border}`, borderRadius:10 }}>
                <div style={{ fontSize:13, fontWeight:600, color:G.gold, marginBottom:4 }}>❓ {item.q}</div>
                <div style={{ fontSize:13, color:G.muted, lineHeight:1.5 }}>→ {item.a}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
