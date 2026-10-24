'use client'

import { supabase } from '../../lib/supabase'
import { useEffect, useRef, useState } from 'react'

// ---------- Types & helpers ----------

type Kind = 'invoice' | 'estimate'
type TemplateKey = 'classic' | 'greengold' | 'clean'

type Business = {
  name: string
  address1: string
  address2: string
  phone: string
  email: string
  website: string
  logoUrl: string
  terms: string
}

type Line = { description: string; qty: number; unit: string; rate: number }

// Per-account wording, colors and show/hide choices for the templates. Blank = template default.
type Custom = {
  invoiceTitle: string
  estimateTitle: string
  billTo: string
  colDesc: string
  colQty: string
  colRate: string
  colAmount: string
  thankYou: string
  footer: string
  titleColor: string
  lineColor: string
  showQtyRate: boolean
  showTerms: boolean
  showThankYou: boolean
  showPaidStamp: boolean
}

const DEFAULT_CUSTOM: Custom = {
  invoiceTitle: '', estimateTitle: '', billTo: '', colDesc: '', colQty: '', colRate: '', colAmount: '',
  thankYou: '', footer: '', titleColor: '', lineColor: '',
  showQtyRate: true, showTerms: true, showThankYou: true, showPaidStamp: true,
}

type DocData = {
  kind: Kind
  id: string
  number: string
  status: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  issueDate: string
  dueDate: string
  notes: string
  taxEnabled: boolean
  lines: Line[]
}

const OWNER_EMAIL = 'gumerslandscaping@gmail.com'
const TAX_RATE = 0.08

const EMPTY_BUSINESS: Business = { name: '', address1: '', address2: '', phone: '', email: '', website: '', logoUrl: '', terms: '' }

// Prefill for the owner account so the first PDF already looks right.
const OWNER_DEFAULT: Business = {
  name: "Gumer's Landscaping",
  address1: '870 E Lilly Ln',
  address2: 'Palatine, IL 60074',
  phone: '224-440-6704',
  email: 'gumerslandscaping@gmail.com',
  website: 'gumerslandscape.com',
  logoUrl: '/logo.png',
  terms: 'Payment is due within 30 days. Pay by check to Gumers Landscaping at 870 E Lilly Ln, Palatine, IL 60074, or by Zelle to gumerslandscaping@gmail.com.',
}

const TEMPLATES: Record<TemplateKey, {
  label: string
  title: string       // big INVOICE / ESTIMATE heading color
  rule: string        // table header / rule color
  headBg: string      // table header background
  headText: string
  band?: string       // optional colored header band
  bandText?: string
  zebra: string
  titleFont: string
}> = {
  classic: {
    label: 'Classic (navy & red)',
    title: '#1f2a5a', rule: '#c0392b', headBg: '#ffffff', headText: '#1f2a5a', zebra: '#ffffff',
    titleFont: "'Arial Narrow', 'Roboto Condensed', 'Helvetica Neue', Arial, sans-serif",
  },
  greengold: {
    label: 'Green & Gold',
    title: '#f5a623', rule: '#1a4a1a', headBg: '#1a4a1a', headText: '#ffffff', band: '#1a4a1a', bandText: '#fbf8ef', zebra: '#fbf8ef',
    titleFont: "'Helvetica Neue', Arial, sans-serif",
  },
  clean: {
    label: 'Clean (black & gray)',
    title: '#111111', rule: '#111111', headBg: '#f3f4f6', headText: '#111111', zebra: '#fafafa',
    titleFont: "'Helvetica Neue', Arial, sans-serif",
  },
}

function money(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
}

function niceDate(d: string): string {
  if (!d) return ''
  const date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00`) : new Date(d)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function totals(doc: DocData) {
  const subtotal = doc.lines.reduce((s, l) => s + (Number(l.qty) * Number(l.rate) || 0), 0)
  const tax = doc.taxEnabled ? subtotal * TAX_RATE : 0
  const total = subtotal + tax
  const paid = doc.kind === 'invoice' && doc.status === 'paid' ? total : 0
  return { subtotal, tax, total, paid, due: total - paid }
}

// html2pdf.js is loaded from a CDN only when someone downloads or emails a PDF.
const HTML2PDF_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js',
]

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => { s.remove(); reject(new Error('load failed')) }
    document.head.appendChild(s)
  })
}

async function getHtml2Pdf(): Promise<any> {
  const w = window as any
  if (w.html2pdf) return w.html2pdf
  for (const url of HTML2PDF_URLS) {
    try { await loadScript(url); if (w.html2pdf) return w.html2pdf } catch { /* try next */ }
  }
  throw new Error('Could not load the PDF tool')
}

function pdfOptions(filename: string) {
  return {
    margin: 0,
    filename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  }
}

// ---------- The printable sheet ----------

function Sheet({ doc, biz, tpl, custom }: { doc: DocData; biz: Business; tpl: TemplateKey; custom: Custom }) {
  const base = TEMPLATES[tpl]
  const t = {
    ...base,
    title: custom.titleColor || base.title,
    rule: custom.lineColor || base.rule,
    headBg: custom.lineColor && base.headBg !== '#ffffff' && base.headBg !== '#f3f4f6' ? custom.lineColor : base.headBg,
    band: base.band && custom.lineColor ? custom.lineColor : base.band,
  }
  const { subtotal, tax, total, paid, due } = totals(doc)
  const title = doc.kind === 'invoice' ? (custom.invoiceTitle || 'INVOICE') : (custom.estimateTitle || 'ESTIMATE')
  const isPaid = doc.kind === 'invoice' && doc.status === 'paid' && custom.showPaidStamp
  const cols = custom.showQtyRate
    ? [custom.colDesc || 'Description', custom.colQty || 'Qty', custom.colRate || 'Rate', custom.colAmount || 'Amount']
    : [custom.colDesc || 'Description', custom.colAmount || 'Amount']
  const terms = custom.showTerms ? biz.terms : ''
  const label: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 4 }

  const bizBlock = (color: string, muted: string) => (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      {biz.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={biz.logoUrl} alt="" crossOrigin={/^https?:/.test(biz.logoUrl) ? 'anonymous' : undefined}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 8 }} />
      )}
      <div style={{ lineHeight: 1.5 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color }}>{biz.name || 'Your Business Name'}</div>
        {biz.address1 && <div style={{ fontSize: 12, color: muted }}>{biz.address1}</div>}
        {biz.address2 && <div style={{ fontSize: 12, color: muted }}>{biz.address2}</div>}
        {(biz.phone || biz.email) && <div style={{ fontSize: 12, color: muted }}>{[biz.phone, biz.email].filter(Boolean).join('  ·  ')}</div>}
        {biz.website && <div style={{ fontSize: 12, color: muted }}>{biz.website}</div>}
      </div>
    </div>
  )

  return (
    <div className="cf-sheet" style={{
      width: 816, minHeight: 1056, boxSizing: 'border-box', background: '#ffffff', color: '#111827',
      fontFamily: "'Helvetica Neue', Arial, sans-serif", position: 'relative', overflow: 'hidden',
    }}>
      {/* Header */}
      {t.band ? (
        <div style={{ background: t.band, padding: '36px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {bizBlock(t.bandText!, '#d8e6d0')}
          <div style={{ fontFamily: t.titleFont, fontSize: 44, fontWeight: 900, letterSpacing: '0.04em', color: t.title }}>{title}</div>
        </div>
      ) : (
        <div style={{ padding: '48px 48px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {bizBlock('#111827', '#4b5563')}
          <div style={{ fontFamily: t.titleFont, fontSize: 48, fontWeight: 900, letterSpacing: tpl === 'classic' ? '-0.01em' : '0.04em', color: t.title, transform: tpl === 'classic' ? 'scaleX(0.85)' : undefined, transformOrigin: 'right' }}>{title}</div>
        </div>
      )}

      <div style={{ padding: '32px 48px 48px' }}>
        {/* Bill to + meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, marginBottom: 32 }}>
          <div style={{ lineHeight: 1.55 }}>
            <div style={label}>{custom.billTo || (doc.kind === 'invoice' ? 'Bill To' : 'Prepared For')}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{doc.clientName || '—'}</div>
            {doc.clientAddress && <div style={{ fontSize: 13, color: '#4b5563' }}>{doc.clientAddress}</div>}
            {doc.clientEmail && <div style={{ fontSize: 13, color: '#4b5563' }}>{doc.clientEmail}</div>}
            {doc.clientPhone && <div style={{ fontSize: 13, color: '#4b5563' }}>{doc.clientPhone}</div>}
          </div>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, alignSelf: 'flex-start' }}>
            <tbody>
              {[
                [doc.kind === 'invoice' ? 'Invoice #' : 'Estimate #', doc.number],
                ['Date', niceDate(doc.issueDate)],
                [doc.kind === 'invoice' ? 'Due Date' : 'Valid Until', niceDate(doc.dueDate)],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: '3px 16px 3px 0', color: '#6b7280', fontWeight: 600 }}>{k}</td>
                  <td style={{ padding: '3px 0', fontWeight: 700, textAlign: 'right' }}>{v || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Line items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: t.headBg, borderTop: `2px solid ${t.rule}`, borderBottom: `2px solid ${t.rule}` }}>
              {cols.map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: i === 0 ? 'left' : 'right', color: t.headText, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((l, i) => (
              <tr key={i} style={{ background: i % 2 ? t.zebra : '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px 12px' }}>{l.description || '—'}</td>
                {custom.showQtyRate && <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>{l.qty} {l.unit && l.unit !== 'flat' ? l.unit : ''}</td>}
                {custom.showQtyRate && <td style={{ padding: '10px 12px', textAlign: 'right' }}>{money(Number(l.rate))}</td>}
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{money(Number(l.qty) * Number(l.rate))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ paddingLeft: 40 }}>
            {isPaid && (
              <div style={{
                transform: 'rotate(-12deg)', border: '4px solid #16a34a', color: '#16a34a', borderRadius: 10,
                padding: '6px 22px', fontSize: 40, fontWeight: 900, letterSpacing: '0.12em', opacity: 0.85,
              }}>PAID</div>
            )}
          </div>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 260 }}>
            <tbody>
              <tr><td style={{ padding: '4px 0', color: '#6b7280' }}>Subtotal</td><td style={{ padding: '4px 0', textAlign: 'right' }}>{money(subtotal)}</td></tr>
              {doc.taxEnabled && <tr><td style={{ padding: '4px 0', color: '#6b7280' }}>Tax (8%)</td><td style={{ padding: '4px 0', textAlign: 'right' }}>{money(tax)}</td></tr>}
              <tr style={{ borderTop: `2px solid ${t.rule}` }}>
                <td style={{ padding: '8px 0 4px', fontWeight: 800, fontSize: 15 }}>Total</td>
                <td style={{ padding: '8px 0 4px', textAlign: 'right', fontWeight: 800, fontSize: 15 }}>{money(total)}</td>
              </tr>
              {doc.kind === 'invoice' && (
                <>
                  <tr><td style={{ padding: '4px 0', color: '#6b7280' }}>Paid</td><td style={{ padding: '4px 0', textAlign: 'right' }}>{money(paid)}</td></tr>
                  <tr style={{ background: t.headBg === '#ffffff' ? '#f9fafb' : t.headBg }}>
                    <td style={{ padding: '8px 10px', fontWeight: 800, color: t.headBg === '#ffffff' ? t.title : t.headText }}>Balance Due</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: t.headBg === '#ffffff' ? t.title : t.headText }}>{money(due)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Notes & terms */}
        {(doc.notes || terms) && (
          <div style={{ marginTop: 36, display: 'grid', gap: 16 }}>
            {doc.notes && (
              <div>
                <div style={label}>Notes</div>
                <div style={{ fontSize: 12.5, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{doc.notes}</div>
              </div>
            )}
            {terms && (
              <div>
                <div style={label}>Terms & Conditions</div>
                <div style={{ fontSize: 12, color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{terms}</div>
              </div>
            )}
          </div>
        )}

        {custom.showThankYou && (
          <div style={{
            marginTop: 40, fontSize: tpl === 'classic' ? 30 : 16, color: t.title === '#f5a623' ? '#1a4a1a' : t.title,
            fontFamily: tpl === 'classic' ? "'Brush Script MT', 'Segoe Script', 'Lucida Handwriting', cursive" : undefined,
            fontWeight: tpl === 'classic' ? 400 : 700,
          }}>
            {custom.thankYou || 'Thank you for your business!'}
          </div>
        )}

        {custom.footer && (
          <div style={{ marginTop: 28, paddingTop: 12, borderTop: `1px solid #e5e7eb`, fontSize: 11.5, color: '#6b7280', textAlign: 'center', whiteSpace: 'pre-wrap' }}>
            {custom.footer}
          </div>
        )}
      </div>

    </div>
  )
}

// ---------- Page ----------

const UI = { bg: '#0d1f0d', card: '#152615', border: '#2a4a2a', text: '#e8f5e8', muted: '#6b8f6b', accent: '#f5a623', primary: '#1a4a1a' }

function uiBtn(kind: 'primary' | 'ghost' | 'green' = 'ghost'): React.CSSProperties {
  const base: React.CSSProperties = { border: `1px solid ${UI.border}`, borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }
  if (kind === 'primary') return { ...base, background: UI.accent, color: '#000', border: 'none' }
  if (kind === 'green') return { ...base, background: UI.primary, color: UI.text }
  return { ...base, background: 'transparent', color: UI.muted }
}

const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: UI.bg, border: `1px solid ${UI.border}`, borderRadius: 8, color: UI.text, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }

export default function DocumentPage() {
  const [doc, setDoc] = useState<DocData | null>(null)
  const [error, setError] = useState('')
  const [biz, setBiz] = useState<Business>(EMPTY_BUSINESS)
  const [tpl, setTpl] = useState<TemplateKey>('classic')
  const [custom, setCustom] = useState<Custom>(DEFAULT_CUSTOM)
  const [userId, setUserId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showBiz, setShowBiz] = useState(false)
  const [savingBiz, setSavingBiz] = useState(false)
  const [busy, setBusy] = useState('')
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search)
      const kind = (params.get('kind') === 'estimate' ? 'estimate' : 'invoice') as Kind
      const id = params.get('id') || ''

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const meta: any = user.user_metadata || {}
      const savedBiz: Business | undefined = meta.business
      const startBiz = savedBiz ? { ...EMPTY_BUSINESS, ...savedBiz } : (user.email === OWNER_EMAIL ? OWNER_DEFAULT : EMPTY_BUSINESS)
      setBiz(startBiz)
      if (meta.template && meta.template in TEMPLATES) setTpl(meta.template)
      if (meta.custom) setCustom({ ...DEFAULT_CUSTOM, ...meta.custom })
      setUserId(user.id)
      if (!startBiz.name) setShowBiz(true)

      const table = kind === 'invoice' ? 'invoices' : 'estimates'
      const linesTable = kind === 'invoice' ? 'invoice_lines' : 'estimate_lines'
      const fk = kind === 'invoice' ? 'invoice_id' : 'estimate_id'
      const [{ data: row, error: rowErr }, { data: lines }] = await Promise.all([
        supabase.from(table).select('*').eq('id', id).single(),
        supabase.from(linesTable).select('*').eq(fk, id).order('sort_order'),
      ])
      if (rowErr || !row) { setError('Could not find this document.'); return }

      let clientAddress = ''
      if (row.client_name) {
        const { data: client } = await supabase.from('clients').select('address').eq('name', row.client_name).limit(1).maybeSingle()
        clientAddress = client?.address || ''
      }

      const d: DocData = {
        kind, id, number: row.number, status: row.status,
        clientName: row.client_name || '', clientEmail: row.client_email || '', clientPhone: row.client_phone || '', clientAddress,
        issueDate: row.issue_date, dueDate: kind === 'invoice' ? row.due_date : row.expiry_date,
        notes: row.notes || '', taxEnabled: !!row.tax_enabled,
        lines: (lines || []).map((l: any) => ({ description: l.description, qty: l.qty, unit: l.unit, rate: l.rate })),
      }
      setDoc(d)
      const word = kind === 'invoice' ? 'Invoice' : 'Estimate'
      setEmailTo(d.clientEmail)
      setEmailSubject(`${word} ${d.number} from ${startBiz.name || 'us'}`)
      setEmailMsg(`Hi ${d.clientName || 'there'},\n\nPlease find your ${word.toLowerCase()} ${d.number} attached.\n\nThank you for your business!\n${startBiz.name || ''}`)
    })()
  }, [])

  const saveSettings = async (nextBiz: Business, nextTpl: TemplateKey, nextCustom: Custom = custom) => {
    setSavingBiz(true)
    const { error } = await supabase.auth.updateUser({ data: { business: nextBiz, template: nextTpl, custom: nextCustom } })
    setSavingBiz(false)
    if (error) { alert('Could not save. Try again.'); return false }
    return true
  }

  const chooseTemplate = (k: TemplateKey) => { setTpl(k); saveSettings(biz, k) }

  // Shrink the picture in the browser, then store it in the public "logos" bucket under the user's id.
  const uploadLogo = async (file: File) => {
    if (!file.type.startsWith('image/')) { alert('Pick an image file (PNG or JPG).'); return }
    setUploading(true)
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 400 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const blob: Blob = await new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('resize failed')), 'image/png'))
      const path = `${userId}/logo-${Date.now()}.png`
      const { error } = await supabase.storage.from('logos').upload(path, blob, { contentType: 'image/png', upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      const nextBiz = { ...biz, logoUrl: data.publicUrl }
      setBiz(nextBiz)
      await saveSettings(nextBiz, tpl)
    } catch (err) {
      console.error(err)
      alert("Couldn't upload the logo. Logo uploads need a one-time setup in Supabase (a public \"logos\" storage bucket). Until then, paste a link to your logo instead.")
    }
    setUploading(false)
  }

  const filename = doc ? `${doc.number || doc.kind}.pdf` : 'document.pdf'

  const downloadPdf = async () => {
    if (!sheetRef.current) return
    setBusy('pdf')
    try {
      const html2pdf = await getHtml2Pdf()
      await html2pdf().set(pdfOptions(filename)).from(sheetRef.current).save()
    } catch (err) {
      console.error(err)
      alert("Couldn't make the PDF here. Use Print and choose \"Save as PDF\" instead.")
    }
    setBusy('')
  }

  const sendEmail = async () => {
    if (!sheetRef.current || !doc) return
    if (!emailTo) { alert('Add an email address.'); return }
    setBusy('email')
    try {
      const html2pdf = await getHtml2Pdf()
      const dataUri: string = await html2pdf().set(pdfOptions(filename)).from(sheetRef.current).outputPdf('datauristring')
      const pdfBase64 = dataUri.split(',')[1]
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ to: emailTo, subject: emailSubject, message: emailMsg, filename, pdfBase64, replyTo: biz.email }),
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(out.error || 'Send failed')
      if (doc.kind === 'estimate' && doc.status === 'draft') {
        await supabase.from('estimates').update({ status: 'sent' }).eq('id', doc.id)
        setDoc({ ...doc, status: 'sent' })
      }
      setEmailOpen(false)
      alert('Sent! ✅ The PDF is attached to the email.')
    } catch (err: any) {
      console.error(err)
      alert(`Couldn't send the email. ${err?.message || ''}`)
    }
    setBusy('')
  }

  if (error) return <div style={{ background: UI.bg, color: UI.text, minHeight: '100vh', padding: 40, fontFamily: "'Segoe UI', sans-serif" }}>{error} <a href="/dashboard" style={{ color: UI.accent }}>Back to dashboard</a></div>
  if (!doc) return <div style={{ background: UI.bg, color: UI.muted, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif" }}>Loading...</div>

  const bizField = (k: keyof Business, labelText: string, placeholder = '') => (
    <div key={k}>
      <label style={{ display: 'block', fontSize: 11, color: UI.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{labelText}</label>
      {k === 'terms'
        ? <textarea rows={3} value={biz[k]} placeholder={placeholder} onChange={e => setBiz({ ...biz, [k]: e.target.value })} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        : <input value={biz[k]} placeholder={placeholder} onChange={e => setBiz({ ...biz, [k]: e.target.value })} style={inputStyle} />}
    </div>
  )

  return (
    <div className="cf-page" style={{ background: UI.bg, minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", color: UI.text }}>
      <style>{`
        @page { size: letter; margin: 0; }
        @media print {
          .cf-noprint { display: none !important; }
          .cf-page { background: #fff !important; }
          .cf-wrap { padding: 0 !important; overflow: visible !important; }
          .cf-sheet { box-shadow: none !important; margin: 0 !important; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="cf-noprint" style={{ background: UI.card, borderBottom: `1px solid ${UI.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/dashboard" style={{ color: UI.muted, textDecoration: 'none', fontSize: 22 }}>←</a>
          <div>
            <div style={{ fontWeight: 800 }}>{doc.kind === 'invoice' ? 'Invoice' : 'Estimate'} {doc.number}</div>
            <div style={{ fontSize: 12, color: UI.muted }}>{doc.clientName || 'No customer'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={tpl} onChange={e => chooseTemplate(e.target.value as TemplateKey)} style={{ ...inputStyle, width: 'auto', padding: '8px 10px' }}>
            {(Object.keys(TEMPLATES) as TemplateKey[]).map(k => <option key={k} value={k}>{TEMPLATES[k].label}</option>)}
          </select>
          <button onClick={() => setShowBiz(s => !s)} style={uiBtn()}>🎨 Customize</button>
          <button onClick={() => window.print()} style={uiBtn('green')}>🖨️ Print</button>
          <button onClick={downloadPdf} disabled={!!busy} style={uiBtn('green')}>{busy === 'pdf' ? 'Making PDF…' : '⬇️ Download PDF'}</button>
          <button onClick={() => setEmailOpen(true)} disabled={!!busy} style={uiBtn('primary')}>📧 Email PDF</button>
        </div>
      </div>

      {/* Business info editor */}
      {showBiz && (
        <div className="cf-noprint" style={{ maxWidth: 816, margin: '20px auto 0', padding: '0 16px' }}>
          <div style={{ background: UI.card, border: `1px solid ${UI.border}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Your Business Info</div>
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 14 }}>Everything here shows on all your invoices and estimates and is saved to your account. The page updates as you type; hit Save to keep it.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              {bizField('name', 'Business Name', 'Your Landscaping Co.')}
              {bizField('phone', 'Phone', '555-555-5555')}
              {bizField('address1', 'Street Address', '123 Main St')}
              {bizField('address2', 'City, State ZIP', 'Chicago, IL 60601')}
              {bizField('email', 'Email', 'you@email.com')}
              {bizField('website', 'Website', 'yoursite.com')}
              {bizField('logoUrl', 'Logo Image Link (optional)', 'https://…/logo.png')}
            </div>
            <div style={{ marginTop: 10 }}>{bizField('terms', 'Terms & Conditions', 'Payment due within 30 days…')}</div>

            {/* Logo */}
            <div style={{ fontSize: 11, fontWeight: 700, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '22px 0 8px' }}>Logo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {biz.logoUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={biz.logoUrl} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', background: '#fff', borderRadius: 8 }} />
                : <div style={{ width: 56, height: 56, borderRadius: 8, border: `1px dashed ${UI.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: UI.muted }}>No logo</div>}
              <label style={{ ...uiBtn('green'), display: 'inline-block' }}>
                {uploading ? 'Uploading…' : '⬆️ Upload Logo'}
                <input type="file" accept="image/*" disabled={uploading} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = '' }} />
              </label>
              {biz.logoUrl && <button onClick={() => setBiz({ ...biz, logoUrl: '' })} style={uiBtn()}>Remove</button>}
            </div>

            {/* Wording */}
            <div style={{ fontSize: 11, fontWeight: 700, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '22px 0 4px' }}>Wording</div>
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 10 }}>Leave a box empty to use the default shown in gray.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {([
                ['invoiceTitle', 'Invoice Title', 'INVOICE'],
                ['estimateTitle', 'Estimate Title', 'ESTIMATE'],
                ['billTo', 'Customer Label', doc.kind === 'invoice' ? 'Bill To' : 'Prepared For'],
                ['colDesc', 'Column 1', 'Description'],
                ['colQty', 'Column 2', 'Qty'],
                ['colRate', 'Column 3', 'Rate'],
                ['colAmount', 'Column 4', 'Amount'],
              ] as [keyof Custom, string, string][]).map(([k, l, ph]) => (
                <div key={k}>
                  <label style={{ display: 'block', fontSize: 11, color: UI.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</label>
                  <input value={custom[k] as string} placeholder={ph} onChange={e => setCustom({ ...custom, [k]: e.target.value })} style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: UI.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Closing Line</label>
                <input value={custom.thankYou} placeholder="Thank you for your business!" onChange={e => setCustom({ ...custom, thankYou: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: UI.muted, fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Footer (bottom of page)</label>
                <input value={custom.footer} placeholder="e.g. Licensed & insured · Free estimates" onChange={e => setCustom({ ...custom, footer: e.target.value })} style={inputStyle} />
              </div>
            </div>

            {/* Colors & show/hide */}
            <div style={{ fontSize: 11, fontWeight: 700, color: UI.accent, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '22px 0 8px' }}>Colors & What Shows</div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              {([['titleColor', 'Title color', TEMPLATES[tpl].title], ['lineColor', 'Lines color', TEMPLATES[tpl].rule]] as [keyof Custom, string, string][]).map(([k, l, def]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: UI.muted }}>
                  <input type="color" value={(custom[k] as string) || def} onChange={e => setCustom({ ...custom, [k]: e.target.value })} style={{ width: 36, height: 28, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} />
                  {l}
                  {custom[k] && <button onClick={() => setCustom({ ...custom, [k]: '' })} style={{ ...uiBtn(), padding: '2px 8px', fontSize: 11 }}>default</button>}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 12 }}>
              {([
                ['showQtyRate', 'Show Qty & Rate columns'],
                ['showTerms', 'Show Terms & Conditions'],
                ['showThankYou', 'Show closing line'],
                ['showPaidStamp', 'Show PAID stamp'],
              ] as [keyof Custom, string][]).map(([k, l]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: UI.muted, cursor: 'pointer' }}>
                  <input type="checkbox" checked={custom[k] as boolean} onChange={e => setCustom({ ...custom, [k]: e.target.checked })} style={{ accentColor: UI.accent }} />
                  {l}
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <button onClick={async () => { if (await saveSettings(biz, tpl)) setShowBiz(false) }} disabled={savingBiz} style={uiBtn('primary')}>{savingBiz ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setShowBiz(false)} style={uiBtn()}>Close</button>
              <button onClick={() => setCustom(DEFAULT_CUSTOM)} style={uiBtn()}>Reset wording & colors</button>
            </div>
          </div>
        </div>
      )}

      {/* The document */}
      <div className="cf-wrap" style={{ padding: '24px 16px 60px', overflowX: 'auto' }}>
        <div ref={sheetRef} style={{ width: 816, margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.45)' }} className="cf-sheet">
          <Sheet doc={doc} biz={biz} tpl={tpl} custom={custom} />
        </div>
      </div>

      {/* Email dialog */}
      {emailOpen && (
        <div className="cf-noprint" onClick={() => !busy && setEmailOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: UI.card, border: `1px solid ${UI.border}`, borderRadius: 14, padding: 22, width: '100%', maxWidth: 480 }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Email this {doc.kind}</div>
            <div style={{ fontSize: 12, color: UI.muted, marginBottom: 14 }}>The PDF ({filename}) is attached automatically.</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <input value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="client@email.com" type="email" style={inputStyle} />
              <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject" style={inputStyle} />
              <textarea value={emailMsg} onChange={e => setEmailMsg(e.target.value)} rows={6} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setEmailOpen(false)} disabled={!!busy} style={uiBtn()}>Cancel</button>
              <button onClick={sendEmail} disabled={!!busy} style={uiBtn('primary')}>{busy === 'email' ? 'Sending…' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
