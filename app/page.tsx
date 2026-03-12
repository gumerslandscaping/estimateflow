'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Landing() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const target = 2847
    const duration = 2000
    const step = target / (duration / 16)
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 16)
    return () => clearInterval(timer)
  }, [])

  const GOLD = "#f5a623"
  const GREEN = "#1a4a1a"
  const DARKGREEN = "#0d1f0d"
  const CARDGREEN = "#152615"
  const BORDER = "#2a4a2a"
  const TEXT = "#e8f5e8"
  const MUTED = "#6b8f6b"

  return (
    <div style={{ background: DARKGREEN, color: TEXT, fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>

      {/* Animated background grid */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(245,166,35,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.03) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        pointerEvents: "none"
      }} />

      {/* Glow orbs */}
      <div style={{ position: "fixed", top: "-20%", left: "-10%", width: 600, height: 600, background: "radial-gradient(circle, rgba(26,74,26,0.4) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-20%", right: "-10%", width: 800, height: 800, background: "radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* NAV */}
      <nav style={{
        padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? `rgba(13,31,13,0.97)` : "transparent",
        borderBottom: scrolled ? `1px solid ${BORDER}` : "none",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        transition: "all 0.3s ease"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/logo.png" alt="CotizaFlow" width={40} height={40} style={{ borderRadius: 8, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, background: `linear-gradient(135deg, ${TEXT} 0%, ${GOLD} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>CotizaFlow</div>
            <div style={{ fontSize: 9, color: GOLD, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>by Gumers Landscaping</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/login" style={{ color: MUTED, fontSize: 14, textDecoration: "none", fontWeight: 500 }}>Sign In</a>
          <a href="#signup" style={{
            background: `linear-gradient(135deg, ${GOLD}, #ffd166)`,
            color: "#000", padding: "9px 22px", borderRadius: 8,
            fontWeight: 800, fontSize: 13, textDecoration: "none",
            boxShadow: `0 0 20px rgba(245,166,35,0.3)`
          }}>Start Free →</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px" }}>
        <div style={{ maxWidth: 900 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(245,166,35,0.08)", border: `1px solid rgba(245,166,35,0.25)`,
            borderRadius: 100, padding: "6px 18px", marginBottom: 32
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
            <span style={{ fontSize: 12, color: GOLD, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Built by a real business owner</span>
          </div>

          <h1 style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.05, marginBottom: 12, letterSpacing: "-0.04em", color: TEXT }}>
            The World Is
          </h1>
          <h1 style={{
            fontSize: 72, fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: "-0.04em",
            background: `linear-gradient(135deg, ${GOLD} 0%, #ffd166 50%, ${GOLD} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Yours to Take.
          </h1>

          <p style={{ fontSize: 20, color: MUTED, maxWidth: 580, margin: "0 auto 16px", lineHeight: 1.7 }}>
            Stop losing jobs to competitors with fancier paperwork. Send professional estimates in minutes — from your phone, anywhere, anytime.
          </p>
          <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto 48px", lineHeight: 1.7 }}>
            AI-powered pricing. Instant email & text delivery. Built by <span style={{ color: GOLD, fontWeight: 600 }}>Elvis @ Gumers Landscaping</span> — for people who work hard and want to look the part.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
            <a href="#signup" style={{
              background: `linear-gradient(135deg, ${GOLD}, #ffd166)`,
              color: "#000", padding: "16px 40px", borderRadius: 10,
              fontWeight: 900, fontSize: 16, textDecoration: "none",
              boxShadow: `0 0 40px rgba(245,166,35,0.35), 0 4px 20px rgba(0,0,0,0.5)`,
              letterSpacing: "0.02em"
            }}>Start Free Trial →</a>
            <a href="#how" style={{
              background: "transparent", color: MUTED,
              padding: "16px 40px", borderRadius: 10,
              fontWeight: 600, fontSize: 16, textDecoration: "none",
              border: `1px solid ${BORDER}`
            }}>See How It Works</a>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 48, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { value: `$${count.toLocaleString()}`, label: "Estimated in beta" },
              { value: "< 3min", label: "To send an estimate" },
              { value: "100%", label: "Built by real owners" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: GOLD, letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{ position: "relative", zIndex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${BORDER}, transparent)`, margin: "0 48px" }} />

      {/* STORY */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>The Origin Story</div>
              <h2 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.15, marginBottom: 24, letterSpacing: "-0.03em", color: TEXT }}>
                I Was Tired of<br />
                <span style={{ color: GOLD }}>Losing Jobs</span><br />
                on Paper.
              </h2>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.8, marginBottom: 16 }}>
                My name is Elvis. I run <strong style={{ color: TEXT }}>Gumers Landscaping</strong> in Chicago. Every estimate I sent was a text message, a photo of a napkin, or a Word doc that took an hour to make.
              </p>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.8, marginBottom: 16 }}>
                Clients weren't taking me seriously. I was losing bids to guys with nicer-looking paperwork — not better work.
              </p>
              <p style={{ fontSize: 16, color: GOLD, lineHeight: 1.8, fontWeight: 600 }}>
                So I built CotizaFlow. Now I send professional estimates in under 3 minutes — and I'm sharing it with you.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: CARDGREEN, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28 }}>
                <Image src="/logo.png" alt="Gumers Landscaping" width={72} height={72} style={{ borderRadius: "50%", objectFit: "contain", border: `2px solid ${GOLD}`, marginBottom: 16 }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>Elvis</div>
                <div style={{ fontSize: 13, color: GOLD, fontWeight: 600, marginBottom: 12 }}>Owner, Gumers Landscaping</div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, fontStyle: "italic" }}>"I built the tool I always wished existed. Now you can use it too."</div>
              </div>
              {[
                { icon: "🌿", text: "10+ years in landscaping" },
                { icon: "📍", text: "Based in Chicago, IL" },
                { icon: "💻", text: "Built CotizaFlow from scratch" },
              ].map((i, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: CARDGREEN, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>{i.icon}</span>
                  <span style={{ fontSize: 14, color: MUTED }}>{i.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="how" style={{ position: "relative", zIndex: 1, padding: "100px 24px", background: `rgba(21,38,21,0.5)` }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>The Weapon</div>
            <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16, color: TEXT }}>Everything You Need<br />to <span style={{ color: GOLD }}>Win More Jobs</span></h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {[
              { icon: "⚡", title: "Build Estimates Fast", desc: "Add services, quantities, and rates. Totals auto-calculate. Done in under 3 minutes.", num: "01" },
              { icon: "📲", title: "Send by Text or Email", desc: "Hit one button. Your client gets a professional estimate on their phone instantly.", num: "02" },
              { icon: "✨", title: "AI Pricing Engine", desc: "Type 'lawn mowing' — AI suggests the right price for your market. No more guessing.", num: "03" },
              { icon: "📊", title: "Track Every Deal", desc: "Draft, Sent, Accepted, Declined. Know exactly where every job stands.", num: "04" },
              { icon: "💰", title: "See Your Pipeline", desc: "Total estimate value at a glance. Know what's coming in before it hits your account.", num: "05" },
              { icon: "🌐", title: "Works Everywhere", desc: "Phone, tablet, laptop. On the job site or at your kitchen table.", num: "06" },
            ].map((f, i) => (
              <div key={i} style={{
                padding: 32, background: CARDGREEN,
                border: `1px solid ${BORDER}`,
                position: "relative", overflow: "hidden",
                transition: "background 0.2s"
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = GREEN}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = CARDGREEN}
              >
                <div style={{ position: "absolute", top: 16, right: 20, fontSize: 11, color: BORDER, fontWeight: 900, fontFamily: "monospace" }}>{f.num}</div>
                <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10, color: TEXT }}>{f.title}</div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO ITS FOR */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>Who It's Built For</div>
          <h2 style={{ fontSize: 48, fontWeight: 900, marginBottom: 48, letterSpacing: "-0.03em", color: TEXT }}>
            For the <span style={{ color: GOLD }}>Hustlers</span><br />Who Build Things
          </h2>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {["🌿 Landscapers", "🔨 Contractors", "🧹 Cleaners", "🪟 Window Washers", "🌳 Tree Services", "🏗️ Handymen", "🎨 Painters", "⚡ Electricians"].map((b, i) => (
              <div key={i} style={{
                background: CARDGREEN, border: `1px solid ${BORDER}`,
                borderRadius: 100, padding: "10px 20px",
                fontSize: 14, fontWeight: 600, color: MUTED,
                transition: "all 0.2s", cursor: "default"
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = GOLD; (e.currentTarget as HTMLElement).style.color = GOLD }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; (e.currentTarget as HTMLElement).style.color = MUTED }}
              >{b}</div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 24px", background: `rgba(21,38,21,0.5)` }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>Pricing</div>
          <h2 style={{ fontSize: 48, fontWeight: 900, marginBottom: 16, letterSpacing: "-0.03em", color: TEXT }}>No Excuses.<br /><span style={{ color: GOLD }}>Just Results.</span></h2>
          <p style={{ color: MUTED, fontSize: 16, marginBottom: 56 }}>14 days free. No credit card. Cancel anytime.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {[
              { name: "Starter", price: "Free", period: "14 day trial", features: ["Unlimited estimates", "Email & text sending", "AI price suggestions", "Full dashboard"], cta: "Start Free Trial", accent: false },
              { name: "Pro", price: "$19", period: "per month", features: ["Everything in Starter", "Priority support", "Custom branding", "Early access to new features"], cta: "Go Pro", accent: true },
            ].map((p, i) => (
              <div key={i} style={{
                background: p.accent ? `rgba(245,166,35,0.05)` : CARDGREEN,
                border: `1px solid ${p.accent ? `rgba(245,166,35,0.3)` : BORDER}`,
                padding: 40, textAlign: "left",
                position: "relative", overflow: "hidden"
              }}>
                {p.accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${GOLD}, #ffd166)` }} />}
                <div style={{ fontSize: 12, color: p.accent ? GOLD : MUTED, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{p.name}</div>
                <div style={{ fontSize: 52, fontWeight: 900, color: TEXT, letterSpacing: "-0.03em", marginBottom: 4 }}>{p.price}</div>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 32 }}>{p.period}</div>
                {p.features.map((f, j) => (
                  <div key={j} style={{ fontSize: 14, color: MUTED, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: GOLD, fontSize: 16 }}>→</span> {f}
                  </div>
                ))}
                <a href="#signup" style={{
                  display: "block", marginTop: 32,
                  background: p.accent ? `linear-gradient(135deg, ${GOLD}, #ffd166)` : GREEN,
                  color: p.accent ? "#000" : MUTED,
                  border: p.accent ? "none" : `1px solid ${BORDER}`,
                  padding: "14px", borderRadius: 8,
                  fontWeight: 800, fontSize: 14, textDecoration: "none", textAlign: "center",
                  boxShadow: p.accent ? `0 0 30px rgba(245,166,35,0.2)` : "none"
                }}>{p.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIGNUP */}
      <section id="signup" style={{ position: "relative", zIndex: 1, padding: "120px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>Get Access</div>
          <h2 style={{ fontSize: 52, fontWeight: 900, marginBottom: 16, letterSpacing: "-0.03em", lineHeight: 1.1, color: TEXT }}>
            The Only Move<br />Is <span style={{ color: GOLD }}>Forward.</span>
          </h2>
          <p style={{ color: MUTED, fontSize: 16, marginBottom: 48, lineHeight: 1.7 }}>
            Join small business owners already using CotizaFlow to win more jobs and look more professional.
          </p>
          {submitted ? (
            <div style={{ background: CARDGREEN, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
              <div style={{ fontWeight: 900, fontSize: 24, color: TEXT, marginBottom: 8 }}>You're In.</div>
              <div style={{ color: MUTED, fontSize: 15 }}>We'll be in touch with your access shortly.</div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 0, maxWidth: 460, margin: "0 auto", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, background: CARDGREEN, border: "none", color: TEXT, padding: "16px 20px", fontSize: 15, fontFamily: "inherit", outline: "none" }}
              />
              <button onClick={() => { if (email) setSubmitted(true) }} style={{
                background: `linear-gradient(135deg, ${GOLD}, #ffd166)`,
                color: "#000", border: "none",
                padding: "16px 28px", fontWeight: 900, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap"
              }}>
                Get Access →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: `1px solid ${BORDER}`, padding: "32px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="CotizaFlow" width={28} height={28} style={{ borderRadius: 6, objectFit: "contain" }} />
          <span style={{ fontWeight: 800, color: TEXT }}>CotizaFlow</span>
          <span style={{ color: MUTED, fontSize: 13 }}>by Gumers Landscaping</span>
        </div>
        <div style={{ color: MUTED, fontSize: 13 }}>© 2026 CotizaFlow. All rights reserved.</div>
      </footer>

    </div>
  )
}
