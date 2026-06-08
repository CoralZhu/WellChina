# WellChina Core Flow Route Map

Audit date: 2026-05-27

Scope: read-only audit of the current Expo Router mobile app. This document maps the MVP flow:

```text
Language Selection -> Home -> Institution Detail -> AI Care Preparation -> Booking Request -> Trip -> Visit Summary
```

Status labels:

- `usable`: works as intended for MVP
- `mock only`: renders but uses hardcoded data
- `needs rewrite`: structure needs to change for the MVP flow

## Executive Summary

The current app has most of the route skeleton needed for the MVP, but the data handoff is not yet wired as a healthcare workflow.

- Language selection works and updates Zustand/i18n, but currently routes through onboarding before Home.
- Home, Search, and Institution Detail render useful mock data from `apps/mobile/data/mock.ts`.
- AI Care Preparation does not exist yet as a structured workflow. Current `chat.tsx` is a generic FAQ chatbot.
- Booking is currently a package/payment-style checkout. It needs to become a booking request / care request form.
- Trip is currently a static mock itinerary. It needs to read the created booking request.
- Visit Summary has no current route or data model.
- `appStore.ts` only stores language/onboarding/guest flags. It does not store selected institution, AI preparation, booking, trip, or visit summary state.

## Core Flow Data Contract

Minimum payload that should survive the full MVP flow:

```ts
type CoreFlowContext = {
  language: 'zh' | 'en' | 'ru';
  institutionId?: string;
  serviceId?: string;
  selectedPackage?: 'basic' | 'standard' | 'premium';
  aiPreparation?: {
    symptomsSummary: string;
    targetCity?: string;
    preferredLanguage: 'zh' | 'en' | 'ru';
    travelWindow?: string;
    medicalHistory?: string;
    patientQuestions?: string[];
    preparationChecklist: string[];
    institutionFacingSummary: string;
  };
  bookingRequest?: {
    bookingId: string;
    institutionId: string;
    serviceId: string;
    selectedPackage: string;
    contactName: string;
    contactMethod: string;
    preferredLanguage: 'zh' | 'en' | 'ru';
    symptomsSummary: string;
    travelWindow?: string;
    status: 'pending_review';
  };
  visitSummary?: {
    bookingId: string;
    doctorAdviceSummary: string;
    medicationNotes?: string;
    recoveryNotes?: string;
    followUpRecommendation?: string;
    familyShareSummary: {
      primaryLanguage: string;
      zh?: string;
      en?: string;
      ru?: string;
    };
  };
};
```

## Route Map

### 1. Language Selection

File path: `apps/mobile/app/language.tsx`

Current status: `usable`

Current route:

- Route: `/language`
- On selection: `router.push('/onboarding')`
- Entry redirect comes from `apps/mobile/app/index.tsx`: if `hasOnboarded` is false, it redirects to `/language`; if true, to `/(tabs)/home`.

Current data used:

- Local constant `LANGUAGES`
- Zustand store from `useAppStore()`
- Calls `setLanguage(code)`
- `setLanguage` also calls `i18n.changeLanguage(lang)`
- No route params
- No backend

Data currently passed forward:

- Stores `language` globally in Zustand/i18n.
- Does not pass route params.
- Routes to onboarding, not directly to Home.

Data needed for next page:

- Required:
  - `language`
- Optional:
  - `hasOnboarded`
  - `isGuest`

MVP handoff target:

- `language -> Home`
- Current handoff is acceptable if onboarding remains, but the core MVP flow should treat onboarding as optional/non-core.

Notes:

- No persistence is currently visible in `appStore.ts`, so language may reset on app reload unless another layer persists it elsewhere.

### 2. Home

File path: `apps/mobile/app/(tabs)/home.tsx`

Current status: `mock only`

Current route:

- Route: `/(tabs)/home`
- Search CTA routes to `/search`
- AI assistant banner routes to `/chat`
- Service category routes to `/search?type={category}`
- Destination cards route to `/search?city={dest.id}`
- Institution cards route via `InstitutionCard` to `/institution/{item.id}`

Current data used:

- `useTranslation()` for localized UI strings
- `useAppStore().language`
- Local `SERVICE_CATEGORIES`
- `INSTITUTIONS` from `apps/mobile/data/mock.ts`
- `DESTINATIONS` from `apps/mobile/data/mock.ts`
- `InstitutionCard` component
- Local `searchText` state is declared but not used
- No backend

Data currently passed forward:

- To Search:
  - `type` route param from service category taps
  - `city` route param from destination taps
- To Institution Detail:
  - `institutionId` as dynamic route segment through `InstitutionCard`: `/institution/${item.id}`
- To AI Chat:
  - No institution, symptom, or context is passed to `/chat`

Data needed for next page:

- For Home -> Search:
  - `query?: string`
  - `type?: 'western' | 'tcm' | 'wellness' | 'companion' | 'all'`
  - `city?: string`
  - `language`
- For Home -> Institution Detail:
  - `institutionId`
  - `language`
- For Home -> AI Care Preparation:
  - `language`
  - Optional starting context:
    - `source: 'home'`
    - `query?: string`
    - `symptoms?: string`

MVP handoff target:

- Primary route should be `Home -> Institution Detail` through institution cards.
- AI Care Preparation should be reachable from Home, but should produce structured preparation data before Booking.

Notes:

- `city` is passed to Search but Search currently does not use `params.city`.
- Home is visually useful for MVP, but its institution/destination data is hardcoded mock data.

### 3. Search

File path: `apps/mobile/app/(tabs)/search.tsx`

Current status: `mock only`

Current route:

- Route: `/(tabs)/search` and `/search`
- Receives optional route params through `useLocalSearchParams()`
- Institution cards route via `InstitutionCard` to `/institution/{item.id}`

Current data used:

- `useLocalSearchParams()`
- `params.type` initializes `typeFilter`
- `params.city` may be passed from Home but is not used
- Local `query` state
- Local `typeFilter` state
- Local constants:
  - `SYMPTOM_CHIPS`
  - `TYPE_FILTERS`
- `INSTITUTIONS` from `apps/mobile/data/mock.ts`
- `useAppStore().language`
- `InstitutionCard`
- No backend

Data currently passed forward:

- To Institution Detail:
  - `institutionId` through `InstitutionCard`: `/institution/${item.id}`
- Does not pass:
  - search query
  - selected symptom
  - selected city
  - selected type

Data needed for next page:

- Required:
  - `institutionId`
  - `language`
- Useful for AI Care Preparation and Booking:
  - `source: 'search'`
  - `searchQuery`
  - `selectedSymptom`
  - `selectedType`
  - `selectedCity`

MVP handoff target:

- `Search -> Institution Detail`

Notes:

- Search is usable as a mock institution finder.
- It needs a small route/state handoff if the selected symptom should prefill AI Care Preparation.
- It should either consume `params.city` or Home should stop sending it.

### 4. Institution Detail

File path: `apps/mobile/app/institution/[id].tsx`

Current status: `mock only`

Current route:

- Route: `/institution/[id]`
- Reads `id` from route params
- Contact action routes to `/chat`
- Service card booking routes to `/booking/${svc.id}`
- Sticky booking button routes to `/booking/${inst.services[0]?.id || 's1'}`

Current data used:

- `useLocalSearchParams<{ id: string }>()`
- `INSTITUTIONS.find((i) => i.id === id)`
- `useAppStore().language`
- Local tab state `activeTab`
- Mock inline reviews
- Mock inline must-read content
- Native `Share.share()`
- No backend

Data currently passed forward:

- To Booking:
  - `serviceId` only
- To Chat:
  - No `institutionId`, `serviceId`, institution name, or service context

Data needed for next page:

- For Institution Detail -> AI Care Preparation:
  - `institutionId`
  - Optional `serviceId`
  - `institutionName`
  - `institutionCity`
  - `serviceOptions`
  - `language`
- For Institution Detail -> Booking Request:
  - `institutionId`
  - `serviceId`
  - `selectedPackage?`
  - `language`
  - Ideally `aiPreparationId` or inline AI preparation payload

MVP handoff target:

- Preferred MVP order:
  - `Institution Detail -> AI Care Preparation -> Booking Request`
- Current order mostly supports:
  - `Institution Detail -> Booking`
  - `Institution Detail -> generic Chat`

Notes:

- Booking can recover institution by searching mock institutions for `serviceId`, but this is fragile.
- The route should preserve `institutionId` explicitly because service IDs alone are not a durable cross-page contract.
- The "Contact Us" chat action should become an AI Care Preparation entry with institution context.

### 5. AI Care Preparation

File path: `apps/mobile/app/chat.tsx`

Current status: `needs rewrite`

Current route:

- Route: `/chat`
- Can be reached from Home AI banner or Institution Detail contact action

Current data used:

- `useAppStore().language`
- `useTranslation()`
- Local `messages` state
- Local `input` state
- Local `thinking` state
- `FAQ_ANSWERS` from `apps/mobile/data/mock.ts`
- Local FAQ matching via `matchFaqKey(input)`
- No route params
- No institution context
- No service context
- No backend/AI API

Data currently passed forward:

- None.
- It does not navigate to Booking.
- It does not save a structured care preparation result.

Data needed for next page:

- Required for AI Care Preparation -> Booking Request:
  - `institutionId`
  - `serviceId?`
  - `preferredLanguage`
  - `symptomsSummary`
  - `travelWindow`
  - `institutionFacingSummary`
  - `preparationChecklist`
- Useful:
  - `medicalHistory`
  - `patientQuestions`
  - `targetCity`
  - `urgency`
  - `companionNeeded`

MVP handoff target:

- `AI Care Preparation -> Booking Request`

Recommended MVP structure:

- Replace generic FAQ chat with a structured workflow:
  - Symptoms / condition
  - Target institution/service
  - Preferred language
  - Travel window
  - Existing records / medications
  - Output checklist and institution-facing summary
- Store result in Zustand first; later persist to Supabase.

Notes:

- Current FAQ chat can be reused as a helper module or FAQ section, but not as the core AI care preparation flow.

### 6. Booking Request

File path: `apps/mobile/app/booking/[serviceId].tsx`

Current status: `needs rewrite`

Current route:

- Route: `/booking/[serviceId]`
- Reads `serviceId` from route params
- Confirm button waits 1.2s and routes to `/crosssell`

Current data used:

- `useLocalSearchParams<{ serviceId: string }>()`
- `INSTITUTIONS.find((i) => i.services.some((s) => s.id === serviceId))`
- Current service derived from selected `serviceId`
- `useAppStore().language`
- Local constants:
  - `PACKAGES`
  - `PAYMENT_METHODS`
- Local state:
  - `selectedPkg`
  - `selectedPayment`
  - `loading`
- Derived pricing:
  - `medicalFee`
  - `accomFee`
  - `companionFee`
  - `totalPrice`
- No backend
- No stored booking

Data currently passed forward:

- To `/crosssell`:
  - No route params
  - No saved booking
- Does not pass to Trip.
- Does not read AI preparation output.

Data needed for next page:

- For Booking Request -> Trip:
  - `bookingId`
  - `institutionId`
  - `serviceId`
  - `selectedPackage`
  - `preferredLanguage`
  - `symptomsSummary`
  - `travelWindow`
  - `contactName`
  - `contactMethod`
  - `status: 'pending_review'`
  - `createdAt`
- Useful:
  - `institutionFacingSummary`
  - `preparationChecklist`
  - `estimatedPrice`
  - `currency`

MVP handoff target:

- `Booking Request -> Trip`

Recommended MVP structure:

- Remove payment-method selection from the core path.
- Replace "Pay now" with "Submit booking request".
- Add minimal contact fields and travel window.
- Create a booking request in Zustand first; later write/read from Supabase.
- Navigate to Trip after creation.

Notes:

- Current screen is a payment checkout, which conflicts with the current MVP scope.
- The selected package UI can remain, but payment methods should be delayed.

### 7. Trip

File path: `apps/mobile/app/(tabs)/trip.tsx`

Current status: `needs rewrite`

Current route:

- Route: `/(tabs)/trip`
- Empty state button routes to `/(tabs)/home`

Current data used:

- `MOCK_TRIP` from `apps/mobile/data/mock.ts`
- `useAppStore().language`
- `useTranslation()`
- Local icon/color maps:
  - `ITEM_ICONS`
  - `ITEM_COLORS`
- No route params
- No booking state
- No backend

Data currently passed forward:

- None.
- There is no Visit Summary route.

Data needed for next page:

- For Trip -> Visit Summary:
  - `bookingId`
  - `institutionId`
  - `serviceId`
  - `visitStatus`
  - `appointmentDate?`
  - `doctorNotes?`
  - `aiPreparation`
  - `language`

Data needed from previous page:

- From Booking Request:
  - `bookingRequest`
  - `preparationChecklist`
  - `institutionFacingSummary`

MVP handoff target:

- `Trip -> Visit Summary`

Recommended MVP structure:

- If there is no booking request, show empty state and return to Search/Home.
- If booking exists, show:
  - booking status
  - institution and service
  - next steps
  - preparation checklist
  - visit-day schedule
  - CTA to create/view Visit Summary when visit is complete or demo mode is enabled

Notes:

- Current `MOCK_TRIP.active` is always true, so the empty state is effectively unreachable unless the mock is edited.

### 8. Visit Summary

File path: none currently found under `apps/mobile/app`

Current status: `needs rewrite`

Current route:

- No route exists.
- No page exists.
- No data model exists in `appStore.ts`.
- No mock summary exists in `mock.ts`.

Current data used:

- Not applicable.

Data currently passed forward:

- Not applicable.

Data needed from previous page:

- From Trip:
  - `bookingId`
  - `institutionId`
  - `serviceId`
  - `language`
  - `aiPreparation`
  - Optional visit notes / doctor notes

Data needed to display:

- `doctorAdviceSummary`
- `medicationNotes`
- `recoveryNotes`
- `followUpRecommendation`
- Bilingual family-share summary:
  - Chinese + selected user language

MVP handoff target:

- `Visit Summary` is the final page of the core flow.

Recommended MVP structure:

- Add a route such as `/visit-summary/[bookingId]` or `/summary/[bookingId]`.
- First implementation can use booking + AI preparation data to generate a template summary.
- Later implementation can connect transcription/LLM summary.

## Supporting Files

### appStore

File path: `apps/mobile/store/appStore.ts`

Current status: `needs rewrite`

Current data used:

- Zustand store
- `language`
- `hasOnboarded`
- `isGuest`
- Setters:
  - `setLanguage`
  - `setHasOnboarded`
  - `setIsGuest`
- Calls `i18n.changeLanguage(lang)` inside `setLanguage`

Current role in flow:

- Supports Language Selection and localized rendering.
- Does not support the rest of the core healthcare workflow.

Data it needs to hold for MVP:

- `selectedInstitutionId`
- `selectedServiceId`
- `carePreparation`
- `bookingRequest`
- `visitSummary`
- Optional mode flag:
  - `dataMode: 'mock' | 'supabase'`

Notes:

- There is no persistence middleware, so data may be lost on reload.
- For the 20-day MVP, Zustand can be the first integration point before Supabase.

### Mock Data

File path: `apps/mobile/data/mock.ts`

Current status: `mock only`

Current data used:

- `INSTITUTIONS`
  - institution id/name/city/type/tags/rating/reviewCount/price/image/description/doctors/services/symptoms
- `DESTINATIONS`
  - destination cards for Home
- `FAQ_ANSWERS`
  - generic chat FAQ answers
- `MOCK_TRIP`
  - hardcoded active trip, driver, timeline, reminders

Current role in flow:

- Powers Home, Search, Institution Detail, Booking, Chat FAQ, and Trip.

Data it needs for MVP mock mode:

- `MOCK_CARE_PREPARATION`
- `MOCK_BOOKING_REQUEST`
- `MOCK_VISIT_SUMMARY`
- More explicit institution/service relation fields if service IDs become non-global

Notes:

- The current `INSTITUTIONS` shape is good enough for early discovery and detail pages.
- Booking and Trip need mock data shaped like real records, not only display objects.

## Current MVP Flow Gaps

1. `Language Selection -> Home`
   - Mostly works, but currently includes onboarding as an extra step.

2. `Home/Search -> Institution Detail`
   - Works with mock data.
   - Search ignores `city` param from Home.

3. `Institution Detail -> AI Care Preparation`
   - Not wired with context.
   - Current Contact button opens generic `/chat`.

4. `AI Care Preparation -> Booking Request`
   - Not implemented.
   - No structured preparation output is saved or passed.

5. `Booking Request -> Trip`
   - Not implemented.
   - Current booking screen simulates payment and routes to `/crosssell`.

6. `Trip -> Visit Summary`
   - Not implemented.
   - No Visit Summary page exists.

## Recommended Route Handoff Order

```text
/language
  stores language
  -> /(tabs)/home

/(tabs)/home or /(tabs)/search
  passes institutionId
  -> /institution/[id]

/institution/[id]
  passes institutionId and optional serviceId
  -> /chat or future /care-preparation

/chat or future /care-preparation
  stores carePreparation
  passes institutionId, serviceId, carePreparation
  -> /booking/[serviceId]

/booking/[serviceId]
  creates bookingRequest
  stores bookingRequest
  -> /(tabs)/trip

/(tabs)/trip
  reads bookingRequest
  passes bookingId
  -> future /visit-summary/[bookingId]
```

## Minimal Next Build Target

For the current 20-day MVP, the smallest useful wiring target is:

1. Extend Zustand with `carePreparation`, `bookingRequest`, and `visitSummary`.
2. Pass `institutionId` explicitly into AI Care Preparation and Booking.
3. Convert `chat.tsx` from FAQ chatbot to structured care preparation.
4. Convert `booking/[serviceId].tsx` from payment checkout to booking request creation.
5. Convert `trip.tsx` from `MOCK_TRIP` to current booking request display.
6. Add a Visit Summary route fed by booking + care preparation.
