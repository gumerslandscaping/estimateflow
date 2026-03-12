'use client'

import { supabase } from '../../lib/supabase'
import { useState, useEffect } from "react";
import Image from "next/image";

const TAX_RATE = 0.08;
const PRIMARY = "#1a4a1a";
const ACCENT = "#f5a623";
const BG = "#0d1f0d";
const CARD = "#152615";
const BORDER = "#2a4a2a";
const TEXT = "#e8f5e8";
const MUTED = "#6b8f6b";

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: "Draft",    color: "#94a3b8", bg: "#1e293b" },
  sent:     { label: "Sent",     color: "#60a5fa", bg: "#1e3a5f" },
  viewed:   { label: "Viewed",   color: "#a78bfa", bg: "#2d1b69" },
  accepted: { label: "Accepted", color: "#34d399", bg: "#064e3b" },
  declined: { label: "Declined", color: "#f87171", bg: "#450a0a" },
};

const emptyLine = () => ({ id: generateId(), description: "", qty: 1, unit: "hr", rate: 0 });

const defaultEstimate = () => ({
  id: generateId(),
  number: `EST-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  status: "draft",
  clientId: null as null | number,
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  issueDate: new Date().toISOString().split("T")[0],
  expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  lines: [emptyLine()],
  notes: "",
  taxEnabled: true,
  createdAt: new Date().toISOString(),
});

function Badge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span style={{
      background: m.bg, color: m.color,
      border: `1px solid ${m.color}33`,
      borderRadius: 6, padding: "2px 10px",
      fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase",
    }}>{m.label}</span>
  );
}

function LineRow({ line, onChange, onRemove, canRemove }: { line: any; onChange: (l: any) => void; onRemove: () => void; canRemove: boolean }) {
  const total = (line.qty || 0) * (line.rate || 0);
  const update = (k: string, v: any) => onChange({ ...line, [k]: v });
  const [suggesting, setSuggesting] = useState(false);

  const suggestPrice = async () => {
    if (!line.description) { alert('Type a service description first!'); return; }
    setSuggesting(true);
    try {
      const res = await fetch('/api/suggest-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: line.description })
      });
      const data = await res.json();
      onChange({ ...line, rate: data.price, unit: data.unit });
    } catch (err) {
      console.error(err);
    }
    setSuggesting(false);
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 110px 100px 32px", gap: 8, alignItems: "center" }}>
        <input placeholder="Description…" value={line.description} onChange={e => update("description", e.target.value)} style={iS()} />
        <input type="number" min="0" value={line.qty} onChange={e => update("qty", parseFloat(e.target.value) || 0)} style={iS({ center: true })} />
        <select value={line.unit} onChange={e => update("unit", e.target.value)} style={iS({ center: true })}>
          {["hr","day","unit","item","flat","mo","sqft"].map(u => <option key={u}>{u}</option>)}
        </select>
        <input type="number" min="0" step="0.01" value={line.rate} onChange={e => update("rate", parseFloat(e.target.value) || 0)} style={iS({ center: true })} placeholder="0.00" />
        <div style={{ textAlign: "right", fontWeight: 600, color: TEXT, fontSize: 14, fontFamily: "monospace" }}>{formatCurrency(total)}</div>
        <button onClick={onRemove} disabled={!canRemove} style={{ background: "none", border: "none", cursor: canRemove ? "pointer" : "default", color: canRemove ? "#f87171" : BORDER, fontSize: 20, padding: 0 }}>×</button>
      </div>
      <button onClick={suggestPrice} disabled={suggesting}
        style={{ marginTop: 4, background: "transparent", border: `1px solid ${ACCENT}33`, borderRadius: 6, color: ACCENT, fontSize: 11, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit" }}>
        {suggesting ? "✨ Thinking..." : "✨ AI Suggest Price"}
      </button>
    </div>
  );
}

function iS({ center }: { center?: boolean } = {}): React.CSSProperties {
  return {
    background: BG, border: `1px solid ${BORDER}`, borderRadius: 8,
    color: TEXT, padding: "8px 10px", fontSize: 13,
    fontFamily: "inherit", outline: "none",
    textAlign: center ? "center" : "left", width: "100%", boxSizing: "border-box",
  };
}

function btn(variant: string): React.CSSProperties {
  const base: React.CSSProperties = { border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" } as React.CSSProperties;
  if (variant === "primary")   return { ...base, background: ACCENT, color: "#000" };
  if (variant === "secondary") return { ...base, background: CARD, color: MUTED, border: `1px solid ${BORDER}` };
  if (variant === "ghost")     return { ...base, background: "transparent", color: MUTED, border: `1px solid ${BORDER}` };
  if (variant === "green")     return { ...base, background: PRIMARY, color: TEXT, border: `1px solid ${BORDER}` };
  if (variant === "danger")    return { ...base, background: "#450a0a", color: "#f87171", border: "1px solid #f8717133" };
  return base;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{ ...iS(), width: "100%", boxSizing: "border-box" }} />
    </div>
  );
}

function EstimateEditor({ estimate, onSave, onCancel }: { estimate: any; onSave: (e: any) => void; onCancel: () => void }) {
  const [est, setEst] = useState(estimate);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const upd = (k: string, v: any) => setEst((p: any) => ({ ...p, [k]: v }));

  const subtotal = est.lines.reduce((s: number, l: any) => s + (l.qty * l.rate || 0), 0);
  const tax = est.taxEnabled ? subtotal * TAX_RATE : 0;
  const total = subtotal + tax;

  const addLine = () => upd("lines", [...est.lines, emptyLine()]);
  const removeLine = (id: string) => upd("lines", est.lines.filter((l: any) => l.id !== id));
  const updateLine = (id: string, updated: any) => upd("lines", est.lines.map((l: any) => l.id === id ? updated : l));

  const handleSave = async (status: string) => {
    setSaving(true);
    try {
      const { error: estError } = await supabase
        .from('estimates')
        .upsert({
          id: est.id,
          number: est.number,
          status,
          client_name: est.clientName,
          client_email: est.clientEmail,
          client_phone: est.clientPhone,
          issue_date: est.issueDate,
          expiry_date: est.expiryDate,
          notes: est.notes,
          tax_enabled: est.taxEnabled,
        });

      if (estError) throw estError;

      await supabase.from('estimate_lines').delete().eq('estimate_id', est.id);

      const lines = est.lines.map((l: any, i: number) => ({
        estimate_id: est.id,
        description: l.description,
        qty: l.qty,
        unit: l.unit,
        rate: l.rate,
        sort_order: i,
      }));

      const { error: linesError } = await supabase.from('estimate_lines').insert(lines);
      if (linesError) throw linesError;

      onSave({ ...est, status });
    } catch (err) {
      alert('Error saving estimate. Check console.');
      console.error(err);
    }
    setSaving(false);
  };

  const handleEmail = async () => {
    if (!est.clientEmail) { alert('Please add a client email first!'); return; }
    setSending(true);
    try {
      await handleSave("sent");
      const res = await fetch('/api/send-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimate: est })
      });
      if (!res.ok) throw new Error('Failed to send');
      alert('Email sent successfully! ✅');
    } catch (err) {
      alert('Error sending email. Check console.');
      console.error(err);
    }
    setSending(false);
  };

  const handleSMS = async () => {
    if (!est.clientPhone) { alert('Please add a client phone number first!'); return; }
    setSending(true);
    try {
      await handleSave("sent");
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimate: est })
      });
      if (!res.ok) throw new Error('Failed to send');
      alert('Text sent successfully! ✅');
    } catch (err) {
      alert('Error sending text. Check console.');
      console.error(err);
    }
    setSending(false);
  };

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: TEXT }}>
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 22, padding: 0 }}>←</button>
          <Image src="/logo.png" alt="Gumers Landscaping" width={36} height={36} style={{ borderRadius: 6, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>{est.number}</div>
            <div style={{ fontSize: 12, color: MUTED }}>Editing estimate</div>
          </div>
          <Badge status={est.status} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={btn("ghost")}>Discard</button>
          <button onClick={() => handleSave("draft")} disabled={saving} style={btn("secondary")}>{saving ? "Saving..." : "Save Draft"}</button>
          <button onClick={handleEmail} disabled={sending} style={btn("green")}>📧 {sending ? "Sending..." : "Email Client"}</button>
          <button onClick={handleSMS} disabled={sending} style={btn("primary")}>💬 {sending ? "Sending..." : "Text Client"}</button>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        <div>
          <Section title="Client">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <LabeledInput label="Client Name" value={est.clientName} onChange={(v: string) => upd("clientName", v)} placeholder="John Smith" />
              <LabeledInput label="Client Email" value={est.clientEmail} onChange={(v: string) => upd("clientEmail", v)} placeholder="john@email.com" type="email" />
              <LabeledInput label="Client Phone" value={est.clientPhone || ""} onChange={(v: string) => upd("clientPhone", v)} placeholder="+1 555 000 0000" type="tel" />
            </div>
          </Section>

          <Section title="Dates">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <LabeledInput label="Issue Date" value={est.issueDate} onChange={(v: string) => upd("issueDate", v)} type="date" />
              <LabeledInput label="Expiry Date" value={est.expiryDate} onChange={(v: string) => upd("expiryDate", v)} type="date" />
            </div>
          </Section>

          <Section title="Line Items">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 110px 100px 32px", gap: 8, marginBottom: 8 }}>
              {["Description","Qty","Unit","Rate","Total",""].map((h,i) => (
                <div key={i} style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i >= 3 ? "center" : "left" }}>{h}</div>
              ))}
            </div>
            {est.lines.map((l: any) => (
              <LineRow key={l.id} line={l} onChange={(updated: any) => updateLine(l.id, updated)} onRemove={() => removeLine(l.id)} canRemove={est.lines.length > 1} />
            ))}
            <button onClick={addLine} style={{ ...btn("ghost"), fontSize: 13, marginTop: 8 }}>+ Add Line Item</button>
          </Section>

          <Section title="Notes & Terms">
            <textarea value={est.notes} onChange={e => upd("notes", e.target.value)}
              placeholder="Payment due within 30 days."
              rows={3}
              style={{ ...iS(), width: "100%", resize: "vertical", lineHeight: 1.6 }}
            />
          </Section>
        </div>

        <div>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, position: "sticky", top: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Summary</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: MUTED }}>Subtotal</span>
              <span style={{ fontSize: 13, color: MUTED, fontFamily: "monospace" }}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: MUTED, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={est.taxEnabled} onChange={e => upd("taxEnabled", e.target.checked)} style={{ accentColor: ACCENT }} />
                Tax (8%)
              </label>
              <span style={{ fontSize: 13, color: MUTED, fontFamily: "monospace" }}>{formatCurrency(tax)}</span>
            </div>
            <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: TEXT }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: ACCENT, fontFamily: "monospace" }}>{formatCurrency(total)}</span>
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={handleEmail} disabled={sending} style={{ ...btn("green"), width: "100%", justifyContent: "center" }}>📧 {sending ? "Sending..." : "Email Client"}</button>
              <button onClick={handleSMS} disabled={sending} style={{ ...btn("primary"), width: "100%", justifyContent: "center" }}>💬 {sending ? "Sending..." : "Text Client"}</button>
              <button onClick={() => handleSave("draft")} disabled={saving} style={{ ...btn("secondary"), width: "100%", justifyContent: "center" }}>{saving ? "Saving..." : "Save as Draft"}</button>
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", background: BG, borderRadius: 8, fontSize: 12, color: MUTED }}>
              📅 Valid until <strong style={{ color: TEXT }}>{formatDate(est.expiryDate)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EstimateList({ estimates, onNew, onEdit, onDelete, loading }: { estimates: any[]; onNew: () => void; onEdit: (e: any) => void; onDelete: (id: string) => void; loading: boolean }) {
  const totalValue = estimates.reduce((s, e) => {
    const sub = e.lines.reduce((ls: number, l: any) => ls + (l.qty * l.rate || 0), 0);
    return s + (e.taxEnabled ? sub * (1 + TAX_RATE) : sub);
  }, 0);
  const accepted = estimates.filter(e => e.status === "accepted").length;

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: TEXT }}>
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Image src="/logo.png" alt="Gumers Landscaping" width={52} height={52} style={{ borderRadius: 10, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: TEXT, letterSpacing: "-0.02em" }}>Gumers Landscaping</div>
            <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Estimate Manager</div>
          </div>
        </div>
        <button onClick={onNew} style={{ ...btn("primary"), fontSize: 14, padding: "10px 20px" }}>+ New Estimate</button>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Estimates", value: estimates.length, icon: "📋" },
            { label: "Accepted", value: accepted, icon: "✅" },
            { label: "Pipeline Value", value: formatCurrency(totalValue), icon: "💰" },
          ].map((s, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: TEXT, fontFamily: "monospace" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: TEXT }}>All Estimates</span>
            <span style={{ fontSize: 12, color: MUTED }}>{estimates.length} total</span>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: MUTED }}>Loading estimates...</div>
          ) : estimates.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: MUTED }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div style={{ fontWeight: 600, marginBottom: 6, color: TEXT }}>No estimates yet</div>
              <div style={{ fontSize: 13 }}>Create your first estimate to get started</div>
              <button onClick={onNew} style={{ ...btn("primary"), margin: "20px auto 0" }}>+ New Estimate</button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Number","Client","Issue Date","Expiry","Total","Status",""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 16px", textAlign: i >= 4 ? "right" : "left", fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estimates.map(est => {
                  const sub = est.lines.reduce((s: number, l: any) => s + (l.qty * l.rate || 0), 0);
                  const tot = est.taxEnabled ? sub * (1 + TAX_RATE) : sub;
                  return (
                    <tr key={est.id} onClick={() => onEdit(est)}
                      style={{ borderBottom: `1px solid ${BG}`, cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: ACCENT, fontSize: 13 }}>{est.number}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: TEXT }}>{est.clientName || <span style={{ color: MUTED }}>No client</span>}</div>
                        {est.clientEmail && <div style={{ fontSize: 11, color: MUTED }}>{est.clientEmail}</div>}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: MUTED }}>{formatDate(est.issueDate)}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: MUTED }}>{formatDate(est.expiryDate)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, fontFamily: "monospace", fontSize: 14, color: TEXT }}>{formatCurrency(tot)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}><Badge status={est.status} /></td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <button onClick={e => { e.stopPropagation(); onDelete(est.id); }} style={{ ...btn("danger"), padding: "4px 10px", fontSize: 12 }}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstimates();
  }, []);

  const loadEstimates = async () => {
    setLoading(true);
    const { data: ests } = await supabase.from('estimates').select('*').order('created_at', { ascending: false });
    if (!ests) { setLoading(false); return; }

    const withLines = await Promise.all(ests.map(async (est) => {
      const { data: lines } = await supabase.from('estimate_lines').select('*').eq('estimate_id', est.id).order('sort_order');
      return {
        id: est.id,
        number: est.number,
        status: est.status,
        clientName: est.client_name || "",
        clientEmail: est.client_email || "",
        clientPhone: est.client_phone || "",
        issueDate: est.issue_date,
        expiryDate: est.expiry_date,
        notes: est.notes || "",
        taxEnabled: est.tax_enabled,
        createdAt: est.created_at,
        lines: (lines || []).map((l: any) => ({
          id: l.id,
          description: l.description,
          qty: l.qty,
          unit: l.unit,
          rate: l.rate,
        })),
      };
    }));

    setEstimates(withLines);
    setLoading(false);
  };

  const handleSave = (est: any) => {
    setEstimates(prev => {
      const exists = prev.find(e => e.id === est.id);
      return exists ? prev.map(e => e.id === est.id ? est : e) : [est, ...prev];
    });
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('estimates').delete().eq('id', id);
    setEstimates(prev => prev.filter(e => e.id !== id));
  };

  if (editing) return <EstimateEditor estimate={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
  return <EstimateList estimates={estimates} loading={loading} onNew={() => setEditing(defaultEstimate())} onEdit={(e: any) => setEditing({ ...e })} onDelete={handleDelete} />;
}
