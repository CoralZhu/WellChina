# WellChina Demo Script — 3 Minutes

## The Problem (0:00 - 0:30)
Older international patients traveling to China for healthcare 
face uncertainty at every step: which hospital, how to explain 
symptoms, what documents to bring, how to share results with family.
Booking a hospital is the easy part. Everything around it is not.

## Meet Anna (0:30 - 1:00)
Anna is 72, from Russia, with chronic knee pain. She speaks Russian,
has never been to a Chinese hospital, and is traveling alone.
WellChina is designed for Anna.

## Core Flow (1:00 - 2:30)

1. Language Selection — Anna selects Russian, all content switches
2. Search — finds Peking Union Medical College Hospital
3. AI Care Preparation — answers 6 structured questions, receives
   a personalized care plan in Russian with checklist and 
   doctor questions
4. Booking Request — submits care request, status: pending review
5. Trip Dashboard — sees booking status and preparation checklist
6. Visit Summary — enters doctor notes, gets structured summary
   in Russian and Chinese for family and institution

## What This Is (2:30 - 3:00)
WellChina validates one question: can AI reduce uncertainty for 
older international patients in a foreign healthcare system?

## Technical Notes
Stack: React Native, Expo, TypeScript, Zustand, Supabase, i18next

Key decisions:
- Structured 6-step workflow instead of free chat
- Mock-first: full flow built before connecting any backend  
- API key never in frontend — Claude via Supabase Edge Function
- Graceful fallback — works in demo mode without API keys

Not in MVP: payment, real-time chat, diagnosis, App Store
Next: real Claude API, Whisper transcription, DeepL translation

---
