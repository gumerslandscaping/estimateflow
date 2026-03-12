'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function Landing() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSignup = () => {
    if (!email) return
    setSubmitted(true)
  }

  return (
    <div style={{ background: "#0a0a0a", color: "#f1f1f1", fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1a1a1a", position: "sticky", top: 0, background: "#0a0a0aee", backdropFilter: "blur(10px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/logo.png" alt="CotizaFlow" width={40} height={40} style={{ borderRadius: 8, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>CotizaFlow</div>
            <div style={{ fontSize: 10, color: "#f5a623", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>by Gumers Landscaping</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/dashboard" style={{ color: "#999", fontSize: 14, textDecoration: "none" }}>Sign In</a>
          <a href="#signup" style={{ background: "#f5a623", color: "#000", padding: "8px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Start Free Trial</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "100px 24px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#1a2a1a", border: "1px solid #2a4a2a", borderRadius: 20, padding: "6px 16px", fontSize: 12, color: "#f5a623", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
          Built by a landscaper, for small businesses
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: "-0.03em" }}>
          Send Professional<br />
          <span style={{ color: "#f5a623" }}>Estimates in Minutes</span>
        </h1>
        <p style={{ fontSize: 20, color: "#999", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.6 }}>
          Create estimates, send them by email or text, and let AI suggest prices — all in one simple tool built for landscapers, contractors, and cleaners.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#signup" style={{ background: "#f5a623", color: "#000", padding: "14px 32px", borderRadius: 10, fontWeight: 800, fontSize: 16, textDecoration: "none" }}>Start Free Trial →</a>
          <a href="#how" style={{ background: "transparent", color: "#f1f1f1", padding: "14px 32px", borderRadius: 10, fontWeight: 600, fontSize: 16, textDecoration: "none", border: "1px solid #333" }}>See How It Works</a>
        </div>
      </section>

      {/* STORY */}
      <section style={{ background: "#111", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#f5a623", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Our Story</div>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 24, letterSpacing: "-0.02em" }}>I built this for my own business</h2>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <Image src="/logo.png" alt="Gumers Landscaping" width={80} height={80} style={{ borderRadius: "50%", objectFit: "contain", border: "3px solid #f5a623" }} />
          </div>
          <p style={{ fontSize: 18, color: "#aaa", lineHeight: 1.8, marginBottom: 20 }}>
            My name is Elvis, owner of <strong style={{ color: "#fff" }}>Gumers Landscaping</strong> in the Chicago area. I was tired of writing estimates by hand, texting photos of paper quotes, and losing track of what I sent to clients.
          </p>
          <p style={{ fontSize: 18, color: "#aaa", lineHeight: 1.8, marginBottom: 20 }}>
            So I built <strong style={{ color: "#f5a623" }}>CotizaFlow</strong> — a simple tool that lets me create a professional estimate in minutes, send it by email or text, and even get AI to suggest prices for my services.
          </p>
          <p style={{ fontSize: 18, color: "#aaa", lineHeight: 1.8 }}>
            Now I'm sharing it with other small business owners who are tired of the same headaches.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="how" style={{ maxWidth: 960, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 12, color: "#f5a623", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Features</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>Everything you need to close more jobs</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            { icon: "📋", title: "Build Estimates Fast", desc: "Add line items, quantities and rates. Totals calculate automatically. Done in minutes." },
            { icon: "📧", title: "Send by Email or Text", desc: "Send your estimate directly to your client's phone or inbox with one click." },
            { icon: "✨", title: "AI Price Suggestions", desc: "Type a service like 'lawn mowing' and AI instantly suggests a fair price for your area." },
            { icon: "📊", title: "Track Everything", desc: "See all your estimates in one place — Draft, Sent, Accepted, Declined." },
            { icon: "💰", title: "Know Your Pipeline", desc: "See your total estimate value at a glance so you always know what's coming in." },
            { icon: "📱", title: "Works on Any Device", desc: "Use it on your phone, tablet, or computer — anywhere, anytime." },
          ].map((f, i) => (
            <div key={i} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 14, padding: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "#fff" }}>{f.title}</div>
              <div style={{ fontSize: 14, color: "#777", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHO ITS FOR */}
      <section style={{ background: "#111", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#f5a623", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Who It's For</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 40, letterSpacing: "-0.02em" }}>Built for small business owners</h2>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {["🌿 Landscapers", "🔨 Contractors", "🧹 Cleaners", "🪟 Window Washers", "🌳 Tree Services", "🏗️ Handymen"].map((b, i) => (
              <div key={i} style={{ background: "#1a2a1a", border: "1px solid #2a4a2a", borderRadius: 10, padding: "10px 20px", fontSize: 15, fontWeight: 600, color: "#e8f5e8" }}>{b}</div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#f5a623", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Pricing</div>
        <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>Simple, affordable pricing</h2>
        <p style={{ color: "#777", fontSize: 16, marginBottom: 48 }}>Try it free for 14 days. No credit card required.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {[
            { name: "Starter", price: "Free", period: "14 day trial", features: ["Unlimited estimates", "Email & text sending", "AI price suggestions", "Supabase database"], cta: "Start Free Trial", accent: false },
            { name: "Pro", price: "$19", period: "per month", features: ["Everything in Starter", "Priority support", "Custom branding", "More coming soon!"], cta: "Get Pro", accent: true },
          ].map((p, i) => (
            <div key={i} style={{ background: p.accent ? "#1a2a1a" : "#111", border: `1px solid ${p.accent ? "#f5a623" : "#1a1a1a"}`, borderRadius: 16, padding: 32, textAlign: "left" }}>
              <div style={{ fontSize: 13, color: p.accent ? "#f5a623" : "#777", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{p.price}</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>{p.period}</div>
              <div style={{ borderTop: "1px solid #222", paddingTop: 20, marginBottom: 24 }}>
                {p.features.map((f, j) => (
                  <div key={j} style={{ fontSize: 14, color: "#aaa", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#f5a623" }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <a href="#signup" style={{ display: "block", background: p.accent ? "#f5a623" : "#222", color: p.accent ? "#000" : "#fff", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: "none", textAlign: "center" }}>{p.cta}</a>
            </div>
          ))}
        </div>
      </section>

      {/* SIGNUP */}
      <section id="signup" style={{ background: "#111", borderTop: "1px solid #1a1a1a", padding: "80px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#f5a623", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Get Early Access</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>Start your free trial today</h2>
          <p style={{ color: "#777", fontSize: 16, marginBottom: 32 }}>Join other small business owners already using CotizaFlow to win more jobs.</p>
          {submitted ? (
            <div style={{ background: "#1a2a1a", border: "1px solid #2a4a2a", borderRadius: 12, padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 8 }}>You're on the list!</div>
              <div style={{ color: "#777", fontSize: 14 }}>We'll be in touch soon with your access.</div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, maxWidth: 480, margin: "0 auto" }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, color: "#fff", padding: "12px 16px", fontSize: 15, fontFamily: "inherit", outline: "none" }}
              />
              <button onClick={handleSignup} style={{ background: "#f5a623", color: "#000", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                Get Access →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "32px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="CotizaFlow" width={28} height={28} style={{ borderRadius: 6, objectFit: "contain" }} />
          <span style={{ fontWeight: 700, color: "#fff" }}>CotizaFlow</span>
          <span style={{ color: "#444", fontSize: 13 }}>by Gumers Landscaping</span>
        </div>
        <div style={{ color: "#444", fontSize: 13 }}>© 2026 CotizaFlow. All rights reserved.</div>
      </footer>

    </div>
  )
}
