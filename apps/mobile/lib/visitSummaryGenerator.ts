import type { BookingRequest, VisitSummary } from '../types/workflow';

type Language = BookingRequest['preferredLanguage'];

type CopySet = {
  adviceClosing: string;
  medicationNotes: string;
  recoveryNotes: Record<string, string>;
  recoveryFallback: string;
  followUpRecommendation: string;
  familyIntro: string;
};

const EN: CopySet = {
  adviceClosing: 'Please follow the doctor\'s instructions and contact the care team if symptoms change.',
  medicationNotes: 'Medication was mentioned in the visit notes. Confirm dosage, timing, side effects, and whether any current medicines should be stopped or continued.',
  recoveryNotes: {
    orthopedics: 'Focus on gradual mobility, safe walking, and rehabilitation exercises as advised. Avoid sudden increases in activity until cleared by the care team.',
    tcm: 'Track sleep, appetite, digestion, energy, and symptom changes during recovery. Continue any TCM plan only as directed by the clinician.',
    cancer: 'Keep all imaging, lab, and pathology results organized for follow-up. Ask the care team which findings require monitoring or additional testing.',
    cardiology: 'Monitor chest discomfort, breathlessness, heart rate changes, and blood pressure. Seek urgent care if warning symptoms appear.',
    wellness: 'Maintain rest, hydration, balanced meals, and gentle activity. Use the visit findings to guide a realistic wellness plan.',
  },
  recoveryFallback: 'Rest, hydrate, and follow the written care instructions. Contact the care team if symptoms worsen or new symptoms appear.',
  followUpRecommendation: 'Schedule a follow-up in 4-6 weeks',
  familyIntro: 'Family summary:',
};

const ZH: CopySet = {
  adviceClosing: '请遵循医生建议执行，如症状变化，请及时联系护理团队。',
  medicationNotes: '就诊记录中提到了用药。请确认剂量、服用时间、副作用，以及现有药物是否需要停用或继续。',
  recoveryNotes: {
    orthopedics: '恢复期应循序渐进增加活动量，并按医嘱进行康复训练。在护理团队确认前，避免突然增加运动强度。',
    tcm: '恢复期请观察睡眠、食欲、消化、精力和症状变化。中医调理方案应按医嘱继续。',
    cancer: '请整理好影像、化验和病理资料，便于复诊。向医疗团队确认哪些结果需要持续观察或进一步检查。',
    cardiology: '请监测胸闷胸痛、气短、心率变化和血压。如出现警示症状，应及时就医。',
    wellness: '请保持休息、补水、均衡饮食和轻度活动，并根据本次检查结果制定可执行的康养计划。',
  },
  recoveryFallback: '请注意休息、补水，并遵循书面医嘱。如症状加重或出现新症状，请联系护理团队。',
  followUpRecommendation: '建议在4-6周内安排复诊',
  familyIntro: '家属摘要：',
};

const RU: CopySet = {
  adviceClosing: 'Следуйте рекомендациям врача и свяжитесь с командой сопровождения, если симптомы изменятся.',
  medicationNotes: 'В заметках врача упоминаются лекарства. Уточните дозировку, время приема, побочные эффекты и какие текущие препараты нужно продолжить или отменить.',
  recoveryNotes: {
    orthopedics: 'Постепенно восстанавливайте подвижность и выполняйте реабилитационные упражнения по назначению. Не увеличивайте нагрузку резко без разрешения команды.',
    tcm: 'Отслеживайте сон, аппетит, пищеварение, энергию и изменения симптомов. Продолжайте план ТКМ только по назначению врача.',
    cancer: 'Храните все результаты визуализации, анализов и патологии для повторной консультации. Уточните, какие показатели требуют наблюдения или дополнительных тестов.',
    cardiology: 'Следите за дискомфортом в груди, одышкой, изменениями пульса и давления. При тревожных симптомах обратитесь за срочной помощью.',
    wellness: 'Поддерживайте отдых, питьевой режим, сбалансированное питание и легкую активность. Используйте результаты визита для реалистичного плана оздоровления.',
  },
  recoveryFallback: 'Отдыхайте, пейте достаточно воды и следуйте письменным рекомендациям. Свяжитесь с командой, если симптомы усилятся или появятся новые.',
  followUpRecommendation: 'Запланируйте повторную консультацию через 4-6 недель',
  familyIntro: 'Краткое резюме для семьи:',
};

const COPY: Record<Language, CopySet> = {
  en: EN,
  zh: ZH,
  ru: RU,
};

function getCopy(language: Language) {
  return COPY[language] || EN;
}

function truncateNotes(doctorNotes: string) {
  const cleaned = doctorNotes.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 200) return cleaned;
  return `${cleaned.slice(0, 200).trim()}...`;
}

function createDoctorAdviceSummary(doctorNotes: string, booking: BookingRequest): string {
  const copy = getCopy(booking.preferredLanguage);
  const summary = truncateNotes(doctorNotes);
  return `${summary} ${copy.adviceClosing}`;
}

function containsMedicationMention(doctorNotes: string) {
  const normalized = doctorNotes.toLowerCase();
  return ['medication', 'drug', 'pill', 'medicine', 'лекарство', '药'].some((word) => normalized.includes(word));
}

function createMedicationNotes(doctorNotes: string, booking: BookingRequest): string | undefined {
  if (!containsMedicationMention(doctorNotes)) return undefined;
  return getCopy(booking.preferredLanguage).medicationNotes;
}

function inferCareCategory(booking: BookingRequest) {
  const source = `${booking.carePreparation?.situationSummary || ''} ${booking.symptomsSummary}`.toLowerCase();
  if (source.includes('orthopedic') || source.includes('rehabilitation') || source.includes('骨') || source.includes('ортопед')) return 'orthopedics';
  if (source.includes('traditional chinese medicine') || source.includes('tcm') || source.includes('中医') || source.includes('ткм')) return 'tcm';
  if (source.includes('cancer') || source.includes('oncology') || source.includes('肿瘤') || source.includes('онко')) return 'cancer';
  if (source.includes('cardio') || source.includes('heart') || source.includes('心') || source.includes('кардио')) return 'cardiology';
  if (source.includes('wellness') || source.includes('康养') || source.includes('оздоров')) return 'wellness';
  return 'other';
}

function createRecoveryNotes(booking: BookingRequest): string {
  const copy = getCopy(booking.preferredLanguage);
  const category = inferCareCategory(booking);
  return copy.recoveryNotes[category] || copy.recoveryFallback;
}

function createFollowUpRecommendation(booking: BookingRequest): string {
  return getCopy(booking.preferredLanguage).followUpRecommendation;
}

function createFamilyShareSummary(doctorNotes: string, booking: BookingRequest) {
  const englishAdvice = createDoctorAdviceSummary(doctorNotes, { ...booking, preferredLanguage: 'en' });
  const chineseAdvice = createDoctorAdviceSummary(doctorNotes, { ...booking, preferredLanguage: 'zh' });
  const russianAdvice = createDoctorAdviceSummary(doctorNotes, { ...booking, preferredLanguage: 'ru' });

  return {
    zh: `${ZH.familyIntro} ${chineseAdvice}`,
    en: `${EN.familyIntro} ${englishAdvice}`,
    ...(booking.preferredLanguage === 'ru' ? { ru: `${RU.familyIntro} ${russianAdvice}` } : {}),
  };
}

export function generateVisitSummary(
  doctorNotes: string,
  booking: BookingRequest,
): VisitSummary {
  return {
    bookingId: booking.id,
    doctorAdviceSummary: createDoctorAdviceSummary(doctorNotes, booking),
    medicationNotes: createMedicationNotes(doctorNotes, booking),
    recoveryNotes: createRecoveryNotes(booking),
    followUpRecommendation: createFollowUpRecommendation(booking),
    familyShareSummary: createFamilyShareSummary(doctorNotes, booking),
    createdAt: new Date().toISOString(),
  };
}
