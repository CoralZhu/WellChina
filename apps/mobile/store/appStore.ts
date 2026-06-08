import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import i18n from '../i18n';
import type { FontScale } from '../constants/theme';
import { isSupabaseEnabled, supabase } from '../lib/supabase';
import type {
  BookingRequest,
  BookingRequestStatus,
  CarePreparationInput,
  CarePreparationResult,
  VisitSummary,
} from '../types/workflow';

type Language = 'zh' | 'en' | 'ru';

interface AppStore {
  language: Language;
  hasOnboarded: boolean;
  isGuest: boolean;
  fontScale: FontScale;
  simpleMode: boolean;
  currentCareInput: CarePreparationInput | null;
  currentCareResult: CarePreparationResult | null;
  currentBooking: BookingRequest | null;
  visitSummary: VisitSummary | null;
  setLanguage: (lang: Language) => void;
  setHasOnboarded: (v: boolean) => void;
  setIsGuest: (v: boolean) => void;
  setFontScale: (scale: FontScale) => void;
  setSimpleMode: (enabled: boolean) => void;
  setCareInput: (input: CarePreparationInput) => void;
  setCareResult: (result: CarePreparationResult) => void;
  createBookingRequest: (booking: BookingRequest) => void;
  updateBookingStatus: (status: BookingRequestStatus) => void;
  setVisitSummary: (summary: VisitSummary) => void;
  resetWorkflow: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      language: 'en',
      hasOnboarded: false,
      isGuest: true,
      fontScale: 'medium',
      simpleMode: false,
      currentCareInput: null,
      currentCareResult: null,
      currentBooking: null,
      visitSummary: null,
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },
      setHasOnboarded: (v) => set({ hasOnboarded: v }),
      setIsGuest: (v) => set({ isGuest: v }),
      setFontScale: (scale) => set({ fontScale: scale }),
      setSimpleMode: (enabled) => set({ simpleMode: enabled }),
      setCareInput: (input) => set({ currentCareInput: input, currentCareResult: null }),
      setCareResult: (result) => set({ currentCareResult: result }),
      createBookingRequest: (booking) => {
        set({ currentBooking: booking });

        if (!isSupabaseEnabled() || !supabase) return;

        void (async () => {
          try {
            const { error } = await supabase.from('bookings').insert({
              id: booking.id,
              institution_id: booking.institutionId,
              service_id: booking.serviceId,
              selected_package: booking.selectedPackage,
              preferred_language: booking.preferredLanguage,
              symptoms_summary: booking.symptomsSummary,
              travel_window: booking.travelWindow,
              contact_name: booking.contactName,
              contact_method: booking.contactMethod,
              status: booking.status,
              care_preparation: booking.carePreparation,
              created_at: booking.createdAt,
            });

            if (error) {
              console.error('Failed to insert booking into Supabase:', error);
            }
          } catch (error) {
            console.error('Failed to insert booking into Supabase:', error);
          }
        })();
      },
      updateBookingStatus: (status) => set((state) => ({
        currentBooking: state.currentBooking
          ? { ...state.currentBooking, status }
          : null,
      })),
      setVisitSummary: (summary) => set({ visitSummary: summary }),
      resetWorkflow: () => set({
        currentCareInput: null,
        currentCareResult: null,
        currentBooking: null,
        visitSummary: null,
      }),
    }),
    {
      name: 'wellchina-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        language: state.language,
        hasOnboarded: state.hasOnboarded,
        isGuest: state.isGuest,
        fontScale: state.fontScale,
        simpleMode: state.simpleMode,
        currentCareInput: state.currentCareInput,
        currentCareResult: state.currentCareResult,
        currentBooking: state.currentBooking,
        visitSummary: state.visitSummary,
      }),
    },
  ),
);
