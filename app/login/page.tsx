'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Image from 'next/image'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('✅ Account created! Wait for admin approval before logging in.')
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage(error.message)
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('approved')
          .eq('id', data.user.id)
          .single()

        if (!profile?.approved) {
          await supabase.auth.signOut()
          setMessage('⏳ Your account is pending approval. Please wait.')
        } else {
          window.location.href = '/dashboard'
        }
      }
    }
    setLoading(false)
  }

  const BG = "#0d1f0d"
  const CARD = "#152615"
  const BORDER = "#2a4a2a"
  const TEXT = "#e8f5e8"
  const MUTED = "#6b8f6b"
  const ACCENT = "#f5a623"

  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 40, width: "100%", maxWidth: 420 }}>
        
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/logo.png" alt="Gumers Landscaping" width={64} height={64} style={{ borderRadius: 12, objectFit: "contain", marginBottom: 12 }} />
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT }}>CotizaFlow</div>
          <div style={{ fontSize: 12, color: ACCENT, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>by Gumers Landscaping</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{ width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, padding: "10px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {message && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: message.startsWith('✅') ? "#064e3b" : message.startsWith('⏳') ? "#1e3a5f" : "#450a0a", borderRadius: 8, fontSize: 13, color: TEXT }}>
            {message}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: "100%", background: ACCENT, color: "#000", border: "none", borderRadius: 8, padding: "12px", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}
        >
          {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
        </button>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={() => { setIsSignup(!isSignup); setMessage('') }}
            style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
          >
            {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}