'use client'

import { supabase } from '../lib/supabase'
import { useState, useEffect } from "react";

const TAX_RATE = 0.08;

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function formatCurrency(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_META = {
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
  clientId: null,
  clientName: "",
  clientEmail: "",
  issueDate: new Date().toISOString().split("T")[0],
  expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  lines: [emptyLine()],
  notes: "",
  taxEnabled: true,
  createdAt: new Date().toISOString(),
});

function Badge({ status }: any) {
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

function LineRow({ line, onChange, onRemove, canRemove }: any) {
  const total = (line.qty || 0) * (line.rate || 0);
  const update = (k, v) => onChange({ ...line, [k]: v });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 110px 100px 32px", gap: 8, alignItems: "center", marginBottom: 6 }}>
      <input placeholder="Description…" value={line.description} onChange={e => update("description", e.target.value)} style={iS()} />
      <input type="number" min="0" value={line.qty} onChange={e => update("qty", parseFloat(e.target.value) || 0)} style={iS({ center: true })} />
      <select value={line.unit} onChange={e => update("unit", e.target.value)} style={iS({ center: true })}>
        {["hr","day","unit","item","flat","mo"].map(u => <option key={u}>{u}</option>)}
      </select>
      <input type="number" min="0" step="0.01" value={line.rate} onChange={e => update("rate", parseFloat(e.target.value) || 0)} style={iS({ center: true })} placeholder="0.00" />
      <div style={{ textAlign: "right", fontWeight: 600, color: "#e2e8f0", fontSize: 14, fontFamily: "monospace" }}>{formatCurrency(total)}</div>
      <button onClick={onRemove} disabled={!canRemove} style={{ background: "none", border: "none", cursor: canRemove ? "pointer" : "default", color: canRemove ? "#f87171" : "#334155", fontSize: 20, padding: 0 }}>×</button>
    </div>
  );
}

function iS({ center }: any = {}) {
  return {
    background: "#0f172a", border: "1px solid #334155", borderRadius: 8,
    color: "#e2e8f0", padding: "8px 10px", fontSize: 13,
    fontFamily: "inherit", outline: "none",
    textAlign: center ? "center" : "left", width: "100%", boxSizing: "border-box",
  };
}

function btn(variant) {
  const base: any = { border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" };
  if (variant === "primary")   return { ...base, background: "#6366f1", color: "#fff" };
  if (variant === "secondary") return { ...base, background: "#1e293b", color: "#94a3b8", border: "1px solid #334155" };
  if (variant === "ghost")     return { ...base, background: "transparent", color: "#64748b", border: "1px solid #334155" };
  if (variant === "danger")    return { ...base, background: "#450a0a", color: "#f87171", border: "1px solid #f8717133" };
  return base;
}

function Section({ title, children }: any) {
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{ ...iS(), width: "100%", boxSizing: "border-box" }} />
    </div>
  );
}

function EstimateEditor({ estimate, onSave, onCancel }: any) {
  const [est, setEst] = useState(estimate);
  const [saving, setSaving] = useState(false);
  const upd = (k, v) => setEst(p => ({ ...p, [k]: v }));

  const subtotal = est.lines.reduce((s, l) => s + (l.qty * l.rate || 0), 0);
  const tax = est.taxEnabled ? subtotal * TAX_RATE : 0;
  const total = subtotal + tax;

  const addLine = () => upd("lines", [...est.lines, emptyLine()]);
  const removeLine = id => upd("lines", est.lines.filter(l => l.id !== id));
  const updateLine = (id, updated) => upd("lines", est.lines.map(l => l.id === id ? updated : l));

  const handleSave = async (status) => {
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
          issue_date: est.issueDate,
          expiry_date: est.expiryDate,
          notes: est.notes,
          tax_enabled: est.taxEnabled,
        });

      if (estError) throw estError;

      await supabase.from('estimate_lines').delete().eq('estimate_id', est.id);

      const lines = est.lines.map((l, i) => ({
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

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: "#e2e8f0" }}>
      <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 22, padding: 0 }}>←</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>{est.number}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Editing estimate</div>
          </div>
          <Badge status={est.status} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={btn("ghost")}>Discard</button>
          <button onClick={() => handleSave("draft")} disabled={saving} style={btn("secondary")}>{saving ? "Saving..." : "Save Draft"}</button>
          <button onClick={() => handleSave("sent")} disabled={saving} style={btn("primary")}>{saving ? "Saving..." : "Send Estimate →"}</button>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}>
        <div>
          <Section title="Client">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <LabeledInput label="Client Name" value={est.clientName} onChange={v => upd("clientName", v)} placeholder="Acme Corp" />
              <LabeledInput label="Client Email" value={est.clientEmail} onChange={v => upd("clientEmail", v)} placeholder="billing@client.com" type="email" />
            </div>
          </Section>

          <Section title="Dates">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <LabeledInput label="Issue Date" value={est.issueDate} onChange={v => upd("issueDate", v)} type="date" />
              <LabeledInput label="Expiry Date" value={est.expiryDate} onChange={v => upd("expiryDate", v)} type="date" />
            </div>
          </Section>

          <Section title="Line Items">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 110px 100px 32px", gap: 8, marginBottom: 8 }}>
              {["Description","Qty","Unit","Rate","Total",""].map((h,i) => (
                <div key={i} style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i >= 3 ? "center" : "left" }}>{h}</div>
              ))}
            </div>
            {est.lines.map(l => (
              <LineRow key={l.id} line={l} onChange={updated => updateLine(l.id, updated)} onRemove={() => removeLine(l.id)} canRemove={est.lines.length > 1} />
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
          <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20, position: "sticky", top: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Summary</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Subtotal</span>
              <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={est.taxEnabled} onChange={e => upd("taxEnabled", e.target.checked)} style={{ accentColor: "#6366f1" }} />
                Tax (8%)
              </label>
              <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>{formatCurrency(tax)}</span>
            </div>
            <div style={{ borderTop: "1px solid #334155", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "#f1f5f9" }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 22, color: "#6366f1", fontFamily: "monospace" }}>{formatCurrency(total)}</span>
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => handleSave("sent")} disabled={saving} style={{ ...btn("primary"), width: "100%", justifyContent: "center" }}>{saving ? "Saving..." : "Send to Client →"}</button>
              <button onClick={() => handleSave("draft")} disabled={saving} style={{ ...btn("secondary"), width: "100%", justifyContent: "center" }}>{saving ? "Saving..." : "Save as Draft"}</button>
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", background: "#0f172a", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
              📅 Valid until <strong style={{ color: "#94a3b8" }}>{formatDate(est.expiryDate)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EstimateList({ estimates, onNew, onEdit, onDelete, loading }: any) {
  const totalValue = estimates.reduce((s, e) => {
    const sub = e.lines.reduce((ls, l) => ls + (l.qty * l.rate || 0), 0);
    return s + (e.taxEnabled ? sub * (1 + TAX_RATE) : sub);
  }, 0);
  const accepted = estimates.filter(e => e.status === "accepted").length;

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: "#e2e8f0" }}>
      <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
            <span style={{ color: "#6366f1" }}>◈</span> EstimateFlow
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Estimates & Quotes</div>
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
            <div key={i} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", fontFamily: "monospace" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "#f1f5f9" }}>All Estimates</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>{estimates.length} total</span>
          </div>

          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Loading estimates...</div>
          ) : estimates.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No estimates yet</div>
              <div style={{ fontSize: 13 }}>Create your first estimate to get started</div>
              <button onClick={onNew} style={{ ...btn("primary"), margin: "20px auto 0" }}>+ New Estimate</button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  {["Number","Client","Issue Date","Expiry","Total","Status",""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 16px", textAlign: i >= 4 ? "right" : "left", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estimates.map(est => {
                  const sub = est.lines.reduce((s, l) => s + (l.qty * l.rate || 0), 0);
                  const tot = est.taxEnabled ? sub * (1 + TAX_RATE) : sub;
                  return (
                    <tr key={est.id} onClick={() => onEdit(est)}
                      style={{ borderBottom: "1px solid #0f172a", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#0f172a"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#6366f1", fontSize: 13 }}>{est.number}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{est.clientName || <span style={{ color: "#475569" }}>No client</span>}</div>
                        {est.clientEmail && <div style={{ fontSize: 11, color: "#64748b" }}>{est.clientEmail}</div>}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8" }}>{formatDate(est.issueDate)}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8" }}>{formatDate(est.expiryDate)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, fontFamily: "monospace", fontSize: 14 }}>{formatCurrency(tot)}</td>
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
  const [estimates, setEstimates] = useState([]);
  const [editing, setEditing] = useState(null);
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
        issueDate: est.issue_date,
        expiryDate: est.expiry_date,
        notes: est.notes || "",
        taxEnabled: est.tax_enabled,
        createdAt: est.created_at,
        lines: (lines || []).map(l => ({
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

  const handleSave = (est) => {
    setEstimates(prev => {
      const exists = prev.find(e => e.id === est.id);
      return exists ? prev.map(e => e.id === est.id ? est : e) : [est, ...prev];
    });
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await supabase.from('estimates').delete().eq('id', id);
    setEstimates(prev => prev.filter(e => e.id !== id));
  };

  if (editing) return <EstimateEditor estimate={editing} onSave={handleSave} onCancel={() => setEditing(null)} />;
  return <EstimateList estimates={estimates} loading={loading} onNew={() => setEditing(defaultEstimate())} onEdit={e => setEditing({ ...e })} onDelete={handleDelete} />;
}