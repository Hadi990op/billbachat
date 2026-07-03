# BillBachat — UX Flow Plan

## User: Aam Pakistani
- Mobile pe chalta hai (mostly Android, low-end phones)
- WhatsApp sabse zyada use karta hai (110M+ users)
- Bijli ka bill samajh nahi aata — slabs, units, FPA, taxes sab confuse karta hai
- English thori aati hai, Urdu/Roman Urdu prefer karta hai
- Online payment karna jaanta hai (JazzCash/Easypaisa)
- Rs. 99 dena willing hai agar paise bach rahe hon

## Design Philosophy: "3-Click Rule"
- User ko 3 clicks me apna answer mil jaye
- Koi technical jargon nahi ("units", "kWh", "tariff" — nahi)
- Sab kuch Urdu/Roman Urdu me
- Mobile-first, WhatsApp-first
- Bade buttons, simple text, clear colors (green=safe, red=warning)

---

## Screen 1: Landing Page (Website)

```
┌─────────────────────────┐
│   ⚡ BillBachat         │
│   Bijli ka bill bachao   │
├─────────────────────────┤
│                         │
│   [Big Hero Image]      │
│                         │
│   "Bijli ka bill        │
│    shock nahi aana      │
│    chahiye!"            │
│                         │
│   Aapka bill kabhi      │
│   pichle mahine se      │
│   zyada na ho — hum     │
│   pehle bata denge.     │
│                         │
│  ┌───────────────────┐  │
│  │ Shuru Karein →    │  │
│  │ (Bada Button)     │  │
│  └───────────────────┘  │
│                         │
│   Pehla mahina FREE     │
│   Phir Rs. 99/month     │
│                         │
│   ⭐ 4.8/5 (1,200+      │
│   users)                │
│                         │
│  ┌────┐  ┌────┐  ┌────┐ │
│  │ 📱 │  │ ⚡ │  │ 💰 │ │
│  │WhatsApp│ │Bill│  │Bachat│
│  │Alerts  │ │Track│ │Tips│
│  └────┘  └────┘  └────┘ │
└─────────────────────────┘
```

**What user sees:**
- Big headline: "Bijli ka bill shock nahi aana chahiye!"
- Subtext: "Aapka bill kabhi pichle mahine se zyada na ho — hum pehle bata denge."
- One big button: "Shuru Karein →"
- Trust signals: "Pehla mahina FREE", star rating

**Click "Shuru Karein" → Screen 2**

---

## Screen 2: Sign Up (Simple)

```
┌─────────────────────────┐
│   ← Back                │
├─────────────────────────┤
│                         │
│   Apna number daalein   │
│                         │
│  ┌───────────────────┐  │
│  │ 03XX XXX XXXX     │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ OTP Bhejo →       │  │
│  └───────────────────┘  │
│                         │
│   Ya                    │
│                         │
│  ┌───────────────────┐  │
│  │ Google se login  │  │
│  └───────────────────┘  │
│                         │
│   WhatsApp pe bhi      │
│   sign up karein       │
│   (link)               │
└─────────────────────────┘
```

**What user sees:**
- Sirf phone number dena hai
- OTP aayega (WhatsApp ya SMS)
- Google login bhi option (lazmi nahi)
- WhatsApp se bhi signup (alternative path)

**Enter OTP → Screen 3**

---

## Screen 3: Bill Connect (Most Important!)

```
┌─────────────────────────┐
│   ← Back                │
├─────────────────────────┤
│                         │
│   Step 1 of 2            │
│                         │
│   Apna electricity       │
│   company select karein │
│                         │
│  ┌───────────────────┐  │
│  │ LESCO (Lahore) ▼ │  │
│  └───────────────────┘  │
│                         │
│   (Dropdown: LESCO,     │
│    IESCO, MEPCO, K-     │
│    Electric, etc.)      │
│                         │
│   ─────────────         │
│                         │
│   Step 2 of 2            │
│                         │
│   Bill ka reference      │
│   number daalein        │
│                         │
│  ┌───────────────────┐  │
│  │ 14-digit number  │  │
│  └───────────────────┘  │
│                         │
│   ❓ Reference number  │
│   kahan milega? (help) │
│                         │
│   [Help modal shows:    │
│    "Bill ke upar wala   │
│    14-digit number      │
│    dekhein" + image]    │
│                         │
│  ┌───────────────────┐  │
│  │ Bill Connect →   │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ 📷 Bill ka photo  │  │
│  │   scan karein     │  │
│  │   (OCR feature)   │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**What user sees:**
- Apna electricity company select (dropdown)
- Reference number daalo (14-digit)
- Help button: "Reference number kahan milega?" — image popup
- **Photo scan option**: Bill ka photo le lo, OCR se auto-extract (advanced feature, phase 2)

**Click "Bill Connect" → Screen 4**

---

## Screen 4: Dashboard (Main App)

This is the heart of the app. User comes here every few days.

```
┌─────────────────────────┐
│  ⚡ BillBachat      👤    │
├─────────────────────────┤
│                         │
│   Aaj tareekh: 15 July   │
│   Bill period: July     │
│   (1-31 July)           │
│                         │
│  ┌───────────────────┐  │
│  │   Aapka Khata     │  │
│  │                   │  │
│  │   185 units       │  │
│  │   used so far     │  │
│  │                   │  │
│  │  ████████░░ 92%   │  │
│  │                   │  │
│  │  Limit: 200 units │  │
│  │  Bachat: 15 units  │  │
│  │  ⚠️ Sirf 15 aur!  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  Bill Prediction  │  │
│  │                   │  │
│  │  Is mahine ka    │  │
│  │  expected bill:   │  │
│  │                   │  │
│  │  Rs. 4,200        │  │
│  │  (pichle mahine  │  │
│  │  se Rs. 300 kam)  │  │
│  │                   │  │
│  │  ✅ Safe zone me  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  Bachat Tips 🎯   │  │
│  │                   │  │
│  │  • AC 24°C pe     │  │
│  │    lagao (3 units │  │
│  │    bachat)        │  │
│  │                   │  │
│  │  • Geyser 1 ghanta│  │
│  │    band (2 units) │  │
│  │                   │  │
│  │  • Iron ka kaam   │  │
│  │    sham ko karo   │  │
│  │    (peak hours)   │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  WhatsApp Alerts  │  │
│  │  ON 🔔            │  │
│  │                   │  │
│  │  Slab alert: ON   │  │
│  │  Bill ready: ON   │  │
│  │  Due date: ON     │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  History 📊       │  │
│  │                   │  │
│  │  May: 175 units   │  │
│  │  Jun: 190 units   │  │
│  │  Jul: 185 (ongoing)│ │
│  │                   │  │
│  │  Avg margin: 15%   │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Dashboard sections (top to bottom):**

### A. "Aapka Khata" (Your Account) — Hero Card
- Current units used this month
- Progress bar: how close to slab limit
- "Sirf 15 aur!" warning (red if close)
- Green if safe, yellow if warning, red if close

### B. "Bill Prediction" (Bill Estimate)
- Expected bill for this month
- Comparison with last month
- "Safe zone me" or "Slab cross karne wala!"

### C. "Bachat Tips" (Save Tips)
- 3 actionable tips based on current usage
- Each tip shows units saved
- Personalized (AC user → AC tips, geyser user → geyser tips)

### D. "WhatsApp Alerts" (Notification Settings)
- Slab alert (before crossing limit)
- Bill ready alert
- Due date reminder
- Toggle on/off

### E. "History" (Past Bills)
- Last 6 months units
- Average margin
- Trend (increasing/decreasing)

---

## Screen 5: WhatsApp Alert (How user gets notified)

User doesn't even need to open the app. This is the magic.

```
┌─────────────────────────┐
│  ⚡ BillBachat           │
├─────────────────────────┤
│                         │
│  ⚠️ BillBachat Alert     │
│  15 July, 2:00 PM       │
│                         │
│  Aapke ghar me 195      │
│  units use ho gaye hain.│
│                         │
│  200 unit ki limit me   │
│  sirf 5 units baaki!    │
│                         │
│  Agar 5 aur units use  │
│  kiye to aapka bill:    │
│                         │
│  Rs. 4,200 → Rs. 7,800  │
│  ( DOUBLE! )            │
│                         │
│  Bachat karein:         │
│  1. AC 1 ghanta band    │
│     karo (3 units)      │
│  2. Geyser band karo    │
│     (2 units)           │
│                         │
│  App me dekhein →       │
│  billbachat.pk/app      │
│                         │
│  ┌───────────────────┐  │
│  │ ✅ Samajh gaya     │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Tips aur dekhein  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**This is the killer feature.** User doesn't need to open app. WhatsApp pe alert aata hai:
- "Sirf 5 units baaki!"
- "Agar aur use kiya to bill double!"
- Actionable tips (AC band karo, geyser band karo)
- Link to app for details

---

## Screen 6: Payment (Subscription)

```
┌─────────────────────────┐
│   ← Back                │
├─────────────────────────┤
│                         │
│   BillBachat Pro        │
│                         │
│   Rs. 99/month          │
│                         │
│   ✅ WhatsApp slab      │
│     alerts              │
│   ✅ Bill prediction    │
│   ✅ Bachat tips        │
│   ✅ History tracking   │
│                         │
│   ─────────────         │
│                         │
│   Pehla mahina FREE     │
│   Phir Rs. 99/month     │
│                         │
│  ┌───────────────────┐  │
│  │ JazzCash se pay  │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Easypaisa se pay │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Raast se pay     │  │
│  └───────────────────┘  │
│                         │
│   Ya ek saal ka plan   │
│   Rs. 999 (2 mahine    │
│   FREE)                │
└─────────────────────────┘
```

**What user sees:**
- Clear pricing: Rs. 99/month
- Features list
- First month FREE
- Payment options: JazzCash, Easypaisa, Raast
- Annual plan: Rs. 999 (2 months free)

---

## Screen 7: Help & Support

```
┌─────────────────────────┐
│   ← Back                │
├─────────────────────────┤
│                         │
│   Madad (Help)          │
│                         │
│   ┌───────────────┐     │
│   │ ❓ Reference  │     │
│   │   number      │     │
│   │   kahan hai?  │     │
│   └───────────────┘     │
│                         │
│   ┌───────────────┐     │
│   │ ❓ Slab system│     │
│   │   kya hai?    │     │
│   └───────────────┘     │
│                         │
│   ┌───────────────┐     │
│   │ ❓ Bill kyun  │     │
│   │   zyada aaya? │     │
│   └───────────────┘     │
│                         │
│   ┌───────────────┐     │
│   │ 📞 WhatsApp    │     │
│   │   support     │     │
│   └───────────────┘     │
│                         │
│   ┌───────────────┐     │
│   │ 📧 Email      │     │
│   │   support    │     │
│   └───────────────┘     │
└─────────────────────────┘
```

---

## Onboarding Flow (Step by step)

```
User arrives
    │
    ▼
[Landing Page] "Bijli ka bill shock nahi aana chahiye!"
    │
    ▼ Click "Shuru Karein"
    │
[Sign Up] Phone number + OTP
    │
    ▼
[Bill Connect] Select company + enter ref number
    │           (or scan bill photo - phase 2)
    │
    ▼
[Dashboard] First view:
    │         "Aapka bill data load ho raha hai..."
    │         → Fetch from PITC API
    │         → Show current units, slab status
    │
    ▼
[WhatsApp Setup] "WhatsApp pe alerts chahiye?"
    │              → Verify WhatsApp number
    │              → Send test alert
    │
    ▼
[Free Trial] "Pehla mahina FREE!
    │          Koi card nahi chahiye."
    │
    ▼
[Dashboard Active] User starts using
    │
    ▼
[Day 25 of month] → WhatsApp alert:
    │               "Sirf 15 units baaki!
    │                Bill bachane ke tips..."
    │
    ▼
[Day 30 of month] → Bill generated
    │              → User sees "Aapne Rs. 3,200
    │                 bachaye is mahine!"
    │
    ▼
[Trial ending] → "Aapka free trial khatam
    │              ho raha hai. Rs. 99/month
    │              continue karein?"
    │
    ▼
[Payment] → JazzCash/Easypaisa/Raast
    │
    ▼
[Active Subscriber] 🎉
```

---

## Data Sources (How app knows user's units)

### Primary Source: PITC API (Free, scraping-based)
- GitHub: Riasat-420/electricity-api
- Endpoint: GET /api/bill?company=lesco&ref=12345678901234
- Returns: consumer_name, bill_month, units_consumed, payable_amount, due_date
- **Problem**: Only returns monthly bill data (after bill is generated)
- **Solution**: Use this for historical data + bill verification

### Secondary Source: User Manual Input (Simple)
- User enters current meter reading (mahine me 1-2 baar)
- App calculates: Current reading - Last reading = Units used
- **Problem**: User bhool jata hai
- **Solution**: WhatsApp reminder: "Meter reading daalne ka time ho gaya! 📊"

### Tertiary Source: AI Estimate (Phase 2)
- User tells which appliances they use + hours per day
- App estimates daily consumption
- Example: "AC 8 hours + geyser 1 hour + fans 24 hours = ~7 units/day"
- Daily estimate × days passed = expected units

### Best Approach: Hybrid
1. Bill aane ke baad: PITC API se actual units (auto)
2. Bill se pehle: User meter reading (manual, WhatsApp reminder)
3. In between: AI estimate (phase 2)

---

## Key UX Principles

### 1. No Technical Jargon
| Don't say | Say this |
|---|---|
| "kWh" | "units" |
| "tariff slab" | "limit" |
| "protected consumer" | "safe zone" |
| "FPA" | "fuel charges" (ya hide it) |
| "consumption" | "usage" |
| "NEPRA" | (hide it, internal) |
| "progressive tariff" | "zyada use = zyada rate" |

### 2. Colors
- 🟢 Green: Safe zone (under limit)
- 🟡 Yellow: Warning (close to limit)
- 🔴 Red: Danger (over limit)
- ⚡ Blue: App brand color
- White background, dark text (easy to read in sunlight)

### 3. Typography
- Urdu font: Noto Nastaliq Urdu (Google Font)
- English/Roman Urdu: Inter ya DM Sans
- Big text (aam Pakistani ke liye readable)
- Mobile-first: min 16px body, 24px headings

### 4. Buttons
- Bade buttons (min 48px height — thumb friendly)
- Clear action text: "Shuru Karein", "Bill Connect", "Pay Karein"
- One primary action per screen

### 5. WhatsApp Integration
- **Primary notification channel** (not push notifications)
- 110M+ Pakistanis use WhatsApp daily
- WhatsApp Business API:
  - Template messages (pre-approved by WhatsApp)
  - Free tier: 1000 conversations/month
  - Cost: ~$0.005 per message (negligible)

---

## MVP Scope (Phase 1 — Week 1 Build)

### Must Have (P0)
- ✅ Landing page
- ✅ Phone signup (OTP)
- ✅ Bill connect (company + ref number)
- ✅ Dashboard (current units, slab status, prediction)
- ✅ PITC API integration (fetch bill data)
- ✅ WhatsApp alert (slab warning)
- ✅ Payment (JazzCash/Easypaisa)
- ✅ Urdu language (Roman Urdu + Nastaliq option)

### Nice to Have (P1 — Week 2-3)
- Bill photo scan (OCR)
- AI appliance estimate
- Family plan (multiple meters)
- Detailed history charts
- Community tips (crowdsourced)

### Later (P2 — Month 2+)
- iOS app
- Load shedding alerts
- Gas bill tracking
- Solar panel recommendations
- Affiliate program

---

## Tech Stack

- **Frontend**: Next.js + Tailwind CSS (mobile-first)
- **Backend**: Next.js API routes + Supabase
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (phone OTP)
- **Payments**: JazzCash/Easypaisa API
- **WhatsApp**: WhatsApp Business Cloud API (Meta)
- **Bill Data**: PITC scraping API (self-hosted)
- **Hosting**: Vercel (free tier)
- **Cost**: ~$0 to start

---

## Success Metrics

- **Activation**: User connects bill → sees dashboard (target: 80%)
- **Aha moment**: First WhatsApp slab alert (target: within 7 days)
- **Retention**: User returns after 1 month (target: 60%)
- **Conversion**: Free trial → paid (target: 15%)
- **Revenue**: 1000 paying users × Rs. 99 = Rs. 99,000/month ($355/mo) by month 3
- **North Star**: "Units saved per user per month" (target: 20 units = Rs. 500+ saved)
