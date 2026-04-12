# ShieldScore

Real-time account health monitoring for Stripe merchants.

**"Know before Stripe freezes you."**

ShieldScore tracks your dispute and fraud ratios against 2026 Visa VAMP, Mastercard CMM/ECM card network thresholds, monitors for hidden account restrictions, and alerts you before Stripe's automated systems take action.

## Architecture

- **Frontend:** Stripe UI Extension (React + TypeScript)
- **Backend:** Next.js on Vercel
- **Database:** PostgreSQL via Supabase
- **Alerts:** Resend (email), Slack & Twilio (Phase 2)

## Setup

1. Copy `.env.local.example` to `.env.local` in `backend/` and fill in your keys
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql` via Supabase SQL Editor
3. `cd backend && npm install && npm run dev`
4. For Stripe webhooks locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Security Model

ShieldScore uses **read-only OAuth scopes only**. It cannot move funds, create charges, issue refunds, or access raw cardholder data.
