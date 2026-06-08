# Known Issues — WellChina MVP

## KI-001: Chinese version in Visit Summary shows original input language
**Page:** Visit Summary → Chinese tab  
**Description:** The Chinese family summary currently prefixes the 
user's original input text instead of translating it. This is a 
limitation of the local mock generator.  
**Fix:** Connect DeepL or Claude translation API in v2.

## KI-002: Trip page Language field shows "EN" instead of full name
**Page:** Trip → Booking Summary  
**Description:** Preferred language displays as language code 
(EN/ZH/RU) instead of full name.  
**Fix:** Map language code to display name.

## KI-003: No persistent state across browser refresh
**Page:** All pages  
**Description:** Zustand state resets on page refresh. Booking is 
persisted to Supabase but care preparation and visit summary are 
local only.  
**Fix:** Add AsyncStorage persistence or Supabase reads on app load.
