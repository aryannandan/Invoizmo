# Invoizmo – Product Requirements Document (PRD)

**Version:** 3.1 (restructured after review, site architecture added) · **Date:** 21 November 2026
**Product:** Invoizmo, a web-based invoice generator SaaS
**Based on:** the founder's product map, Full-Stack Project Blueprint v2.2, and a structure review of v2.0
**Audience:** founder/developer, AI coding assistants (Cursor, Copilot, Claude, Lovable), future team members
**Purpose:** Define what Invoizmo is, for whom, and how to build it, in enough detail to build module by module.

## Table of Contents

1. What Changed from v2.0
2. Product Overview
3. Decisions Made in This Version
4. Brand and Design System
5. Release Plan (MVP vs Later)
6. Information Architecture and Site Architecture (page trees, routes, access rules)
7. Public Pages
8. Account Features
9. Dashboard and Invoice Lifecycle
10. Create Flow and Invoice Editor
11. Output: Numbering, Preview and Download
12. Trash and Archive
13. Pricing and Plan Limits
14. Tech Stack and Architecture
15. Data Model
16. API
17. Security, Quality and CI
18. Build Prompts
19. Risks and Open Questions
- Appendix A: Building with Lovable

---

## 1. What Changed from v2.0

| Problem found in review | Fix in this version |
| --- | --- |
| Pages and features were mixed (Login listed as a feature) | One clear structure: Public pages, Account, Dashboard, Create flow, Content, Styling, Output (section 6) |
| "Customization" held styling, content and actions | Split into **Invoice content**, **Styling** and **Output** (sections 10–11) |
| Statuses mixed document state and payment state; Archived overlapped Trash | Lifecycle is **Draft → Sent → Paid**, with Overdue derived; **Archive** is a hide flag; **Trash** is separate and clearly different (sections 9, 12) |
| Missing essentials | Added client and seller details, line items, due date, discount, logo, settings, forgot password, email verification, Terms, footer, search |
| Pricing had no limits or comparison | Defined Free vs Pro limits, billing period and currency rule (section 13) |
| Home page was only header and hero | Full section-by-section spec (section 7) |
| Vague wording ("email only", "changing value", numbering) | Each defined with testable rules (sections 3, 8, 10, 11) |
| No must-have vs later split | Every requirement has a priority (P0, P1, P2) |
| No page-by-page map | **v3.1:** full Site Architecture trees for every page, route access rules, navigation maps and a page-to-requirement map (section 6) |

## 2. Product Overview

### 2.1 Problem

Freelancers and small businesses still make invoices in Word or Excel. The result is inconsistent numbering, tax and currency mistakes, unprofessional layouts, lost files, and no clear view of who has paid. Accounting suites fix this but are too heavy and costly for someone who only needs to send a clean invoice and track whether it is paid.

### 2.2 Vision

Invoizmo lets anyone create, customize and download a professional invoice in under 60 seconds, then track whether it is sent, paid or overdue, with no accounting knowledge. It is free forever for basic use, with a low-cost paid plan for power features.

### 2.3 Target Users

| Persona | Description | Key needs |
| --- | --- | --- |
| Freelancer | Designer, developer, writer, consultant | Fast invoices, own branding, multi-currency |
| Small business owner | Shop, trader, service provider | Tax percentage, signature, payment tracking |
| Agency / studio | Small team billing clients | Templates, consistent numbering, history |
| Student / first-time user | Occasional invoices | Free plan, no learning curve |

### 2.4 Goals and Non-Goals

**Goals**

- G1: A returning user creates and downloads an invoice in under 60 seconds.
- G2: A user can always see what is draft, sent, paid and overdue.
- G3: Email-based signup and login only (no Google, Facebook or phone).
- G4: Fully customizable look: template, font, colors, logo, signature.
- G5: Never lose an invoice: autosave, plus a 30-day Trash.
- G6: A genuinely useful free plan, plus one simple paid plan.

**Non-goals for the MVP**

- Accounting, ledger, payroll or inventory.
- Collecting payments from the invoice recipient (the user marks invoices paid by hand).
- Recurring invoices, quotes, team roles, native mobile app.
- Social login and phone/OTP login.

### 2.5 Success Metrics (targets to validate, not promises)

| Metric | Target in first 6 months |
| --- | --- |
| Signup to first downloaded invoice | Median under 5 minutes |
| Invoice creation time, returning user | Under 60 seconds |
| Activation: 1+ invoice within 7 days of signup | 40% |
| Free-to-paid conversion | 3–5% |
| PDF download time, p95 | Under 5 seconds |
| API latency (non-PDF), p95 | Under 400 ms |
| Uptime | 99.5% |

### 2.6 Assumptions and Constraints

- One developer plus AI assistants, so prefer managed services.
- India-first launch (INR, ₹600 plan), but every currency is supported from day one.
- The product formats invoices; it gives no tax or legal advice. Tax percentage is entered by the user.
- Legal pages must be reviewed by a lawyer before launch.

## 3. Decisions Made in This Version

These replace the vague points in the original sketch. Change any of them and the PRD follows.

| Topic | Decision |
| --- | --- |
| "Email based only" | Email + password, with email verification and forgot/reset password. No social or phone login. (Magic-link login can replace the password later.) |
| Invoice statuses | **Draft, Sent, Paid.** **Overdue** is derived (Sent, past due date, not paid). |
| Archive vs Trash | **Archive** hides a finished invoice but keeps it as a record (reversible any time). **Trash** is for invoices the user wants gone; it is erased after 30 days. |
| "Published" | Replaced by **Sent**. Because Invoizmo does not email in the MVP, "Mark as sent" is a button the user clicks after sharing the PDF. P1 adds real email sending. |
| Invoice number | Assigned when the invoice is first marked **Sent**. Drafts have no number. Numbers are never reused. |
| "Changing value (amount)" | Users edit **line items** (quantity, price), discount and tax percentage. The total is always calculated, never typed directly. |
| Pricing | Free Forever: 5 invoices per month, 2 templates. Pro: ₹600 per month, unlimited. (Confirm.) |
| Download | Allowed for drafts (watermarked on Free) and for sent or paid invoices. |

## 4. Brand and Design System

### 4.1 Name and Logo

**Brand name: Invoizmo.** Check domain and trademark availability before launch (for example invoizmo.com or .app); Namelix.com can be used to test alternatives. **Logo direction:** a rounded geometric sans-serif wordmark with an icon of a document with a folded corner and a check mark. Deliver SVG in light, dark and single-color versions, a 32×32 favicon and a 1200×630 social image. Use ThemeForest and Dribbble for inspiration only; do not copy designs.

### 4.2 Color Theme

Indigo signals trust and finance without looking like a bank. All text and background pairs must meet WCAG AA (4.5:1 for body text).

| Role | Name | Hex | Used for |
| --- | --- | --- | --- |
| Primary | Indigo 600 | #4F46E5 | Buttons, links, active nav, focus ring |
| Primary hover | Indigo 700 | #4338CA | Hover and pressed states |
| Primary tint | Indigo 50 | #EEF2FF | Selected cards, hero background |
| Success | Emerald 500 | #10B981 | "Paid" badge, success toasts |
| Info | Sky 500 | #0EA5E9 | "Sent" badge |
| Warning | Amber 500 | #F59E0B | "Draft" badge, trash expiry |
| Danger | Red 500 | #EF4444 | "Overdue" badge, delete, errors |
| Neutral | Slate 50–900 | #F8FAFC → #0F172A | Backgrounds, borders, text, "Archived" badge |

### 4.3 Typography and UI Rules

- UI font Inter (fallback system-ui); headings Plus Jakarta Sans or Inter semibold.
- 16px base, 1.5 line height, 8px spacing grid, 12px radius on cards, 8px on inputs.
- Mobile first, Tailwind default breakpoints. Light mode first; dark mode P1.
- Every interactive element has a visible focus state, a label and keyboard access.
- The invoice document has its own colors, set by the user, independent of the app theme.

## 5. Release Plan (MVP vs Later)

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| **P0: MVP** (about 8–10 weeks solo) | Public pages, email auth, dashboard with lifecycle (Draft/Sent/Paid/Overdue), archive, trash, create flow with 4 templates, invoice content (client, items, tax, discount, currency), styling (font, color, logo, signature), auto numbering, live preview, PDF download, settings, free plan limits | 10 pilot users create real invoices; no critical security findings; PDF matches preview |
| **P1: v1.1** (+6 weeks) | Razorpay Pro plan, email invoice to client, saved clients, per-line tax, summary tiles, more templates, dark mode, print and PNG export, session management | 3% of active users on Pro |
| **P2: v2** | Recurring invoices, quotes, payment links, partial payments, team access, multi-language, public API | Driven by user feedback |

## 6. Information Architecture and Site Architecture

| Group | What it contains | Where specified |
| --- | --- | --- |
| **Public pages** | Home, About, Contact, Privacy, Terms, Pricing | Section 7 |
| **Account** | Signup, Login, Verify email, Forgot/reset password, Settings | Section 8 |
| **Dashboard** | Invoice list, status tabs, search, Create button, Trash and Archive access | Sections 9, 12 |
| **Create flow** | Create button → template choice → editor | Section 10.1 |
| **Invoice content** | Seller, client, line items, dates, currency, tax, discount, notes | Section 10.2 |
| **Styling** | Template, font, color scheme, logo, signature | Section 10.3 |
| **Output** | Auto numbering, live preview, PDF download | Section 11 |

### 6.1 Site Architecture: Public Pages (no login required)

Priority tags in brackets apply only when not P0: [P1] = next release.

```text
/                      → Home
                         ├── Navbar (logo · Features · Pricing · About · Contact · Login · Get started free)
                         ├── Hero Section (headline · pitch · "Create your first invoice" · invoice preview image)
                         ├── Features Section (templates · customization · signature · all currencies & tax ·
                         │                     auto numbering · PDF download)
                         ├── How It Works Section (1 Pick template → 2 Fill & customize → 3 Download)
                         ├── Template Preview Section [P1]
                         ├── Pricing Preview Section (Free vs Pro cards → /pricing)
                         ├── FAQ Section [P1]
                         ├── CTA Banner ("Create your first invoice")
                         └── Footer (About · Contact · Pricing · Privacy · Terms · copyright)

/pricing               → Pricing Page
                         ├── Section Title + subtitle
                         ├── Plan Comparison Table
                         │     ├── Free Forever  (₹0)
                         │     └── Pro           (₹600 / month)
                         ├── Feature rows (invoices per month · templates · fonts · colors · logo · footer · support)
                         ├── CTA per plan (Free: "Get started" → /signup · Pro: "Join waitlist" until billing ships)
                         └── Pricing FAQ + currency note

/about                 → About Page
                         ├── Hero (one-line mission)
                         ├── Our Story
                         ├── Why Invoizmo (3 points)
                         └── CTA Banner

/contact               → Contact Us Page
                         ├── Contact Form (name · email · subject · message · hidden honeypot)
                         ├── Support email
                         └── Success / error message

/privacy-policy        → Privacy Policy Page
/terms                 → Terms of Service Page
*                      → 404 Page (message + "Go home" button)
```

### 6.2 Site Architecture: Auth Pages (guest only)

Logged-in users who open these pages are redirected to `/dashboard`.

```text
/signup                → Signup
                         ├── Form (name · email · password with strength hint)
                         ├── Terms & Privacy consent line
                         └── Link: "Already have an account? Log in"
                         → on success: "Check your email" screen

/login                 → Login
                         ├── Form (email · password)
                         ├── Link: Forgot password?
                         ├── Link: "New here? Sign up"
                         └── Errors: wrong credentials · account locked (15 min)

/verify-email          → Verify Email (opened from the emailed token link)
                         ├── States: verifying · success → /dashboard · expired link
                         └── "Resend verification email" button (rate-limited)

/forgot-password       → Forgot Password
                         ├── Form (email)
                         └── Always shows the same message: "If that email exists, we sent a link"

/reset-password        → Reset Password (via token link)
                         ├── Form (new password · confirm)
                         └── States: success → /login · expired or used link
```

### 6.3 Site Architecture: App Pages (protected; redirect to `/login?next=<page>` if not authenticated)

```text
/dashboard             → Main Dashboard
                         ├── Top Bar (logo · Dashboard · Trash · Settings · user menu)
                         ├── Unverified-email banner (with Resend link) when needed
                         ├── Quick Stats Bar [P1] (outstanding · overdue count · paid this month)
                         ├── Create Invoice CTA (primary button, always visible)
                         ├── Filter Bar
                         │     ├── Status tabs: All · Draft · Sent · Paid · Overdue · Archived (with counts)
                         │     └── Search (number or client) · Sort (date, amount)
                         ├── Recent Invoices List (number or "Draft" · client · amount · due date · status badge)
                         │     └── Row actions: Edit · Duplicate · Download · Mark as sent · Mark as paid ·
                         │                      Archive / Unarchive · Move to trash
                         ├── Pagination (20 per page)
                         └── Empty State (message + Create Invoice button)

/invoice/new           → Create Invoice, Step 1: Template Selection
                         ├── Template grid (Classic · Modern · Minimal · Bold) with preview thumbnails
                         ├── "Pro" lock on templates the Free plan cannot use
                         ├── "Start from a previous invoice" (duplicate)
                         └── Choosing a template creates a draft and opens /invoice/:id

/invoice/:id           → Invoice Editor (new draft or existing invoice, same layout)
                         ├── Editor Top Bar
                         │     ├── Back to dashboard · invoice name · status badge · "Saved" indicator
                         │     └── Actions: Download · Mark as sent · Mark as paid · Archive · Move to trash
                         ├── Left Panel, tab "Content"
                         │     ├── Seller details
                         │     ├── Client details
                         │     ├── Dates (issue · due)
                         │     ├── Line items (description · quantity · unit · price · add / remove / reorder)
                         │     ├── Discount and Tax (percent or fixed · tax name and percent)
                         │     ├── Currency (all ISO 4217)
                         │     └── Notes · Terms · Payment details
                         ├── Left Panel, tab "Styling"
                         │     ├── Template switcher
                         │     ├── Font (8+)
                         │     ├── Color scheme (presets · custom accent on Pro)
                         │     ├── Logo upload (Pro)
                         │     └── Signature (Type with script font · Draw on canvas)
                         ├── Right Panel: Live Preview (identical to the PDF)
                         ├── Totals box (subtotal · discount · tax · total, calculated)
                         └── Mobile: Content / Styling / Preview as three tabs

/trash                 → Trash
                         ├── Info line: "Items are deleted permanently after 30 days"
                         ├── Deleted Invoices List (number · client · amount · days left)
                         │     ├── Restore
                         │     └── Delete forever (confirmation dialog)
                         ├── Amber badge when 5 days or fewer remain [P1]
                         └── Empty State

/settings              → Settings
                         ├── Profile (name · email, read-only after verification)
                         ├── Business Details (name · address · tax ID · phone · website · logo)
                         ├── Invoice Defaults (currency · payment terms · notes · terms)
                         ├── Numbering (prefix · starting number)
                         ├── Saved Signature (view · replace · remove)
                         ├── Security (change password · log out of all devices · active sessions [P1])
                         ├── Plan (current plan · usage this month · "Join waitlist" for Pro)
                         └── Danger Zone (export data · delete account with typed confirmation)
```

### 6.4 Internal and Later Pages

| Route | Page | Notes | Pri |
| --- | --- | --- | --- |
| `/print/invoice/:id?token=…` | Print page used only by the PDF service | Not linked anywhere; accepts a short-lived signed token; never indexed (`noindex`) | P0 |
| `/billing` | Upgrade and payment | Razorpay checkout; replaces "Join waitlist" | P1 |
| `/clients` | Saved clients list | Reuse clients when creating invoices | P1 |
| `/invoice/:id/share` | Public view link for the client | Read-only page with a download button | P2 |

### 6.5 Route Access Rules

| Group | Routes | Access | If the rule is not met |
| --- | --- | --- | --- |
| Public | `/`, `/pricing`, `/about`, `/contact`, `/privacy-policy`, `/terms` | Everyone | n/a |
| Guest only | `/signup`, `/login`, `/forgot-password`, `/reset-password` | Logged-out users | Redirect to `/dashboard` |
| Token link | `/verify-email`, `/reset-password` | Anyone holding a valid emailed token | Show "link expired" state |
| Protected | `/dashboard`, `/invoice/new`, `/invoice/:id`, `/trash`, `/settings` | Logged-in users, own data only | Redirect to `/login?next=<page>` |
| Verified only (actions) | Download, Mark as sent | Logged-in users with a verified email | Banner and `EMAIL_NOT_VERIFIED` message |
| Internal | `/print/invoice/:id` | PDF service with a signed token | 404 |
| Unknown | any other route | Everyone | 404 page |

After login the user returns to the page in `next`, otherwise `/dashboard`. Opening another user's `/invoice/:id` shows the 404 page.

### 6.6 Navigation Maps

| Where | Items |
| --- | --- |
| Public navbar | Logo → `/` · Features (scrolls to the Features section) · Pricing · About · Contact · Login · **Get started free** → `/signup` |
| Footer (public pages) | About · Contact · Pricing · Privacy Policy · Terms · copyright |
| App top bar | Logo → `/dashboard` · Dashboard · Trash · Settings · **Create invoice** button · user menu (Settings · Log out) |
| Mobile | Public: hamburger menu with the same items. App: top bar plus a bottom bar with Dashboard · Create · Trash · Settings |

### 6.7 Page-to-Requirement Map

| Route | Specified in |
| --- | --- |
| `/`, `/pricing`, `/about`, `/contact`, `/privacy-policy`, `/terms` | Sections 7 and 13 |
| `/signup`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password` | Section 8 (FR-AUTH) |
| `/dashboard` | Section 9 (FR-DASH) and section 12 (Archive) |
| `/invoice/new`, `/invoice/:id` | Sections 10 and 11 (FR-NEW, FR-CON, FR-STY, FR-NUM, FR-DL) |
| `/trash` | Section 12 (FR-TRASH) |
| `/settings` | Section 8 (FR-SET) |

## 7. Public Pages

Public pages are server-rendered with titles, meta descriptions, Open Graph tags, a sitemap and robots.txt.

### 7.1 Home (`/`)

| Section | Content | Pri |
| --- | --- | --- |
| Header | Logo, nav (Features, Pricing, About, Contact), Login, "Get started free". Sticky; collapses to a menu on mobile. | P0 |
| Hero | Headline, one-line value statement, primary button "Create your first invoice", secondary "See pricing", invoice preview image. | P0 |
| Features | 4–6 cards: templates, customization, signature, all currencies and tax, auto numbering, PDF download. | P0 |
| How it works | 3 steps: pick a template → fill and customize → download. | P0 |
| Template preview | Thumbnails of the 4 templates. | P1 |
| Pricing teaser | Free vs Pro in two cards with a link to /pricing. | P0 |
| FAQ | 5–6 questions (is it free, which currencies, can I recover deleted invoices). | P1 |
| Final call to action | "Create your first invoice" button. | P0 |
| Footer | Logo, links (About, Contact, Privacy, Terms, Pricing), copyright. | P0 |

### 7.2 Other Public Pages

| Page | Route | Content and requirements | Pri |
| --- | --- | --- | --- |
| About | /about | Story, mission, what makes Invoizmo different, call to action. | P0 |
| Contact us | /contact | Name, email, subject, message; validated; emails support; success message. Rate-limited with a honeypot field. | P0 |
| Privacy Policy | /privacy-policy | Data collected, purpose, storage, cookies, 30-day trash retention, deletion rights, contact. | P0 |
| Terms of Service | /terms | Use of the service, accounts, plans, liability. | P0 |
| Pricing | /pricing | Title and subtitle, pricing table (Free Forever vs ₹600 plan), full feature comparison, FAQ, currency note (section 13). | P0 |
| 404 / error | n/a | Friendly message and link home. | P0 |

## 8. Account Features

| ID | Requirement | Pri |
| --- | --- | --- |
| FR-AUTH-1 | Sign up with name, email and password (min 8 characters, one letter, one number). Duplicate emails get a generic message. | P0 |
| FR-AUTH-2 | Verification email with a single-use link (24-hour expiry). Unverified users can log in and edit but cannot download or mark sent until verified. Resend is rate-limited. | P0 |
| FR-AUTH-3 | Login with email and password. No social or phone login. | P0 |
| FR-AUTH-4 | Forgot and reset password by emailed single-use link (30-minute expiry). Generic responses prevent email enumeration. | P0 |
| FR-AUTH-5 | Logout, and "log out of all devices". | P0 |
| FR-AUTH-6 | Lock the account for 15 minutes after 5 failed logins. | P0 |
| FR-AUTH-7 | Refresh token rotation; reuse of a rotated token revokes all sessions. | P0 |
| FR-AUTH-8 | After login, redirect to the page the user tried to open, else the dashboard. | P0 |
| FR-SET-1 | **Settings page:** name, business name, address, tax ID, phone, website, logo, default currency, default payment terms (for example Net 15), default notes and terms, invoice prefix and starting number. | P0 |
| FR-SET-2 | Change password. | P0 |
| FR-SET-3 | Delete account with typed confirmation; export all data as JSON. | P0 |
| FR-SET-4 | View and revoke active sessions. | P1 |

## 9. Dashboard and Invoice Lifecycle

### 9.1 Lifecycle

```text
Draft ──(Mark as sent)──▶ Sent ──(Mark as paid)──▶ Paid
  ▲                         │                        │
  └──────(Mark as draft)────┘◀──(Mark as unpaid)─────┘

Overdue = Sent AND dueDate passed AND not Paid   (derived, shown as a red badge)
Archive = a separate flag on Sent or Paid invoices (hide, keep as record)
Trash   = a separate flag on any invoice (delete, erased after 30 days)
```

| Status | Meaning | Editable? | Number |
| --- | --- | --- | --- |
| **Draft** | Being prepared | Fully | None |
| **Sent** | Finalized and shared with the client | Yes, with a warning; the number never changes | Assigned on first "Mark as sent" |
| **Paid** | Client has paid | Notes only; financial fields locked until marked unpaid | Keeps its number |
| **Overdue** (derived) | Sent, due date passed, not paid | Same as Sent | Keeps its number |

### 9.2 Dashboard Requirements

| ID | Requirement | Pri |
| --- | --- | --- |
| FR-DASH-1 | The landing screen shows **recent invoices** (list or cards), newest first: number (or "Draft"), client, amount with currency, due date, status badge. | P0 |
| FR-DASH-2 | Tabs: **All, Draft, Sent, Paid, Overdue, Archived**, each with a count. Trash is reached from the menu, not a tab. | P0 |
| FR-DASH-3 | Search by invoice number or client name; sort by date or amount; pagination (20 per page). | P0 |
| FR-DASH-4 | Row actions: open/edit, duplicate, download, mark as sent, mark as paid, archive, move to trash. | P0 |
| FR-DASH-5 | A prominent **Create invoice** button in the header and in the empty state. | P0 |
| FR-DASH-6 | Friendly empty state with a create button. | P0 |
| FR-DASH-7 | Summary tiles: outstanding amount per currency, overdue count, paid this month. | P1 |
| FR-DASH-8 | Filter by currency and date range. | P1 |

## 10. Create Flow and Invoice Editor

### 10.1 Create Flow

| ID | Requirement | Pri |
| --- | --- | --- |
| FR-NEW-1 | **Create** opens a template selection screen with preview thumbnails. | P0 |
| FR-NEW-2 | At least 4 templates at launch (Classic, Modern, Minimal, Bold). Free plan: 2; Pro: all. | P0 |
| FR-NEW-3 | Choosing a template creates a draft, pre-filled with the seller details, currency, payment terms, notes and terms from Settings, and opens the editor. | P0 |
| FR-NEW-4 | The template can be switched later without losing data. | P0 |
| FR-NEW-5 | "Start from a previous invoice" duplicates it into a new draft. | P0 |

### 10.2 Invoice Content

| ID | Requirement | Pri |
| --- | --- | --- |
| FR-CON-1 | **Seller details:** business name, address, tax ID, email, phone (pre-filled from Settings, editable per invoice). | P0 |
| FR-CON-2 | **Client details:** name, company, email, address, tax ID. | P0 |
| FR-CON-3 | **Dates:** issue date (default today) and due date (default from payment terms). | P0 |
| FR-CON-4 | **Line items:** description, quantity (up to 3 decimals), unit, unit price. Add, remove and reorder. Line amount is calculated. | P0 |
| FR-CON-5 | **Discount:** percent or fixed amount on the subtotal. | P0 |
| FR-CON-6 | **Tax:** tax name (GST, VAT, Sales Tax) and percentage, applied after discount. Per-line tax is P1. | P0 |
| FR-CON-7 | **Currency:** all ISO 4217 currencies with correct symbol, code, decimals and grouping. Default from Settings, override per invoice. | P0 |
| FR-CON-8 | **Notes, terms and payment details** (bank, UPI, PayPal text). | P0 |
| FR-CON-9 | **Changing values:** every field above is editable in place. Subtotal, tax and total are calculated and never typed directly. All totals update instantly. | P0 |
| FR-CON-10 | **Autosave** the draft every few seconds with a "Saved" indicator. | P0 |
| FR-CON-11 | Purchase order number and shipping or adjustment line. | P1 |

### 10.3 Styling

| ID | Requirement | Pri |
| --- | --- | --- |
| FR-STY-1 | **Font:** at least 8 curated fonts (Inter, Roboto, Lato, Poppins, Merriweather, Playfair Display, Source Serif, Courier Prime), embedded in the PDF. | P0 |
| FR-STY-2 | **Color scheme:** preset palettes plus a custom accent picker with a contrast check. Free plan: presets only. | P0 |
| FR-STY-3 | **Logo:** PNG, JPG or SVG up to 2 MB, validated on client and server. Pro only. | P0 |
| FR-STY-4 | **Signature, typed:** type a name and pick a script font. | P0 |
| FR-STY-5 | **Signature, drawn:** draw on a canvas with mouse or touch, with Clear and Undo. Saved as a transparent PNG, reusable on later invoices, removable. | P0 |
| FR-STY-6 | Remember last-used font, colors and template as defaults. | P1 |

The editor has a form panel on the left and a live preview on the right (tab switch on mobile). The preview is identical to the PDF.

## 11. Output: Numbering, Preview and Download

### 11.1 Auto Numbering

| ID | Requirement | Pri |
| --- | --- | --- |
| FR-NUM-1 | The number is assigned when a draft is first marked **Sent**: next number = the user's counter + 1, with their prefix (INV-0007 follows INV-0006). | P0 |
| FR-NUM-2 | Assignment is atomic (a counter updated with `findOneAndUpdate` and `$inc`), so two browser tabs can never create a duplicate. | P0 |
| FR-NUM-3 | Prefix and starting number are editable in Settings. Changing the prefix affects future invoices only. | P0 |
| FR-NUM-4 | A custom number can be entered; it must be unique for that user or the app shows an error. | P0 |
| FR-NUM-5 | Numbers are never reused, including after an invoice is archived, trashed or deleted forever. Gaps are allowed and expected. | P0 |
| FR-NUM-6 | Duplicating an invoice creates a draft with no number. | P0 |

### 11.2 Calculation

Money is stored as integers in the currency's smallest unit (paise, cents), using each currency's ISO 4217 exponent (JPY 0, INR 2, KWD 3). The server always recomputes totals; the browser only previews.

```text
lineAmount  = round_half_up(quantity × unitPriceMinor)
subtotal    = Σ lineAmount
discount    = percent: round_half_up(subtotal × pct / 100) | fixed: amount (max = subtotal)
taxable     = subtotal − discount
tax         = round_half_up(taxable × taxPercent / 100)
total       = taxable + tax
```

### 11.3 Download

| ID | Requirement | Pri |
| --- | --- | --- |
| FR-DL-1 | **Download** generates a PDF (A4 default, Letter option) identical to the preview. File name: `Invoice-<number>-<client>.pdf` (drafts: `Draft-<client>.pdf`). | P0 |
| FR-DL-2 | Drafts download with a "DRAFT" watermark on the Free plan. The Free plan adds a small "Made with Invoizmo" footer. | P0 |
| FR-DL-3 | Loading state; PDF ready within 5 seconds at p95. | P0 |
| FR-DL-4 | Print view and PNG export. | P1 |
| FR-DL-5 | Email the invoice PDF to the client (sets status to Sent). | P1 |

## 12. Trash and Archive

### 12.1 When to use which

| | Archive | Trash |
| --- | --- | --- |
| Purpose | Hide a finished invoice but keep it as a record | Remove an invoice the user no longer wants |
| Allowed on | Sent and Paid invoices | Any invoice |
| Data kept | Forever | 30 days, then permanently erased |
| Reversible | Anytime ("Unarchive") | Within 30 days ("Restore") |
| Where it appears | Dashboard tab "Archived" | Menu → Trash |

### 12.2 Requirements

| ID | Requirement | Pri |
| --- | --- | --- |
| FR-ARC-1 | **Archive** hides the invoice from All, Sent, Paid and Overdue and shows it under Archived. **Unarchive** returns it. Status is unchanged. | P0 |
| FR-TRASH-1 | Delete moves the invoice to Trash (sets `deletedAt` and `purgeAt = deletedAt + 30 days`); it leaves the dashboard and counts. | P0 |
| FR-TRASH-2 | The Trash page lists items with days remaining. | P0 |
| FR-TRASH-3 | **Restore** returns the invoice with its previous status and archive state. | P0 |
| FR-TRASH-4 | **Delete forever** requires a confirmation dialog. | P0 |
| FR-TRASH-5 | Permanent deletion after 30 days via a MongoDB TTL index on `purgeAt` (`expireAfterSeconds: 0`), plus a daily `node-cron` sweep as a fallback. | P0 |
| FR-TRASH-6 | Amber warning badge when 5 days or fewer remain. | P1 |

## 13. Pricing and Plan Limits

| Feature | Free Forever (₹0) | Pro (₹600 per month) |
| --- | --- | --- |
| New invoices per month | 5 | Unlimited |
| Templates | 2 (Classic, Modern) | All |
| Fonts | 4 basic | All 8+ |
| Color scheme | Presets | Presets and custom accent |
| Custom logo | No | Yes |
| Signature (typed and drawn) | Yes | Yes |
| All currencies and tax percentage | Yes | Yes |
| Status tracking (Sent, Paid, Overdue) | Yes | Yes |
| PDF download | Footer "Made with Invoizmo"; drafts watermarked | No footer, no watermark |
| Archive and Trash (30 days) | Yes | Yes |
| Support | Email, best effort | Priority email |

**Rules**

- "New invoice" means a draft created in the calendar month (duplicates count). The limit resets monthly and is checked on the server.
- Hitting the limit shows an upgrade prompt, not an error.
- Downgrading keeps all existing invoices readable and downloadable; only creation is limited.
- **Currency note:** the product supports every currency, but the plan is priced in ₹ for the India launch. The Pricing page shows ₹ prices and a line "Pricing in other currencies coming soon." Add a USD price when billing goes international.
- **Billing (P1):** Razorpay subscriptions. Until then the Pro button says **Join waitlist**.

## 14. Tech Stack and Architecture

**Version Safety Rule.** This PRD lists no version numbers. Before writing `package.json`, check each package's latest stable release and advisories, run `npm show <pkg> version` and `npm audit`, use `^` ranges, and use the current Node.js Active LTS. AI assistants must web-search each dependency and state what they verified.

### 14.1 Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Runtime | Node.js (Active LTS) | |
| Frontend | React with Next.js (App Router) | Public pages SSR for SEO, app pages client-side |
| Styling | Tailwind CSS | Brand tokens from section 4 |
| Language | TypeScript (strict) | |
| Backend | Node.js with Express | REST under `/api/v1` |
| Database | MongoDB Atlas with Mongoose | Restricted DB user, IP allowlist |
| Auth | Email and password only | JWT access and refresh tokens; no Passport, no OAuth |
| Validation | Zod | Env, request bodies and forms |
| Security | bcryptjs, helmet, cors, express-rate-limit, express-mongo-sanitize | Per blueprint |
| Email | nodemailer with SMTP (Resend, Brevo or SES) | Verify, reset, contact |
| Jobs | node-cron | Trash sweep fallback |
| PDF | Headless Chromium (Puppeteer or Playwright) rendering the same React template as the preview | Pixel-identical |
| Frontend libraries | React Hook Form + Zod, TanStack Query, Axios, signature canvas library, DOMPurify | |
| Logging | winston, @sentry/node | Redact secrets and PII |
| Billing (P1) | Razorpay | |
| Deploy | Vercel (frontend), Render or Railway (API), Atlas (DB) | |

**Token standard:** access JWT 15 minutes, in memory, sent as `Authorization: Bearer`. Refresh token 7 days in an `HttpOnly; Secure; SameSite=Strict` cookie, hashed in the DB, rotated on every use. `SameSite=Strict` needs app and API on the same site, so use `invoizmo.com` and `api.invoizmo.com`.

### 14.2 Request Flow

1. The browser loads a Next.js page from Vercel.
2. The page calls the Express API with the access token.
3. Express runs the middleware chain, validates with Zod, checks plan limits, and reads or writes MongoDB.
4. For a download, the API renders the invoice HTML in headless Chromium (from a short-lived signed print route) and streams back the PDF.
5. Emails go out through SMTP.

### 14.3 Repository Structure

```text
Invoizmo/
├── backend/
│   ├── src/
│   │   ├── server.ts, app.ts
│   │   ├── config/ (env.ts, db.ts)
│   │   ├── middleware/ (requireAuth, validate, planLimit, errorHandler)
│   │   ├── modules/ (auth, users, invoices, templates, trash, contact)
│   │   ├── services/ (email, pdf, cron)
│   │   └── utils/ (jwt, ownershipCheck, tokenCompare, money)
│   ├── postman/, .env.example, tsconfig.json (strict)
├── frontend/
│   ├── src/
│   │   ├── app/ ((public) and (app) route groups)
│   │   ├── lib/ (env.ts, api/client.ts, api/refreshClient.ts)
│   │   ├── auth/ (AuthProvider, tokenStore: memory only)
│   │   ├── components/ (RequireAuth, ErrorBoundary, InvoiceTemplate, SignaturePad)
│   │   └── features/<resource>/ (api.ts, components/, types.ts)
└── docs/ (PRD.md, API.md)
```

Never commit `.env*` (except `.env.example`), `node_modules`, `dist`, `.next`, keys or logs. Keep a `.cursorignore` that mirrors the sensitive paths.

### 14.4 Environment Variables

```env
# backend/.env.example
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/invoizmo
JWT_ACCESS_SECRET=replace_with_64_char_hex
JWT_REFRESH_SECRET=replace_with_different_64_char_hex
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=your_smtp_api_key
EMAIL_FROM=noreply@invoizmo.com
SUPPORT_EMAIL=support@invoizmo.com
PDF_MAX_CONCURRENCY=2
SENTRY_DSN=

# frontend/.env.example
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Validate env with Zod at startup; the app must crash on bad config. Never put a secret in a `NEXT_PUBLIC_*` variable.

### 14.5 Middleware Order (`app.ts`)

1. Sentry request handler → 2. `helmet()` → 3. `cors()` with an explicit origin list (never `*`) → 4. `express.json({ limit: '10kb' })` and `cookie-parser` (upload routes get their own limit) → 5. `express-mongo-sanitize` → 6. `morgan` (dev only) → 7. global limiter, 100 per minute → 8. auth limiter, 10 per minute → 9. separate limiters for `/contact` and PDF → 10. routes under `/api/v1` → 11. Sentry error handler → 12. central `errorHandler`.

`GET /health` (liveness, no DB call) and `GET /ready` (200 only if MongoDB is connected, else 503) are unauthenticated and excluded from strict rate limits.

### 14.6 Response Shapes and Error Codes

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "email": "Invalid email" } } }
```

| HTTP | Code | When |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Zod failed |
| 400 | `INVALID_REQUEST` | Logically invalid (for example due date before issue date) |
| 400 | `INVALID_STATE_TRANSITION` | Status change not allowed (for example Paid → Sent without marking unpaid) |
| 400 | `CONFIRM_TEXT_MISMATCH` | Destructive confirmation wrong |
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, `REFRESH_TOKEN_INVALID`, `INVALID_CREDENTIALS` | Auth problems |
| 403 | `EMAIL_NOT_VERIFIED` | Download or mark sent before verification |
| 403 | `PLAN_LIMIT_REACHED` | Free plan limit |
| 404 | `NOT_FOUND` | Missing or not owned by this user |
| 409 | `CONFLICT` | Duplicate email or invoice number |
| 423 | `ACCOUNT_LOCKED` | Too many failed logins |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unhandled; check Sentry |

## 15. Data Model (MongoDB)

Every invoice query filters by `userId`. A user can never read another user's data.

| Collection | Key fields | Indexes |
| --- | --- | --- |
| users | name, email, passwordHash, emailVerified, plan (free/pro), business {name, address, taxId, phone, website}, logoUrl, signatureUrl, defaults {currency, paymentTermsDays, notes, terms}, invoicePrefix, failedLogins, lockedUntil, createdAt | unique `email` |
| invoices | userId, number, status (draft/sent/paid), archivedAt, templateId, font, colorScheme, currency, seller, client, items[] {description, quantity, unit, unitPriceMinor, amountMinor}, discount {type, value}, taxName, taxPercent, subtotalMinor, discountMinor, taxMinor, totalMinor, issueDate, dueDate, sentAt, paidAt, notes, terms, paymentDetails, logoUrl, signature, deletedAt, purgeAt, createdAt, updatedAt | unique `(userId, number)` (partial, only when number exists); `(userId, status, archivedAt, deletedAt, createdAt)`; TTL on `purgeAt` |
| counters | userId, series, seq | unique `(userId, series)` |
| refreshTokens | userId, tokenHash, expiresAt, revokedAt, userAgent | TTL on `expiresAt` |
| emailTokens | userId, type (verify/reset), tokenHash, expiresAt, usedAt | TTL on `expiresAt` |
| loginAttempts | email, count, lockedUntil | TTL |
| contactMessages | name, email, subject, message, createdAt | `createdAt` |
| subscriptions (P1) | userId, plan, razorpayId, status, currentPeriodEnd | `userId` |

`overdue` is computed at read time (status is sent and dueDate is before today). It is never stored. The previous status needs no separate field because Trash and Archive are flags.

## 16. API (`/api/v1`)

### 16.1 Endpoint Index

| Area | Endpoints |
| --- | --- |
| Auth | POST `/auth/signup`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password` |
| User | GET and PATCH `/users/me`, DELETE `/users/me`, GET `/users/me/export`, POST and DELETE `/users/me/signature`, POST `/users/me/logo` |
| Invoices | GET `/invoices` (status, archived, search, page, sort), POST `/invoices`, GET and PATCH `/invoices/:id`, POST `/invoices/:id/mark-sent`, `/mark-paid`, `/mark-draft`, `/archive`, `/unarchive`, `/duplicate`, DELETE `/invoices/:id` (to trash), GET `/invoices/:id/pdf` |
| Trash | GET `/trash`, POST `/trash/:id/restore`, DELETE `/trash/:id` |
| Templates | GET `/templates` |
| Contact | POST `/contact` |
| Billing (P1) | POST `/billing/subscribe`, `/billing/webhook` |

### 16.2 Key Endpoints

#### POST /api/v1/auth/signup
**Auth:** No. **Body:** `{ "name": "Asha Rao", "email": "asha@example.com", "password": "Passw0rd!" }`
**201:** `{ "success": true, "data": { "message": "Check your email to verify your account" } }`. A duplicate email returns the same 201 message.
**Errors:** 400 `VALIDATION_ERROR`, 429 `RATE_LIMIT_EXCEEDED`.

#### POST /api/v1/auth/login
**Auth:** No. **Body:** `{ "email": "…", "password": "…" }`
**200:** `{ "success": true, "data": { "accessToken": "<jwt>", "user": { "id": "…", "plan": "free", "emailVerified": true } } }` and an HttpOnly refresh cookie.
**Errors:** 401 `INVALID_CREDENTIALS`, 423 `ACCOUNT_LOCKED`, 429.

#### POST /api/v1/invoices
**Auth:** Yes. **Body:** `{ "templateId": "classic", "currency": "INR", "duplicateFrom": "<id>" }` (last two optional).
**201:** a draft pre-filled from Settings, with `number: null`.
**Errors:** 403 `PLAN_LIMIT_REACHED`, 404 (bad `duplicateFrom`).

#### PATCH /api/v1/invoices/:id
**Auth:** Yes. **Body:** any content or styling field (items, client, discount, tax, font, color, dates, notes). The server recomputes all totals and ignores totals sent by the client. Paid invoices accept only notes.
**200:** the updated invoice. **Errors:** 400, 404, 409 (duplicate custom number).

#### POST /api/v1/invoices/:id/mark-sent
**Auth:** Yes. Assigns the next number atomically if none exists, sets `status=sent` and `sentAt`.
**200:** `{ "invoice": { "status": "sent", "number": "INV-0007" } }`
**Errors:** 403 `EMAIL_NOT_VERIFIED`, 400 `INVALID_STATE_TRANSITION`, 404.

#### POST /api/v1/invoices/:id/mark-paid
**Auth:** Yes. Allowed from Sent only. Sets `status=paid` and `paidAt`.
**Errors:** 400 `INVALID_STATE_TRANSITION`, 404.

#### GET /api/v1/invoices/:id/pdf
**Auth:** Yes. **Query:** `?size=A4|Letter`. **200:** `application/pdf` attachment.
**Errors:** 403 `EMAIL_NOT_VERIFIED`, 404, 429.

#### DELETE /api/v1/invoices/:id
Moves to Trash. **200:** `{ "purgeAt": "<date 30 days ahead>" }`. **Errors:** 404.

#### POST /api/v1/trash/:id/restore
Clears `deletedAt` and `purgeAt`. **200:** the invoice with its original status. **Errors:** 404.

Every other endpoint follows the same shape: description, auth, request, response, errors.

## 17. Security, Quality and CI

### 17.1 Security Checklist (run before every deploy)

**Environment:** no secrets in source; `.env*` ignored; Zod env validation; access and refresh secrets differ and are 64 characters or longer; MongoDB user restricted, Atlas IP allowlist set; HTTPS only.

**Authentication:** 15-minute access token; refresh token in an HttpOnly, Secure, SameSite=Strict cookie, hashed, rotated, reuse revokes all sessions; `crypto.timingSafeEqual()` for token comparison; email and reset tokens from `crypto.randomBytes(32)`, hashed, single-use, expiring; lockout after 5 failures; generic messages (no email enumeration).

**API:** helmet, CORS allowlist, mongo-sanitize, rate limits, 10 KB body limit; Zod on every route; `assertOwnership()` on every invoice controller with 404 on a wrong owner; every query filters by `userId`; totals, status transitions and plan limits enforced on the server only; uploads validated by type and size (logo 2 MB, signature PNG); honeypot and rate limit on Contact; PDF print route accepts only a short-lived signed token.

**Data and privacy:** bcrypt cost 10 or higher; `DELETE /users/me` needs confirmation text; `GET /users/me/export` exists; TTL indexes on trash, tokens and login attempts; logs and Sentry redact passwords, tokens and PII.

**Frontend:** access token in memory only; single-flight refresh and a separate `refreshClient`; no `dangerouslySetInnerHTML` without DOMPurify; only `http:` and `https:` URLs from users; all forms use React Hook Form + Zod; loading and error states everywhere; paginated lists; error boundary; `RequireAuth` on every protected route (section 6.5); no tokens in `console.log`.

**Infrastructure:** `/health` and `/ready`; `npm audit` clean of high and critical issues; Dependabot; `npm ci` in CI.

### 17.2 Non-Functional Requirements

| Area | Requirement |
| --- | --- |
| Performance | LCP under 2.5 s on a mid-range phone; API p95 under 400 ms; PDF p95 under 5 s |
| Reliability | 99.5% uptime; daily Atlas backups with a tested restore; idempotent cron sweep |
| Accessibility | WCAG 2.1 AA: keyboard, labels, contrast, alt text |
| Compatibility | Latest two versions of Chrome, Edge, Safari, Firefox; responsive from 360 px |
| SEO | SSR public pages, unique titles and descriptions, sitemap, robots.txt |
| Quality | Strict TypeScript, ESLint; unit tests for totals, rounding, numbering, state transitions and trash purge; end-to-end tests for signup → create → mark sent → download |

### 17.3 CI (every pull request)

`npm ci` → `npm run lint` → `npx tsc --noEmit` → `npm test` → `npm audit --audit-level=high` → secret scan (gitleaks or GitHub secret scanning).

### 17.4 Postman Run Order

1. Signup and verify. 2. Login. 3. GET `/users/me`. 4. POST `/invoices`. 5. PATCH `/invoices/:id` and check totals. 6. POST `/mark-sent` (number INV-0001), then repeat with a second invoice (INV-0002). 7. POST `/mark-paid`. 8. GET `/pdf`. 9. DELETE, GET `/trash`, restore. 10. Refresh, logout, then GET `/users/me` and expect 401. Test every response scenario (200, 201, 400, 401, 403, 404, 409, 423, 429).

## 18. Build Prompts (for Cursor, Copilot or Claude, in order)

1. **Bootstrap:** "Build Invoizmo using Next.js + React + Tailwind and Node.js + Express + MongoDB/Mongoose in strict TypeScript. Follow PRD sections 14–17. Web-search each dependency's latest version and advisories first and tell me what you verified. Create the repo structure, both `.env.example` files, Zod env validation, `.gitignore`, `.cursorignore`, README, CI workflow and an empty Postman collection. No Google OAuth, socket.io or web-push."
2. **Auth and settings:** "Implement section 8 (FR-AUTH-1 to 8, FR-SET-1 to 3): signup, verify, resend, login, refresh with rotation and reuse detection, logout, forgot/reset, lockout, settings, delete and export, using the error codes in 14.6."
3. **Invoice core:** "Implement the invoice model, `money.ts`, `calculateTotals()` (rule in 11.2 with tests for rounding and 0-, 2-, 3-decimal currencies), the lifecycle in 9.1 with `INVALID_STATE_TRANSITION`, atomic numbering (11.1), archive, trash with TTL, duplicate, plan limits and `assertOwnership`."
4. **PDF and templates:** "Implement the `InvoiceTemplate` component with 4 templates taking font, colors, logo and signature props, a signed print route, and a Puppeteer/Playwright PDF service with limited concurrency. Add the DRAFT watermark and Free footer."
5. **Dashboard and editor:** "Build section 9.2 and section 10: dashboard with tabs All, Draft, Sent, Paid, Overdue, Archived, search and row actions; template picker; editor with content, styling, typed and drawn signature, autosave, live preview."
6. **Public pages:** "Build section 7: Home with all listed sections, About, Contact, Privacy, Terms, Pricing (section 13), with the brand theme, SEO metadata, sitemap and robots.txt."
7. **Hardening:** "Apply section 17.1 end to end, run `npm audit`, finish the Postman collection and write deploy steps for Vercel, Render and Atlas."

## 19. Risks and Open Questions

| Risk or question | Mitigation or default |
| --- | --- |
| PDF differs from the preview | Same React template for both; visual regression tests |
| Chromium is heavy on small hosts | Concurrency cap, queue, or a dedicated PDF worker |
| Cross-site cookie failure | One registrable domain for app and API |
| Spam signups and contact abuse | Rate limits, honeypot, email verification |
| "Mark as sent" is manual in the MVP | P1 adds real email sending; confirm this is acceptable |
| Is ₹600 monthly or yearly? | Assumed monthly (confirm) |
| Free plan limit of 5 invoices per month | Assumed (confirm after pilot) |
| Partial payments | Not in MVP: an invoice is Paid or not; P2 adds payments |
| Tax and invoice rules vary by country | User-entered tax; no advice; accountant review for India defaults |

---

## Appendix A: Building with Lovable

Use this path if you build in Lovable instead of the custom stack. The product rules in sections 2–13 stay the same; only the technology changes. I wrote these details from memory of Lovable, so check them against your project.

| Part | Lovable | Replaces |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite + Tailwind + shadcn/ui | Next.js |
| Backend | Lovable's built-in backend (Postgres, Auth, Storage, Edge Functions) | Node, Express |
| Database | Postgres with Row Level Security (RLS) | MongoDB |
| Auth | Email and password with verification | Custom JWT |
| Files | Private storage bucket `branding` | Upload code |
| PDF | In the browser (html2pdf.js or jsPDF + html2canvas) | Headless Chromium |
| Cleanup job | Daily scheduled job deleting trash older than 30 days | node-cron / TTL |

**Tables:** `profiles` (settings, plan, prefix, next number), `invoices` (fields as in section 15, snake_case, `status` of `draft`/`sent`/`paid`, `archived_at`, `deleted_at`), `contact_messages`. RLS on all tables: users touch only their own rows. A database function `mark_invoice_sent` assigns the next number atomically.

**Prompts (paste one at a time and test after each):**

1. "Build Invoizmo, an invoice generator SaaS, with React, TypeScript, Tailwind and shadcn/ui. Brand: Inter, Indigo #4F46E5, Emerald #10B981, Sky #0EA5E9, Amber #F59E0B, Red #EF4444, Slate neutrals. Public pages (routes: /, /pricing, /about, /contact, /privacy-policy, /terms): Home (header, hero, features, how it works, pricing teaser, final call to action, footer), About, Contact (saves to a contact_messages table), Privacy, Terms, Pricing (Free Forever ₹0 vs ₹600/month; Pro button says Join waitlist), and a 404. No login yet."
2. "Add email-only auth: signup, login, forgot and reset password, email verification. Create a profiles table (name, business details, default currency, payment terms, invoice prefix, next number, plan) auto-created on signup, with RLS. Protect /dashboard, /invoice/new, /invoice/:id, /trash and /settings (redirect to /login?next=<page>). Build /settings."
3. "Create an invoices table with RLS: status draft, sent or paid; archived_at; deleted_at; template, font, accent color, currency, seller, client, items, discount, tax, totals in the smallest currency unit, dates, notes, terms, payment details. Number unique per user. Build the dashboard with tabs All, Draft, Sent, Paid, Overdue (sent and past due), Archived; search; row actions; a Create invoice button; empty state. Hide trashed items."
4. "Build the Create flow: a template picker with 4 templates (Free can use 2), then an editor with a live preview. Editable: seller, client, dates, line items, discount, tax name and percent, currency (all world currencies), notes, terms, payment details, font (8 choices), color scheme, logo upload (Pro). Totals are calculated: line = qty × price; taxable = subtotal − discount; tax = taxable × percent / 100. Autosave."
5. "Add signature (typed with script fonts, or drawn on a canvas, saved as a transparent PNG), the database function mark_invoice_sent that assigns the next number with the user's prefix atomically, buttons Mark as sent and Mark as paid, and a Download PDF button that matches the preview (Free plan: footer and DRAFT watermark)."
6. "Add Archive and Unarchive, and Trash: moving to trash sets deleted_at; /trash lists items with days left, Restore, and Delete forever with confirmation; a daily job erases items older than 30 days. Enforce Free limits on the backend: 5 new invoices per month and 2 templates, with an upgrade message."
7. "Review the app: RLS on every table, private storage per user, form validation, loading and empty states, 360px mobile layout, accessibility labels, page titles and meta descriptions. Fix anything missing."

**Tips:** one prompt at a time; paste exact errors into the chat to get fixes; use version history to roll back; never paste real keys into chat.