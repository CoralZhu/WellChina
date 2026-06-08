# WellChina Architecture

## Stack
- Mobile: React Native + Expo
- Routing: Expo Router
- State: Zustand
- i18n: i18next (zh/en/ru)
- Backend: Supabase (Postgres + Edge Functions)
- AI: Claude via Supabase Edge Function
- Types: TypeScript

## Core Data Flow

User fills 6-step form
→ CarePreparationInput saved to Zustand
→ carePlanApi.ts calls Supabase Edge Function
→ Edge Function calls Claude API
→ Returns CarePreparationResult JSON
→ Fallback: carePreparationGenerator.ts if Claude unavailable
→ care-result.tsx renders checklist and summary

User submits booking
→ BookingRequest saved to Zustand
→ Written to Supabase bookings table (async, with fallback)
→ trip.tsx reads from Zustand store

User inputs doctor notes
→ visitSummaryGenerator.ts generates VisitSummary
→ Saved to Zustand
→ visit-summary.tsx renders 3-tab summary

## Design Principles

1. Types first — all data shapes defined before UI work
2. Store before UI — Zustand extended before pages rewritten
3. Mock before backend — flow tested locally before connecting APIs
4. Graceful degradation — no env = local mode, no crash
5. AI as a node — Claude called once with structured input,
   returns structured JSON, frontend owns workflow state

## Security
- ANTHROPIC_API_KEY in Supabase secrets only, never frontend
- Supabase anon key safe for frontend with RLS enabled
- No auth in MVP, guest session model
