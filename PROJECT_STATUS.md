# CotizaFlow: Project Status

_Last updated: October 24, 2026_

## Live on cotizaflow.com
- **Dashboard** in the InvoiceHome style: My Documents, My Customers, My Reports, Billing, and Admin for the owner. Status filters, search, totals, and one-tap Mark Paid.
- **Invoices and estimates** numbered in order (INV-1, EST-1…). The number can be edited, and duplicates are blocked.
- **PDF, print, and email templates**: Classic, Green & Gold, and Clean. Each user sets their own logo, business info, wording, colors, and what shows.
- **iPhone app**: in Safari, tap Share, then Add to Home Screen.
- **Billing (Stripe, test mode)**: 14-day free trial, then CotizaFlow Pro at $19/month. Includes checkout, Manage billing, and a lock screen when the trial ends. The owner account is always free.
- **Home / App switcher**, logo favicon, founder page at `/about`, and structured data for Google, including the Gumers Landscaping service area.

## Still to do
- [ ] Confirm the **data security SQL** (each user only sees their own records) was run in Supabase
- [ ] Run the **logo upload storage SQL** in Supabase (public `logos` bucket and policies)
- [ ] **Emails to clients**: verify a domain in Resend, then set `RESEND_FROM` in Vercel
- [ ] **Stripe live mode**: activate the account, recreate the product, and swap `sk_test_` for `sk_live_` in Vercel (also set `STRIPE_PRICE_ID` to the live price)
- [ ] **Google Search Console**: verify cotizaflow.com, submit `sitemap.xml`, and request indexing for `/about`
- [ ] **Google Business Profile** for Gumers Landscaping (service areas, "run by Elvis Teran", established 2024)
- [ ] Decide on the homepage lines "10+ years in landscaping" and the "$2,847 estimated in beta" counter
- [ ] Later: **Stripe Connect** so landscapers' clients can pay invoices online

## Key settings
- Vercel environment variables: `STRIPE_SECRET_KEY` (set, test), optional `STRIPE_PRICE_ID`, `RESEND_API_KEY`, `RESEND_FROM`, Supabase URL and anon key
- Stripe test product: CotizaFlow Pro, `price_1UUF8MJ9eAMjXDXTAIGetfty`, tax code SaaS – Business Use. Managed Payments is on.
- Test card: `4242 4242 4242 4242`, any future date, any CVC
