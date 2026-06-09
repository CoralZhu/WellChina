/** Supported language codes for the MVP workflow. */
export type PreferredLanguage = 'zh' | 'en' | 'ru';

/** User-provided inputs collected before generating an AI care preparation plan. */
export type CarePreparationInput = {
  /** Broad symptom or care category selected by the user, such as knee pain, TCM recovery, or cancer screening. */
  symptomCategory: string;
  /** Free-text description of the user's symptoms, concerns, medical goal, or current condition. */
  symptomDescription?: string;
  /** Target city for care discovery or travel planning. */
  city: string;
  /** Intended travel period or preferred appointment window. */
  travelWindow: string;
  /** Whether the user has medical reports, images, prescriptions, or other records available. */
  hasMedicalReports: boolean;
  /** User's preferred language for guidance, booking, and summaries. */
  preferredLanguage: PreferredLanguage;
  /** Institution selected before care preparation, if the user entered from an institution detail page. */
  selectedInstitutionId?: string;
};

/** Structured AI preparation output used to guide booking and trip preparation. */
export type CarePreparationResult = {
  /** User-facing summary of the medical situation and travel intent. */
  situationSummary: string;
  /** Institution-facing summary that can be sent with the booking request. */
  institutionSummary: string;
  /** Medical preparation tasks the user should complete before the appointment. */
  preparationChecklist: string[];
  /** Suggested questions the user may want to ask the doctor or care team. */
  questionsForDoctor: string[];
  /** Travel and logistics checklist for coming to China for care. */
  travelChecklist: string[];
  /** Safety disclaimer clarifying that the preparation result is not a diagnosis or prescription. */
  riskDisclaimer: string;
  /** Recommended next action, such as choosing an institution or submitting a booking request. */
  recommendedNextStep: string;
};

/** Status values for the MVP booking request lifecycle. */
export type BookingRequestStatus =
  | 'pending_review'
  | 'coordinator_reviewing'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/** Booking request record created after the user chooses care details and submits contact information. */
export type BookingRequest = {
  /** Unique booking request identifier used by Trip and Visit Summary screens. */
  id: string;
  /** Institution selected for the booking request. */
  institutionId: string;
  /** Specific service or package service selected within the institution, if available. */
  serviceId?: string;
  /** User-selected package tier or label, such as basic, standard, or premium. */
  selectedPackage?: string;
  /** User's preferred language for booking support and care coordination. */
  preferredLanguage: PreferredLanguage;
  /** Concise symptom or situation summary attached to the request. */
  symptomsSummary: string;
  /** Intended travel period or preferred appointment window. */
  travelWindow: string;
  /** Contact person's name, if the user provides it during booking. */
  contactName?: string;
  /** Contact method such as email, phone, WhatsApp, WeChat, or Telegram. */
  contactMethod?: string;
  /** Current MVP booking status. */
  status: BookingRequestStatus;
  /** Structured AI care preparation result attached to this booking request, if generated. */
  carePreparation?: CarePreparationResult;
  /** Original inputs used to generate care preparation, kept locally so the plan can be re-localized. */
  carePreparationInput?: CarePreparationInput;
  /** ISO timestamp for when the booking request was created. */
  createdAt: string;
};

/** Post-visit summary shown after the appointment or demo visit is completed. */
export type VisitSummary = {
  /** Booking request identifier this visit summary belongs to. */
  bookingId: string;
  /** Plain-language summary of the doctor's advice or care outcome. */
  doctorAdviceSummary: string;
  /** Medication instructions, cautions, or reminders, if applicable. */
  medicationNotes?: string;
  /** Recovery guidance, lifestyle notes, or care instructions after the visit. */
  recoveryNotes?: string;
  /** Suggested follow-up timing or next appointment recommendation. */
  followUpRecommendation?: string;
  /** Shareable family-facing summary in one or more supported languages. */
  familyShareSummary: {
    /** Chinese family-facing summary. */
    zh?: string;
    /** English family-facing summary. */
    en?: string;
    /** Russian family-facing summary. */
    ru?: string;
  };
  /** ISO timestamp for when the visit summary was created. */
  createdAt: string;
};

/** Combined state container for the end-to-end MVP workflow. */
export type CoreFlowContext = {
  /** User's preferred language for the whole workflow. */
  preferredLanguage?: PreferredLanguage;
  /** Latest care preparation input collected from the user. */
  carePreparationInput?: CarePreparationInput;
  /** Latest structured AI care preparation result. */
  carePreparationResult?: CarePreparationResult;
  /** Current booking request created from care preparation and institution selection. */
  bookingRequest?: BookingRequest;
  /** Current visit summary generated after a completed mock visit. */
  visitSummary?: VisitSummary;
};
