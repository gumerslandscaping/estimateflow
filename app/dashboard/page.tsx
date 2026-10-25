'use client'

import { supabase } from '../../lib/supabase'
import { useState, useEffect } from "react";
import Image from "next/image";

const OWNER_EMAIL = "gumerslandscaping@gmail.com";

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
  // Plain "YYYY-MM-DD" dates are read as UTC by JS, which shows the day before in US time zones.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:    { label: "Draft",    color: "#94a3b8", bg: "#1e293b" },
  sent:     { label: "Sent",     color: "#60a5fa", bg: "#1e3a5f" },
  viewed:   { label: "Viewed",   color: "#a78bfa", bg: "#2d1b69" },
  accepted: { label: "Accepted", color: "#34d399", bg: "#064e3b" },
  declined: { label: "Declined", color: "#f87171", bg: "#450a0a" },
  unpaid:   { label: "Unpaid",   color: "#fb923c", bg: "#431407" },
  paid:     { label: "Paid",     color: "#34d399", bg: "#064e3b" },
  overdue:  { label: "Overdue",  color: "#f87171", bg: "#450a0a" },
};

const emptyLine = () => ({ id: generateId(), description: "", qty: 1, unit: "hr", rate: 0 });

const defaultEstimate = () => ({
  id: generateId(),
  number: "",
  status: "draft",
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

const defaultInvoice = () => ({
  id: generateId(),
  number: "",
  status: "unpaid",
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  lines: [emptyLine()],
  notes: "",
  taxEnabled: true,
  createdAt: new Date().toISOString(),
});

// ---------- Document numbers: INV-1, INV-2… / EST-1, EST-2… ----------
// The last number used is kept on the user's account, so each account counts on its own.

type DocKind = "invoice" | "estimate";
const NUMBER_KEY: Record<DocKind, string> = { invoice: "lastInvoiceNumber", estimate: "lastEstimateNumber" };
const NUMBER_PREFIX: Record<DocKind, string> = { invoice: "INV", estimate: "EST" };

function numberValue(number: string): number {
  const m = (number || "").match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
}

async function nextNumber(kind: DocKind): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  const last = Number(user?.user_metadata?.[NUMBER_KEY[kind]]) || 0;
  return `${NUMBER_PREFIX[kind]}-${last + 1}`;
}

// New documents set the counter to their number (so typing 100 makes the next one 101).
// Edits to existing documents only ever move the counter up.
async function recordNumber(kind: DocKind, number: string, isNew: boolean) {
  const n = numberValue(number);
  if (!n) return;
  const { data: { user } } = await supabase.auth.getUser();
  const last = Number(user?.user_metadata?.[NUMBER_KEY[kind]]) || 0;
  if (isNew ? n !== last : n > last) await supabase.auth.updateUser({ data: { [NUMBER_KEY[kind]]: n } });
}

async function numberTaken(kind: DocKind, number: string, id: string): Promise<boolean> {
  const { data } = await supabase.from(kind === "invoice" ? "invoices" : "estimates").select("id").eq("number", number).neq("id", id).limit(1);
  return !!data && data.length > 0;
}

function NumberInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} title="Tap to change the number"
      style={{ background: "transparent", border: `1px dashed ${BORDER}`, borderRadius: 6, color: TEXT, fontSize: 18, fontWeight: 700, fontFamily: "inherit", padding: "2px 8px", width: 130, outline: "none" }} />
  );
}

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
    } catch (err) { console.error(err); }
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

  const handleSave = async (status: string, stay = false): Promise<boolean> => {
    const number = (est.number || "").trim();
    if (!number) { alert('Give this estimate a number.'); return false; }
    setSaving(true);
    let ok = false;
    try {
      if (await numberTaken("estimate", number, est.id)) { alert(`${number} is already used by another estimate. Pick a different number.`); setSaving(false); return false; }
      const { error: estError } = await supabase.from('estimates').upsert({
        id: est.id, number, status,
        client_name: est.clientName, client_email: est.clientEmail, client_phone: est.clientPhone,
        issue_date: est.issueDate, expiry_date: est.expiryDate, notes: est.notes, tax_enabled: est.taxEnabled,
      });
      if (estError) throw estError;
      await supabase.from('estimate_lines').delete().eq('estimate_id', est.id);
      const { error: linesError } = await supabase.from('estimate_lines').insert(
        est.lines.map((l: any, i: number) => ({ estimate_id: est.id, description: l.description, qty: l.qty, unit: l.unit, rate: l.rate, sort_order: i }))
      );
      if (linesError) throw linesError;
      await recordNumber("estimate", number, !!est.isNew);
      if (est.isNew) setEst((p: any) => ({ ...p, isNew: false }));
      ok = true;
      if (!stay) onSave({ ...est, number, status });
    } catch (err) { alert('Error saving.'); console.error(err); }
    setSaving(false);
    return ok;
  };

  const openPdf = async () => {
    if (await handleSave(est.status, true)) window.location.href = `/doc?kind=estimate&id=${est.id}`;
  };

  const handleEmail = async () => {
    if (!est.clientEmail) { alert('Add client email first!'); return; }
    setSending(true);
    try {
      await handleSave("sent");
      const res = await fetch('/api/send-estimate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estimate: est }) });
      if (!res.ok) throw new Error();
      alert('Email sent! ✅');
    } catch { alert('Error sending email.'); }
    setSending(false);
  };

  const handleSMS = async () => {
    if (!est.clientPhone) { alert('Add client phone first!'); return; }
    setSending(true);
    try {
      await handleSave("sent");
      const res = await fetch('/api/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estimate: est }) });
      if (!res.ok) throw new Error();
      alert('Text sent! ✅');
    } catch { alert('Error sending text.'); }
    setSending(false);
  };

  const convertToInvoice = async () => {
    if (!(await handleSave(est.status, true))) return;
    const inv = {
      ...defaultInvoice(),
      number: await nextNumber("invoice"),
      clientName: est.clientName,
      clientEmail: est.clientEmail,
      clientPhone: est.clientPhone,
      lines: est.lines,
      notes: est.notes,
      taxEnabled: est.taxEnabled,
    };
    const { error } = await supabase.from('invoices').insert({
      id: inv.id, number: inv.number, estimate_id: est.id, status: 'unpaid',
      client_name: inv.clientName, client_email: inv.clientEmail, client_phone: inv.clientPhone,
      issue_date: inv.issueDate, due_date: inv.dueDate, notes: inv.notes, tax_enabled: inv.taxEnabled,
    });
    if (!error) {
      await supabase.from('invoice_lines').insert(
        inv.lines.map((l: any, i: number) => ({ invoice_id: inv.id, description: l.description, qty: l.qty, unit: l.unit, rate: l.rate, sort_order: i }))
      );
      await recordNumber("invoice", inv.number, true);
      alert(`Invoice ${inv.number} created! ✅ You can find it in My Documents.`);
      onSave({ ...est });
    } else {
      alert('Could not create the invoice.'); console.error(error);
    }
  };

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: TEXT }}>
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 22, padding: 0 }}>←</button>
          <Image src="/logo.png" alt="Gumers Landscaping" width={36} height={36} style={{ borderRadius: 6, objectFit: "contain" }} />
          <div>
            <NumberInput value={est.number} onChange={v => upd("number", v)} />
            <div style={{ fontSize: 12, color: MUTED }}>Editing estimate</div>
          </div>
          <Badge status={est.status} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onCancel} style={btn("ghost")}>Discard</button>
          <button onClick={() => handleSave("draft")} disabled={saving} style={btn("secondary")}>{saving ? "Saving..." : "Save Draft"}</button>
          <button onClick={openPdf} disabled={saving} style={btn("green")}>📄 PDF / Print</button>
          <button onClick={convertToInvoice} style={btn("green")}>🧾 Convert to Invoice</button>
          <button onClick={handleEmail} disabled={sending} style={btn("green")}>📧 {sending ? "Sending..." : "Email"}</button>
          <button onClick={handleSMS} disabled={sending} style={btn("primary")}>💬 {sending ? "Sending..." : "Text"}</button>
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
            <textarea value={est.notes} onChange={e => upd("notes", e.target.value)} placeholder="Payment due within 30 days." rows={3} style={{ ...iS(), width: "100%", resize: "vertical", lineHeight: 1.6 }} />
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
              <button onClick={handleEmail} disabled={sending} style={{ ...btn("green"), width: "100%", justifyContent: "center" }}>📧 Email Client</button>
              <button onClick={handleSMS} disabled={sending} style={{ ...btn("primary"), width: "100%", justifyContent: "center" }}>💬 Text Client</button>
              <button onClick={convertToInvoice} style={{ ...btn("secondary"), width: "100%", justifyContent: "center" }}>🧾 Convert to Invoice</button>
              <button onClick={() => handleSave("draft")} disabled={saving} style={{ ...btn("ghost"), width: "100%", justifyContent: "center" }}>{saving ? "Saving..." : "Save Draft"}</button>
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


function InvoiceEditor({ invoice, onDone }: { invoice: any; onDone: () => void }) {
  const [inv, setInv] = useState(invoice);
  const [saving, setSaving] = useState(false);
  const upd = (k: string, v: any) => setInv((p: any) => ({ ...p, [k]: v }));

  const subtotal = inv.lines.reduce((s: number, l: any) => s + (l.qty * l.rate || 0), 0);
  const tax = inv.taxEnabled ? subtotal * TAX_RATE : 0;
  const total = subtotal + tax;

  const addLine = () => upd("lines", [...inv.lines, emptyLine()]);
  const removeLine = (id: string) => upd("lines", inv.lines.filter((l: any) => l.id !== id));
  const updateLine = (id: string, updated: any) => upd("lines", inv.lines.map((l: any) => l.id === id ? updated : l));

  const handleSave = async (status: string, stay = false): Promise<boolean> => {
    const number = (inv.number || "").trim();
    if (!number) { alert('Give this invoice a number.'); return false; }
    setSaving(true);
    let ok = false;
    try {
      if (await numberTaken("invoice", number, inv.id)) { alert(`${number} is already used by another invoice. Pick a different number.`); setSaving(false); return false; }
      const { error: invError } = await supabase.from('invoices').upsert({
        id: inv.id, number, status,
        client_name: inv.clientName, client_email: inv.clientEmail, client_phone: inv.clientPhone,
        issue_date: inv.issueDate, due_date: inv.dueDate, notes: inv.notes, tax_enabled: inv.taxEnabled,
      });
      if (invError) throw invError;
      await supabase.from('invoice_lines').delete().eq('invoice_id', inv.id);
      const { error: linesError } = await supabase.from('invoice_lines').insert(
        inv.lines.map((l: any, i: number) => ({ invoice_id: inv.id, description: l.description, qty: l.qty, unit: l.unit, rate: l.rate, sort_order: i }))
      );
      if (linesError) throw linesError;
      await recordNumber("invoice", number, !!inv.isNew);
      if (inv.isNew) setInv((p: any) => ({ ...p, isNew: false }));
      ok = true;
      if (!stay) onDone();
    } catch (err) { alert('Error saving.'); console.error(err); }
    setSaving(false);
    return ok;
  };

  const openPdf = async () => {
    if (await handleSave(inv.status, true)) window.location.href = `/doc?kind=invoice&id=${inv.id}`;
  };

  const isPaid = inv.status === "paid";

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: TEXT }}>
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onDone} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 22, padding: 0 }}>←</button>
          <Image src="/logo.png" alt="Gumers Landscaping" width={36} height={36} style={{ borderRadius: 6, objectFit: "contain" }} />
          <div>
            <NumberInput value={inv.number} onChange={v => upd("number", v)} />
            <div style={{ fontSize: 12, color: MUTED }}>Editing invoice</div>
          </div>
          <Badge status={inv.status} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onDone} style={btn("ghost")}>Discard</button>
          <button onClick={() => handleSave(inv.status)} disabled={saving} style={btn("secondary")}>{saving ? "Saving..." : "Save"}</button>
          <button onClick={openPdf} disabled={saving} style={btn("green")}>📄 PDF / Print</button>
          {isPaid
            ? <button onClick={() => handleSave("unpaid")} disabled={saving} style={btn("ghost")}>Mark Unpaid</button>
            : <button onClick={() => handleSave("paid")} disabled={saving} style={btn("primary")}>✓ Save & Mark Paid</button>}
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        <div>
          <Section title="Customer">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <LabeledInput label="Customer Name" value={inv.clientName} onChange={(v: string) => upd("clientName", v)} placeholder="John Smith or 123 Main St" />
              <LabeledInput label="Email" value={inv.clientEmail} onChange={(v: string) => upd("clientEmail", v)} placeholder="john@email.com" type="email" />
              <LabeledInput label="Phone" value={inv.clientPhone || ""} onChange={(v: string) => upd("clientPhone", v)} placeholder="+1 555 000 0000" type="tel" />
            </div>
          </Section>
          <Section title="Dates">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <LabeledInput label="Invoice Date" value={inv.issueDate} onChange={(v: string) => upd("issueDate", v)} type="date" />
              <LabeledInput label="Due Date" value={inv.dueDate} onChange={(v: string) => upd("dueDate", v)} type="date" />
            </div>
          </Section>
          <Section title="Line Items">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 110px 100px 32px", gap: 8, marginBottom: 8 }}>
              {["Description","Qty","Unit","Rate","Total",""].map((h,i) => (
                <div key={i} style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i >= 3 ? "center" : "left" }}>{h}</div>
              ))}
            </div>
            {inv.lines.map((l: any) => (
              <LineRow key={l.id} line={l} onChange={(updated: any) => updateLine(l.id, updated)} onRemove={() => removeLine(l.id)} canRemove={inv.lines.length > 1} />
            ))}
            <button onClick={addLine} style={{ ...btn("ghost"), fontSize: 13, marginTop: 8 }}>+ Add Line Item</button>
          </Section>
          <Section title="Notes & Terms">
            <textarea value={inv.notes} onChange={e => upd("notes", e.target.value)} placeholder="Payment due within 30 days." rows={3} style={{ ...iS(), width: "100%", resize: "vertical", lineHeight: 1.6 }} />
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
                <input type="checkbox" checked={inv.taxEnabled} onChange={e => upd("taxEnabled", e.target.checked)} style={{ accentColor: ACCENT }} />
                Tax (8%)
              </label>
              <span style={{ fontSize: 13, color: MUTED, fontFamily: "monospace" }}>{formatCurrency(tax)}</span>
            </div>
            <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: TEXT }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: ACCENT, fontFamily: "monospace" }}>{formatCurrency(total)}</span>
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", background: BG, borderRadius: 8, fontSize: 12, color: MUTED }}>
              📅 Due <strong style={{ color: TEXT }}>{formatDate(inv.dueDate)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Shared document data (estimates + invoices in one list) ----------

type Doc = {
  kind: "invoice" | "estimate";
  id: string;
  number: string;
  status: string;
  clientName: string;
  date: string;
  dueDate?: string;
  total: number;
  paid: number;
  overdue: boolean;
  raw: any;
};

const PAGE_SIZE = 30;

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD
}

// Supabase returns at most 1000 rows per request, so page through big tables.
async function fetchAll(table: string, orderBy?: string): Promise<any[]> {
  const out: any[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    let q = supabase.from(table).select('*');
    if (orderBy) q = q.order(orderBy, { ascending: false });
    const { data, error } = await q.range(from, from + size - 1);
    if (error) { console.error(error); break; }
    if (!data) break;
    out.push(...data);
    if (data.length < size) break;
  }
  return out;
}

function groupLines(rows: any[], key: string): Record<string, any[]> {
  const map: Record<string, any[]> = {};
  for (const l of rows) (map[l[key]] ||= []).push(l);
  for (const k in map) map[k].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return map;
}

function linesTotal(lines: any[], taxEnabled: boolean): number {
  const sub = lines.reduce((s: number, l: any) => s + (l.qty * l.rate || 0), 0);
  return taxEnabled ? sub * (1 + TAX_RATE) : sub;
}

async function loadDocs(): Promise<Doc[]> {
  const [ests, estLines, invs, invLines] = await Promise.all([
    fetchAll('estimates', 'created_at'),
    fetchAll('estimate_lines'),
    fetchAll('invoices', 'created_at'),
    fetchAll('invoice_lines'),
  ]);
  const estLineMap = groupLines(estLines, 'estimate_id');
  const invLineMap = groupLines(invLines, 'invoice_id');
  const today = todayStr();
  const mapLines = (ls: any[]) => ls.map((l: any) => ({ id: l.id, description: l.description, qty: l.qty, unit: l.unit, rate: l.rate }));

  const estimateDocs: Doc[] = ests.map((est: any) => {
    const lines = mapLines(estLineMap[est.id] || []);
    const raw = { id: est.id, number: est.number, status: est.status, clientName: est.client_name || "", clientEmail: est.client_email || "", clientPhone: est.client_phone || "", issueDate: est.issue_date, expiryDate: est.expiry_date, notes: est.notes || "", taxEnabled: est.tax_enabled, createdAt: est.created_at, lines: lines.length ? lines : [emptyLine()] };
    return { kind: "estimate", id: est.id, number: est.number, status: est.status, clientName: raw.clientName, date: est.issue_date || est.created_at, total: linesTotal(lines, est.tax_enabled), paid: 0, overdue: false, raw };
  });

  const invoiceDocs: Doc[] = invs.map((inv: any) => {
    const lines = mapLines(invLineMap[inv.id] || []);
    const raw = { id: inv.id, number: inv.number, status: inv.status, clientName: inv.client_name || "", clientEmail: inv.client_email || "", clientPhone: inv.client_phone || "", issueDate: inv.issue_date, dueDate: inv.due_date, notes: inv.notes || "", taxEnabled: inv.tax_enabled, createdAt: inv.created_at, lines: lines.length ? lines : [emptyLine()] };
    const total = linesTotal(lines, inv.tax_enabled);
    const isPaid = inv.status === "paid";
    const overdue = !isPaid && (inv.status === "overdue" || (!!inv.due_date && inv.due_date < today));
    return { kind: "invoice", id: inv.id, number: inv.number, status: inv.status, clientName: raw.clientName, date: inv.issue_date || inv.created_at, dueDate: inv.due_date, total, paid: isPaid ? total : 0, overdue, raw };
  });

  return [...invoiceDocs, ...estimateDocs].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

type Filter = "all" | "overdue" | "unpaid" | "paid" | "sent" | "draft";

function DocumentsTab({ onEditEstimate, onEditInvoice }: { onEditEstimate: (e: any) => void; onEditInvoice: (i: any) => void }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [showInvoices, setShowInvoices] = useState(true);
  const [showEstimates, setShowEstimates] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { (async () => { setLoading(true); setDocs(await loadDocs()); setLoading(false); })(); }, []);
  useEffect(() => { setPage(1); }, [filter, showInvoices, showEstimates, search]);

  const setPaid = async (doc: Doc, paid: boolean) => {
    const status = paid ? "paid" : "unpaid";
    const { error } = await supabase.from('invoices').update({ status }).eq('id', doc.id);
    if (error) { alert('Could not update. Try again.'); return; }
    setDocs(prev => prev.map(d => d.id === doc.id ? {
      ...d, status, paid: paid ? d.total : 0,
      overdue: !paid && !!d.dueDate && d.dueDate < todayStr(),
      raw: { ...d.raw, status },
    } : d));
  };

  const matchesFilter = (d: Doc, f: Filter) => {
    if (f === "all") return true;
    if (f === "overdue") return d.kind === "invoice" && d.overdue;
    if (f === "unpaid") return d.kind === "invoice" && d.status !== "paid";
    if (f === "paid") return d.kind === "invoice" && d.status === "paid";
    if (f === "sent") return d.kind === "estimate" && (d.status === "sent" || d.status === "viewed");
    if (f === "draft") return d.kind === "estimate" && d.status === "draft";
    return true;
  };

  const typeOk = (d: Doc) => (d.kind === "invoice" ? showInvoices : showEstimates);
  const q = search.trim().toLowerCase();
  const searchOk = (d: Doc) => !q || d.clientName.toLowerCase().includes(q) || (d.number || "").toLowerCase().includes(q);

  const counts: Record<Filter, number> = { all: 0, overdue: 0, unpaid: 0, paid: 0, sent: 0, draft: 0 };
  for (const d of docs) for (const f of Object.keys(counts) as Filter[]) if (matchesFilter(d, f)) counts[f]++;

  const filtered = docs.filter(d => matchesFilter(d, filter) && typeOk(d) && searchOk(d));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filteredInvoices = filtered.filter(d => d.kind === "invoice");
  const totalAmt = filteredInvoices.reduce((s, d) => s + d.total, 0);
  const paidAmt = filteredInvoices.reduce((s, d) => s + d.paid, 0);

  const FILTERS: { key: Filter; label: string; color: string }[] = [
    { key: "all",     label: "All Documents", color: "#60a5fa" },
    { key: "overdue", label: "Overdue",       color: "#f87171" },
    { key: "unpaid",  label: "Unpaid",        color: "#fb923c" },
    { key: "paid",    label: "Paid",          color: "#34d399" },
    { key: "sent",    label: "Estimates Sent", color: "#a78bfa" },
    { key: "draft",   label: "Drafts",        color: "#94a3b8" },
  ];

  const th = (align: "left" | "right" = "left"): React.CSSProperties => ({ padding: "10px 14px", textAlign: align, fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" });

  return (
    <div>
      {/* Status filters with counts */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "inherit",
              background: active ? PRIMARY : CARD, color: active ? TEXT : MUTED,
              border: `1px solid ${active ? ACCENT : BORDER}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: active ? 700 : 500,
            }}>
              {f.label}
              <span style={{ background: f.color, color: "#000", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 800 }}>{counts[f.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Type checkboxes + search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 18 }}>
          {[
            { label: "Invoice", checked: showInvoices, set: setShowInvoices },
            { label: "Estimate", checked: showEstimates, set: setShowEstimates },
          ].map(c => (
            <label key={c.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: MUTED, cursor: "pointer" }}>
              <input type="checkbox" checked={c.checked} onChange={e => c.set(e.target.checked)} style={{ accentColor: ACCENT }} />
              {c.label}
            </label>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or number…" style={{ ...iS(), width: 260, maxWidth: "100%" }} />
      </div>

      {/* Document list */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: MUTED }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
            <div style={{ fontWeight: 600, color: TEXT, marginBottom: 6 }}>{docs.length === 0 ? "No documents yet" : "Nothing matches this filter"}</div>
            {docs.length === 0 && <div style={{ fontSize: 13 }}>Use the + buttons above to create your first invoice or estimate.</div>}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th style={th()}>Customer</th>
                  <th style={th()}>Document</th>
                  <th style={th()}>Number</th>
                  <th style={th()}>Date</th>
                  <th style={th("right")}>Paid</th>
                  <th style={th("right")}>Total</th>
                  <th style={th("right")}></th>
                </tr>
              </thead>
              <tbody>
                {shown.map(d => (
                  <tr key={`${d.kind}-${d.id}`}
                    onClick={() => d.kind === "estimate" ? onEditEstimate({ ...d.raw }) : onEditInvoice({ ...d.raw })}
                    style={{ borderBottom: `1px solid ${BG}`, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <td style={{ padding: "12px 14px", fontWeight: 600, fontSize: 14, color: TEXT, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.clientName || <span style={{ color: MUTED }}>No customer</span>}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: MUTED, whiteSpace: "nowrap" }}>
                      <span style={{ marginRight: 8 }}>{d.kind === "invoice" ? "Invoice" : "Estimate"}</span>
                      <Badge status={d.overdue ? "overdue" : d.status} />
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: ACCENT, fontSize: 13 }}>{d.number}</td>
                    <td style={{ padding: "12px 14px", fontSize: 13, color: MUTED, whiteSpace: "nowrap" }}>{d.date ? formatDate(d.date) : "—"}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontFamily: "monospace", fontSize: 13, color: d.paid > 0 ? "#34d399" : MUTED }}>
                      {d.kind === "invoice" ? formatCurrency(d.paid) : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700, fontFamily: "monospace", fontSize: 14, color: TEXT }}>{formatCurrency(d.total)}</td>
                    <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <a href={`/doc?kind=${d.kind}&id=${d.id}`} onClick={e => e.stopPropagation()} style={{ ...btn("ghost"), padding: "4px 10px", fontSize: 12, textDecoration: "none", marginRight: 6 }}>📄 PDF</a>
                      {d.kind === "invoice" && (d.status === "paid"
                        ? <button onClick={e => { e.stopPropagation(); setPaid(d, false); }} style={{ ...btn("ghost"), padding: "4px 10px", fontSize: 12 }}>Undo Paid</button>
                        : <button onClick={e => { e.stopPropagation(); setPaid(d, true); }} style={{ ...btn("green"), padding: "4px 10px", fontSize: 12 }}>✓ Mark Paid</button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals, like InvoiceHome's footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ borderTop: `1px solid ${BORDER}`, padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { label: "Total", value: totalAmt, color: TEXT },
              { label: "Paid Amount", value: paidAmt, color: "#34d399" },
              { label: "Balance Due", value: totalAmt - paidAmt, color: ACCENT },
            ].map(t => (
              <div key={t.label}>
                <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: t.color, fontFamily: "monospace" }}>{formatCurrency(t.value)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 16 }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ ...btn("ghost"), opacity: page === 1 ? 0.4 : 1 }}>← Previous</button>
          <span style={{ fontSize: 13, color: MUTED }}>Page {page} of {pages}</span>
          <button disabled={page === pages} onClick={() => setPage(p => p + 1)} style={{ ...btn("ghost"), opacity: page === pages ? 0.4 : 1 }}>Next →</button>
        </div>
      )}
    </div>
  );
}

function ClientsTab() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const openNew = () => { setForm({ name: "", email: "", phone: "", address: "", notes: "" }); setEditing("new"); };
  const openEdit = (c: any) => { setForm({ name: c.name, email: c.email || "", phone: c.phone || "", address: c.address || "", notes: c.notes || "" }); setEditing(c.id); };

  const handleSave = async () => {
    if (!form.name) { alert('Name is required!'); return; }
    setSaving(true);
    if (editing === "new") {
      await supabase.from('clients').insert({ name: form.name, email: form.email, phone: form.phone, address: form.address, notes: form.notes });
    } else {
      await supabase.from('clients').update({ name: form.name, email: form.email, phone: form.phone, address: form.address, notes: form.notes }).eq('id', editing);
    }
    setSaving(false);
    setEditing(null);
    loadClients();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('clients').delete().eq('id', id);
    setClients(prev => prev.filter(c => c.id !== id));
  };

  if (editing) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 22, padding: 0 }}>←</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>{editing === "new" ? "New Client" : "Edit Client"}</div>
      </div>
      <div style={{ maxWidth: 600 }}>
        <Section title="Client Info">
          <div style={{ display: "grid", gap: 12 }}>
            <LabeledInput label="Name *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="John Smith" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <LabeledInput label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="john@email.com" type="email" />
              <LabeledInput label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="+1 555 000 0000" type="tel" />
            </div>
            <LabeledInput label="Address" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="123 Main St, Chicago, IL" />
            <div>
              <label style={{ display: "block", fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes about this client..." rows={3} style={{ ...iS(), width: "100%", resize: "vertical", lineHeight: 1.6 }} />
            </div>
          </div>
        </Section>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setEditing(null)} style={btn("ghost")}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={btn("primary")}>{saving ? "Saving..." : "Save Client"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Clients <span style={{ fontSize: 13, color: MUTED, fontWeight: 400 }}>({clients.length})</span></div>
        <button onClick={openNew} style={{ ...btn("primary"), fontSize: 14, padding: "10px 20px" }}>+ New Client</button>
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: MUTED }}>Loading...</div>
        ) : clients.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontWeight: 600, color: TEXT, marginBottom: 6 }}>No clients yet</div>
            <button onClick={openNew} style={{ ...btn("primary"), margin: "20px auto 0" }}>+ Add First Client</button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {["Name","Email","Phone","Address",""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 16px", textAlign: i >= 4 ? "right" : "left", fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} onClick={() => openEdit(c)} style={{ borderBottom: `1px solid ${BG}`, cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = BG}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: TEXT }}>{c.name}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: MUTED }}>{c.email || "—"}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: MUTED }}>{c.phone || "—"}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: MUTED }}>{c.address || "—"}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }} style={{ ...btn("danger"), padding: "4px 10px", fontSize: 12 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ReportsTab() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => { setLoading(true); setDocs(await loadDocs()); setLoading(false); })(); }, []);

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: MUTED }}>Loading...</div>;

  const invoices = docs.filter(d => d.kind === "invoice");
  const openEstimates = docs.filter(d => d.kind === "estimate" && !["accepted", "declined"].includes(d.status));
  const invoiced = invoices.reduce((s, d) => s + d.total, 0);
  const collected = invoices.reduce((s, d) => s + d.paid, 0);
  const overdueAmt = invoices.filter(d => d.overdue).reduce((s, d) => s + d.total, 0);

  // Last 12 months, newest first
  const months: { key: string; label: string; invoiced: number; collected: number; count: number }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    months.push({ key, label: dt.toLocaleDateString("en-US", { month: "short", year: "numeric" }), invoiced: 0, collected: 0, count: 0 });
  }
  for (const d of invoices) {
    const m = months.find(m => (d.date || "").startsWith(m.key));
    if (m) { m.invoiced += d.total; m.collected += d.paid; m.count++; }
  }
  const maxMonth = Math.max(1, ...months.map(m => m.invoiced));

  // Top customers by amount invoiced
  const byCustomer: Record<string, { name: string; total: number; due: number; count: number }> = {};
  for (const d of invoices) {
    const name = d.clientName || "No customer";
    const c = (byCustomer[name] ||= { name, total: 0, due: 0, count: 0 });
    c.total += d.total; c.due += d.total - d.paid; c.count++;
  }
  const topCustomers = Object.values(byCustomer).sort((a, b) => b.total - a.total).slice(0, 10);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Invoiced", value: formatCurrency(invoiced), icon: "🧾" },
          { label: "Collected", value: formatCurrency(collected), icon: "✅" },
          { label: "Balance Due", value: formatCurrency(invoiced - collected), icon: "⏳" },
          { label: "Overdue", value: formatCurrency(overdueAmt), icon: "⚠️" },
          { label: `Open Estimates (${openEstimates.length})`, value: formatCurrency(openEstimates.reduce((s, d) => s + d.total, 0)), icon: "📋" },
        ].map((s, i) => (
          <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <Section title="Invoiced by Month (last 12 months)">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {months.map(m => (
            <div key={m.key} style={{ display: "grid", gridTemplateColumns: "80px 1fr 110px", gap: 12, alignItems: "center" }}>
              <div style={{ fontSize: 12, color: MUTED }}>{m.label}</div>
              <div style={{ background: BG, borderRadius: 6, height: 18, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, width: `${(m.invoiced / maxMonth) * 100}%`, background: PRIMARY, borderRadius: 6 }} />
                <div style={{ position: "absolute", inset: 0, width: `${(m.collected / maxMonth) * 100}%`, background: ACCENT, borderRadius: 6 }} />
              </div>
              <div style={{ fontSize: 13, color: TEXT, fontFamily: "monospace", textAlign: "right" }}>{formatCurrency(m.invoiced)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: MUTED }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: ACCENT, borderRadius: 2, marginRight: 6 }} />Collected</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: PRIMARY, border: `1px solid ${BORDER}`, borderRadius: 2, marginRight: 6 }} />Invoiced</span>
        </div>
      </Section>

      <Section title="Top Customers">
        {topCustomers.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 13 }}>No invoices yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Customer", "Invoices", "Total", "Balance Due"].map((h, i) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: i === 0 ? "left" : "right", fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.map(c => (
                  <tr key={c.name} style={{ borderBottom: `1px solid ${BG}` }}>
                    <td style={{ padding: "10px", fontSize: 14, color: TEXT, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: "10px", fontSize: 13, color: MUTED, textAlign: "right" }}>{c.count}</td>
                    <td style={{ padding: "10px", fontSize: 13, color: TEXT, textAlign: "right", fontFamily: "monospace" }}>{formatCurrency(c.total)}</td>
                    <td style={{ padding: "10px", fontSize: 13, color: c.due > 0 ? ACCENT : MUTED, textAlign: "right", fontFamily: "monospace" }}>{formatCurrency(c.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}

function AdminTab() {
  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setPending((data || []).filter((p: any) => !p.approved));
    setApproved((data || []).filter((p: any) => p.approved));
    setLoading(false);
  };

  const approveUser = async (id: string) => {
    await supabase.from('profiles').update({ approved: true }).eq('id', id);
    loadProfiles();
  };

  const revokeUser = async (id: string) => {
    await supabase.from('profiles').update({ approved: false }).eq('id', id);
    loadProfiles();
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: MUTED }}>Loading...</div>;

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 24 }}>
        Admin <span style={{ fontSize: 13, color: MUTED, fontWeight: 400 }}>— approve new signups</span>
      </div>

      <Section title={`Pending Approval (${pending.length})`}>
        {pending.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 13 }}>No one waiting right now.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map((p: any) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: BG, borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: TEXT, fontSize: 14 }}>{p.email || p.id}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>Signed up {p.created_at ? formatDate(p.created_at) : ""}</div>
                </div>
                <button onClick={() => approveUser(p.id)} style={{ ...btn("primary"), fontSize: 12, padding: "6px 14px" }}>✓ Approve</button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Approved Users (${approved.length})`}>
        {approved.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 13 }}>No approved users yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {approved.map((p: any) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: BG, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, color: TEXT, fontSize: 14 }}>{p.email || p.id}</div>
                {p.email !== OWNER_EMAIL && (
                  <button onClick={() => revokeUser(p.id)} style={{ ...btn("danger"), fontSize: 12, padding: "6px 14px" }}>Revoke</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// Shows iPhone/iPad users how to put CotizaFlow on their home screen, until they do it or close the tip.
function InstallTip() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    let dismissed = false;
    try { dismissed = localStorage.getItem("cf-install-tip-dismissed") === "1"; } catch { /* storage blocked */ }
    setShow(isIOS && !standalone && !dismissed);
  }, []);

  if (!show) return null;

  const close = () => {
    setShow(false);
    try { localStorage.setItem("cf-install-tip-dismissed", "1"); } catch { /* storage blocked */ }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: CARD, border: `1px solid ${ACCENT}55`, borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
      <Image src="/apple-touch-icon.png" alt="" width={40} height={40} style={{ borderRadius: 9 }} />
      <div style={{ flex: 1, fontSize: 13, color: TEXT, lineHeight: 1.45 }}>
        <strong>Install CotizaFlow on your iPhone.</strong>{" "}
        <span style={{ color: MUTED }}>In Safari, tap the Share button <span style={{ whiteSpace: "nowrap" }}>(□↑)</span>, then <strong style={{ color: TEXT }}>Add to Home Screen</strong>.</span>
      </div>
      <button onClick={close} aria-label="Close" style={{ background: "none", border: "none", color: MUTED, fontSize: 20, cursor: "pointer", padding: 4 }}>×</button>
    </div>
  );
}

// ---------- Billing: 14-day free trial, then CotizaFlow Pro through Stripe ----------

const TRIAL_DAYS = 14;
const PRICE_LABEL = "$19/month";

type Access = {
  state: "owner" | "open" | "active" | "trial" | "past_due" | "locked";
  daysLeft: number;
  status: string;
  periodEnd: string | null;
  hasCustomer: boolean;
};

// billing comes from /api/billing/status, which asks Stripe directly.
function getAccess(profile: any, isAdmin: boolean, billing: any): Access {
  const status = billing?.status || "";
  const periodEnd = billing?.periodEnd || null;
  const hasCustomer = !!billing?.hasCustomer;
  const created = profile?.created_at ? new Date(profile.created_at).getTime() : Date.now();
  const daysLeft = Math.max(0, Math.ceil((created + TRIAL_DAYS * 86400000 - Date.now()) / 86400000));
  const base = { daysLeft, status, periodEnd, hasCustomer };
  if (isAdmin) return { state: "owner", ...base };
  // Billing not set up yet, or Stripe couldn't be reached: never lock anyone out.
  if (!billing || billing.configured === false || billing.error) return { state: "open", ...base };
  if (status === "active" || status === "trialing") return { state: "active", ...base };
  if (status === "past_due") return { state: "past_due", ...base };
  if (daysLeft > 0) return { state: "trial", ...base };
  return { state: "locked", ...base };
}

// Asks our server for a Stripe page (checkout or billing management) and goes there.
async function goToStripe(kind: "checkout" | "portal") {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`/api/billing/${kind}`, { method: "POST", headers: { Authorization: `Bearer ${session?.access_token || ""}` } });
  const out = await res.json().catch(() => ({}));
  if (res.ok && out.url) { window.location.href = out.url; return; }
  alert(out.error || "Something went wrong. Try again.");
}

function SubscribeButton({ label = `Subscribe — ${PRICE_LABEL}`, big = false }: { label?: string; big?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <button disabled={busy} onClick={async () => { setBusy(true); await goToStripe("checkout"); setBusy(false); }}
      style={{ ...btn("primary"), ...(big ? { fontSize: 16, padding: "14px 28px" } : {}) }}>
      {busy ? "Opening checkout…" : label}
    </button>
  );
}

function BillingBanner({ access, onOpen }: { access: Access; onOpen: () => void }) {
  if (access.state === "trial") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 14px", marginBottom: 20, fontSize: 13 }}>
      <span style={{ color: MUTED }}>🎁 <strong style={{ color: TEXT }}>{access.daysLeft} {access.daysLeft === 1 ? "day" : "days"} left</strong> in your free trial.</span>
      <button onClick={onOpen} style={{ ...btn("ghost"), padding: "5px 12px", fontSize: 12 }}>See plan</button>
    </div>
  );
  if (access.state === "past_due") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: "#431407", border: "1px solid #fb923c55", borderRadius: 12, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#fed7aa" }}>
      <span>⚠️ Your last payment didn&apos;t go through. Update your card to keep CotizaFlow running.</span>
      <button onClick={() => goToStripe("portal")} style={{ ...btn("primary"), padding: "5px 12px", fontSize: 12 }}>Update card</button>
    </div>
  );
  return null;
}

function BillingTab({ access }: { access: Access }) {
  const statusText: Record<Access["state"], string> = {
    owner: "Owner account — always free",
    open: "Free access",
    active: access.status === "trialing" ? "CotizaFlow Pro — trial, card on file" : "CotizaFlow Pro — active",
    trial: `Free trial — ${access.daysLeft} ${access.daysLeft === 1 ? "day" : "days"} left`,
    past_due: "Payment failed — please update your card",
    locked: "Trial ended",
  };
  return (
    <div style={{ maxWidth: 560 }}>
      <Section title="Your Plan">
        <div style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 6 }}>{statusText[access.state]}</div>
        {access.periodEnd && access.state !== "owner" && (
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 6 }}>
            {access.status === "canceled" ? "Ended" : access.status === "trialing" ? "First charge on" : "Renews on"} {formatDate(access.periodEnd)}
          </div>
        )}
        {access.state !== "owner" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            {(access.state === "trial" || access.state === "locked") && <SubscribeButton />}
            {access.hasCustomer && <button onClick={() => goToStripe("portal")} style={btn("secondary")}>Manage billing & receipts</button>}
          </div>
        )}
        {access.state === "owner" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 12, lineHeight: 1.6 }}>
              This is what landscapers see. Use the button to open the real Stripe checkout page. While Stripe is in test mode, use card 4242 4242 4242 4242 (any future date, any CVC). No real money moves.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <SubscribeButton label="Preview the checkout" />
              <button onClick={() => goToStripe("portal")} style={btn("secondary")}>Preview Manage billing</button>
            </div>
          </div>
        )}
      </Section>
      <Section title="CotizaFlow Pro">
        <div style={{ fontSize: 28, fontWeight: 900, color: TEXT }}>{PRICE_LABEL.split("/")[0]}<span style={{ fontSize: 14, color: MUTED, fontWeight: 500 }}> / month</span></div>
        {["Unlimited invoices & estimates", "PDF, print & email to clients", "Your logo, colors & wording", "Reports & mark-paid tracking", "Cancel anytime"].map(f => (
          <div key={f} style={{ fontSize: 14, color: MUTED, marginTop: 8 }}><span style={{ color: ACCENT, marginRight: 8 }}>→</span>{f}</div>
        ))}
        {access.state === "trial" && <div style={{ fontSize: 12, color: MUTED, marginTop: 14 }}>Subscribe now and you won&apos;t be charged until your free trial ends.</div>}
      </Section>
    </div>
  );
}

function Paywall({ email }: { email: string }) {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Segoe UI', sans-serif", color: TEXT }}>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 36, maxWidth: 440, width: "100%", textAlign: "center" }}>
        <Image src="/logo.png" alt="CotizaFlow" width={64} height={64} style={{ borderRadius: 12, objectFit: "contain", display: "block", margin: "0 auto 14px" }} />
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Your free trial has ended</div>
        <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>
          Subscribe to CotizaFlow Pro for {PRICE_LABEL} to keep sending estimates and invoices. Everything you made is saved and waiting.
        </div>
        <SubscribeButton big />
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20, fontSize: 13 }}>
          <button onClick={() => goToStripe("portal")} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontFamily: "inherit" }}>Manage billing</button>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontFamily: "inherit" }}>Sign out ({email})</button>
        </div>
      </div>
    </div>
  );
}

type Tab = "documents" | "customers" | "reports" | "billing" | "admin";

export default function App() {
  const [tab, setTab] = useState<Tab>("documents");
  const [editingEstimate, setEditingEstimate] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [billingNote, setBillingNote] = useState("");
  const [billing, setBilling] = useState<any>(null);

  useEffect(() => { checkAuth(); }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data;
  };

  const loadBilling = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/billing/status', { headers: { Authorization: `Bearer ${session?.access_token || ""}` } });
      return await res.json();
    } catch { return { error: "unavailable" }; }
  };

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return; }
    const prof = await loadProfile(user.id);
    if (!prof?.approved) { await supabase.auth.signOut(); window.location.href = '/login'; return; }
    setUserEmail(user.email || "");
    setProfile(prof);
    if (user.email !== OWNER_EMAIL) setBilling(await loadBilling());
    setAuthChecked(true);

    // Coming back from Stripe checkout: confirm the subscription with Stripe.
    const back = new URLSearchParams(window.location.search).get("billing");
    if (back) {
      window.history.replaceState(null, "", "/dashboard");
      if (back === "canceled") { setBillingNote("Checkout canceled. You weren't charged."); return; }
      setBillingNote("Thanks! Finishing your subscription…");
      for (let i = 0; i < 6; i++) {
        const b = await loadBilling();
        if (b?.status === "active" || b?.status === "trialing") { setBilling(b); setBillingNote("🎉 You're subscribed to CotizaFlow Pro. Thank you!"); return; }
        await new Promise(r => setTimeout(r, 2000));
      }
      setBillingNote("Payment received. Your plan will update in a minute — refresh if it doesn't.");
    }
  }

  const isAdmin = userEmail === OWNER_EMAIL;
  const access = getAccess(profile, isAdmin, billing);

  if (!authChecked) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontFamily: "sans-serif" }}>Loading...</div>
  );

  if (access.state === "locked") return <Paywall email={userEmail} />;

  if (editingEstimate) return (
    <EstimateEditor estimate={editingEstimate} onSave={() => { setEditingEstimate(null); setTab("documents"); }} onCancel={() => setEditingEstimate(null)} />
  );

  if (editingInvoice) return (
    <InvoiceEditor invoice={editingInvoice} onDone={() => { setEditingInvoice(null); setTab("documents"); }} />
  );

  const createLinks = [
    { label: "Invoice", onClick: async () => setEditingInvoice({ ...defaultInvoice(), number: await nextNumber("invoice"), isNew: true }) },
    { label: "Estimate", onClick: async () => setEditingEstimate({ ...defaultEstimate(), number: await nextNumber("estimate"), isNew: true }) },
    { label: "Customer", onClick: () => setTab("customers") },
  ];

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: TEXT }}>
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Image src="/logo.png" alt="CotizaFlow" width={44} height={44} style={{ borderRadius: 10, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>CotizaFlow</div>
            <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{userEmail}</div>
          </div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} style={{ ...btn("ghost"), fontSize: 12, whiteSpace: "nowrap" }}>Sign Out</button>
      </div>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 16px 48px" }}>
        <InstallTip />
        {billingNote && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, background: PRIMARY, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: TEXT }}>
            <span>{billingNote}</span>
            <button onClick={() => setBillingNote("")} aria-label="Close" style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 18, padding: 0 }}>×</button>
          </div>
        )}
        <BillingBanner access={access} onOpen={() => setTab("billing")} />

        {/* Create bar: green + then document types, like InvoiceHome */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#22c55e", color: "#000", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, lineHeight: 1 }}>+</span>
          {createLinks.map((l, i) => (
            <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              {i > 0 && <span style={{ color: BORDER }}>·</span>}
              <button onClick={l.onClick} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: ACCENT, fontSize: 16, fontWeight: 700, padding: 0 }}>{l.label}</button>
            </span>
          ))}
        </div>

        {/* Main tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${BORDER}`, marginBottom: 20 }}>
          {([
            { key: "documents", label: "📄 My Documents" },
            { key: "customers", label: "👥 My Customers" },
            { key: "reports",   label: "📊 My Reports" },
            { key: "billing", label: "💳 Billing" },
            ...(isAdmin ? [{ key: "admin", label: "🛡️ Admin" }] : []),
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: tab === t.key ? CARD : "transparent", cursor: "pointer", fontFamily: "inherit",
              border: `1px solid ${tab === t.key ? BORDER : "transparent"}`, borderBottom: tab === t.key ? `2px solid ${ACCENT}` : "2px solid transparent",
              borderRadius: "8px 8px 0 0", padding: "10px 16px", fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? ACCENT : MUTED, marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {tab === "documents" && <DocumentsTab onEditEstimate={setEditingEstimate} onEditInvoice={setEditingInvoice} />}
        {tab === "customers" && <ClientsTab />}
        {tab === "reports" && <ReportsTab />}
        {tab === "billing" && <BillingTab access={access} />}
        {tab === "admin" && isAdmin && <AdminTab />}
      </div>
    </div>
  );
}
