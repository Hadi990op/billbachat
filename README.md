# ⚡ BillBachat — Bijli ka Bill Bachao!

Pakistan's first electricity bill slab optimizer + WhatsApp alert system.

## What it does
- 📊 **Check your bill** — real-time bill lookup from PITC (LESCO, IESCO, MEPCO, etc.)
- ⚠️ **Slab alerts** — get WhatsApp alert before you cross a slab boundary
- 💡 **Save tips** — personalized recommendations to keep your bill low
- 📱 **WhatsApp bot** — subscribe via WhatsApp, get daily alerts

## Tech Stack
- **Frontend**: Next.js 16 + Tailwind CSS
- **WhatsApp Bot**: Baileys (WhatsApp Web API)
- **Bill Data**: PITC portal (bill.pitc.com.pk)
- **Auth**: JWT-based phone auth

## Structure
```
web/           — Next.js web app
whatsapp-bot/  — WhatsApp bot (Baileys)
UX-PLAN.md     — Design documentation
```

## Pricing
- **Free**: 1 bill check/day
- **Pro**: Rs.99/mo — unlimited checks + WhatsApp alerts
- **Family**: Rs.199/mo — 5 connections

## Setup
```bash
# Web app
cd web && npm install && npm run build && npm start

# WhatsApp bot
cd whatsapp-bot && npm install && node server.js
```

## Live Demo
- https://guilt-attend-cabbage-state.2n6.me/billbachat/
- https://billbachat.2604-f440-5-3-3-67a1-d07e-ea61.nip.io/

---
Made in Pakistan 🇵🇰
