import type { CarePreparationInput, CarePreparationResult } from '../types/workflow';

type Language = CarePreparationInput['preferredLanguage'];

type CopySet = {
  symptomLabels: Record<string, string>;
  cityLabels: Record<string, string>;
  travelLabels: Record<string, string>;
  languageLabels: Record<Language, string>;
  situationIntro: Record<string, string>;
  situationFallback: string;
  situationSummary: (intro: string, city: string, travelWindow: string) => string;
  situationDetailsPrefix: string;
  institutionSummary: (input: CarePreparationInput, symptom: string, city: string, travelWindow: string, language: string) => string;
  generalPreparation: string[];
  symptomPreparation: Record<string, string[]>;
  reportItem: string;
  questions: Record<string, string[]>;
  travelBase: string[];
  cityTravel: Record<string, string[]>;
  riskDisclaimer: string;
  nextStepWithInstitution: string;
  nextStepWithoutInstitution: string;
};

const EN: CopySet = {
  symptomLabels: {
    orthopedics_rehabilitation: 'orthopedics and rehabilitation',
    traditional_chinese_medicine: 'traditional Chinese medicine',
    cancer_screening: 'cancer screening',
    cardiology: 'cardiology',
    general_wellness: 'general wellness',
    other: 'general medical care',
  },
  cityLabels: {
    beijing: 'Beijing',
    shanghai: 'Shanghai',
    guangzhou: 'Guangzhou',
    sanya: 'Sanya',
    not_sure_yet: 'a city still to be confirmed',
  },
  travelLabels: {
    within_1_month: 'within 1 month',
    '1_3_months': '1-3 months',
    '3_6_months': '3-6 months',
    just_exploring: 'just exploring',
  },
  languageLabels: {
    zh: 'Chinese',
    en: 'English',
    ru: 'Russian',
  },
  situationIntro: {
    orthopedics_rehabilitation: 'You are exploring China for orthopedic care and rehabilitation support',
    traditional_chinese_medicine: 'You are exploring China for traditional Chinese medicine and recovery support',
    cancer_screening: 'You are exploring China for cancer screening or oncology evaluation',
    cardiology: 'You are exploring China for cardiology assessment or treatment planning',
    general_wellness: 'You are exploring China for general wellness and preventive care',
    other: 'You are exploring China for medical care',
  },
  situationFallback: 'You are exploring China for medical care',
  situationSummary: (intro, city, travelWindow) => `${intro} in ${city}. Travel window: ${travelWindow}.`,
  situationDetailsPrefix: 'Additional details shared by the patient:',
  institutionSummary: (input, symptom, city, travelWindow, language) => {
    const reports = input.hasMedicalReports
      ? 'The patient has existing medical reports and can provide them for review.'
      : 'The patient has not indicated that medical reports are available yet.';
    return `International patient inquiry for ${symptom} in ${city}. The intended travel window is ${travelWindow}, and the preferred support language is ${language}. ${reports}`;
  },
  generalPreparation: [
    'Prepare passport information and emergency contact details',
    'Write down current medications and allergies',
    'List your main goals for the consultation',
  ],
  symptomPreparation: {
    orthopedics_rehabilitation: ['Prepare recent imaging such as X-ray, MRI, or CT if available', 'Bring notes about pain level, mobility limits, and previous therapy'],
    traditional_chinese_medicine: ['Record sleep, appetite, digestion, and energy patterns for the past two weeks', 'List any herbs, supplements, or traditional treatments already used'],
    cancer_screening: ['Prepare previous pathology, imaging, and blood test results if available', 'Write down family cancer history and prior treatment timeline'],
    cardiology: ['Prepare recent ECG, echocardiogram, or blood pressure records if available', 'List chest pain, breathlessness, palpitations, or exercise tolerance changes'],
    general_wellness: ['Prepare recent annual checkup or lab results if available', 'Write down wellness goals such as sleep, stress, weight, or mobility'],
    other: ['Collect any recent test results related to your concern', 'Write down when symptoms started and what makes them better or worse'],
  },
  reportItem: 'Bring all existing medical reports',
  questions: {
    orthopedics_rehabilitation: ['What treatment options fit my current mobility level?', 'Do I need surgery, rehabilitation, or both?', 'How long should I stay in China for recovery?', 'What results are realistic for my condition?'],
    traditional_chinese_medicine: ['Which TCM therapies are suitable for my condition?', 'How many sessions are usually needed?', 'Can TCM be combined with my current medications?', 'What changes should I track during treatment?'],
    cancer_screening: ['Which screening tests are recommended for my risk profile?', 'How quickly can results and specialist opinions be available?', 'Do I need biopsy, imaging, or blood marker follow-up?', 'What information should I send before arrival?'],
    cardiology: ['Which heart tests should be done first?', 'Is travel safe with my current symptoms?', 'Do my medications need adjustment before travel?', 'What warning signs should prompt urgent care?'],
    general_wellness: ['Which checkup package fits my age and goals?', 'What lifestyle risks should be evaluated first?', 'How should I prepare for fasting blood tests?', 'Can I combine wellness care with rehabilitation or TCM?'],
    other: ['Which specialty should review my case first?', 'What records should I send before booking?', 'How long should I plan to stay?', 'What symptoms would make this urgent?'],
  },
  travelBase: ['Prepare China visa documents', 'Purchase travel insurance', 'Check flight options and arrival airport'],
  cityTravel: {
    sanya: ['Book accommodation near Haitang Bay Medical Zone', 'Pack light clothing and sun protection'],
    beijing: ['Prepare for cold weather if traveling in winter', 'Plan extra transit time between airport, hotel, and hospital'],
    shanghai: ['Choose accommodation with easy access to international hospital districts', 'Prepare for busy urban transit during peak hours'],
    guangzhou: ['Choose accommodation near the hospital or metro line', 'Prepare for humid weather in spring and summer'],
    not_sure_yet: ['Compare hospital access, climate, and flight routes before choosing a city'],
  },
  riskDisclaimer: 'This is a preparation guide, not a diagnosis. It does not replace advice from a licensed medical professional.',
  nextStepWithInstitution: 'Submit your booking request',
  nextStepWithoutInstitution: 'Browse institutions and select one that fits your needs',
};

const ZH: CopySet = {
  symptomLabels: {
    orthopedics_rehabilitation: '骨科与康复',
    traditional_chinese_medicine: '中医调理',
    cancer_screening: '肿瘤筛查',
    cardiology: '心血管评估',
    general_wellness: '综合康养',
    other: '其他医疗需求',
  },
  cityLabels: {
    beijing: '北京',
    shanghai: '上海',
    guangzhou: '广州',
    sanya: '三亚',
    not_sure_yet: '尚未确定的城市',
  },
  travelLabels: {
    within_1_month: '1个月内',
    '1_3_months': '1-3个月',
    '3_6_months': '3-6个月',
    just_exploring: '暂时了解',
  },
  languageLabels: {
    zh: '中文',
    en: '英文',
    ru: '俄文',
  },
  situationIntro: {
    orthopedics_rehabilitation: '您正在考虑来中国进行骨科治疗与康复支持',
    traditional_chinese_medicine: '您正在考虑来中国接受中医调理与康复支持',
    cancer_screening: '您正在考虑来中国进行肿瘤筛查或肿瘤专科评估',
    cardiology: '您正在考虑来中国进行心血管评估或治疗规划',
    general_wellness: '您正在考虑来中国进行综合康养与预防性检查',
    other: '您正在考虑来中国接受医疗服务',
  },
  situationFallback: '您正在考虑来中国接受医疗服务',
  situationSummary: (intro, city, travelWindow) => `${intro}，目标城市为${city}，计划出行时间为${travelWindow}。`,
  situationDetailsPrefix: '患者补充说明：',
  institutionSummary: (input, symptom, city, travelWindow, language) => {
    const reports = input.hasMedicalReports
      ? '患者已有既往病历或检查报告，可提供给机构预审。'
      : '患者暂未确认可提供既往病历或检查报告。';
    return `这是一位国际患者关于${symptom}的预约咨询，目标城市为${city}。计划出行时间为${travelWindow}，首选服务语言为${language}。${reports}`;
  },
  generalPreparation: [
    '准备护照信息和紧急联系人',
    '整理当前用药和过敏史',
    '写下本次咨询最想解决的目标',
  ],
  symptomPreparation: {
    orthopedics_rehabilitation: ['如有近期 X 光、MRI 或 CT，请提前整理', '记录疼痛程度、活动受限情况和既往康复经历'],
    traditional_chinese_medicine: ['记录近两周睡眠、食欲、消化和精力变化', '列出现用草药、保健品或既往中医疗法'],
    cancer_screening: ['如有病理、影像和血液检查结果，请提前整理', '写下家族肿瘤史和既往治疗时间线'],
    cardiology: ['如有心电图、心超或血压记录，请提前整理', '记录胸痛、气短、心悸或运动耐量变化'],
    general_wellness: ['如有年度体检或化验结果，请提前整理', '写下睡眠、压力、体重或行动能力等康养目标'],
    other: ['整理与当前问题相关的近期检查结果', '记录症状开始时间以及加重或缓解因素'],
  },
  reportItem: '携带所有既往病历和检查报告',
  questions: {
    orthopedics_rehabilitation: ['我的活动能力适合哪些治疗方案？', '我更适合手术、康复，还是两者结合？', '我需要在中国停留多久用于恢复？', '以我的情况可以期待什么样的改善？'],
    traditional_chinese_medicine: ['哪些中医疗法适合我的情况？', '通常需要多少次治疗？', '中医治疗能否和我当前用药同时进行？', '治疗期间我应该观察哪些变化？'],
    cancer_screening: ['以我的风险情况，应优先做哪些筛查？', '检查结果和专家意见多久可以获得？', '是否需要进一步活检、影像或肿瘤标志物检查？', '到院前应提前提交哪些资料？'],
    cardiology: ['我应优先完成哪些心脏检查？', '以我目前症状是否适合旅行？', '出行前当前用药是否需要调整？', '哪些信号提示需要紧急就医？'],
    general_wellness: ['哪类体检套餐最符合我的年龄和目标？', '应优先评估哪些生活方式风险？', '空腹抽血前需要做哪些准备？', '能否结合康复或中医调理一起安排？'],
    other: ['我的情况应先由哪个专科评估？', '预约前需要提前提交哪些资料？', '我应预留多长在华停留时间？', '哪些症状会提示情况比较紧急？'],
  },
  travelBase: ['准备来华签证材料', '购买旅行保险', '确认航班选择和抵达机场'],
  cityTravel: {
    sanya: ['预订靠近海棠湾医疗区的住宿', '准备轻便衣物和防晒用品'],
    beijing: ['冬季出行请准备保暖衣物', '预留机场、酒店和医院之间的交通时间'],
    shanghai: ['选择方便前往国际医疗机构区域的住宿', '高峰期出行需预留城市交通时间'],
    guangzhou: ['选择靠近医院或地铁线路的住宿', '春夏季注意潮湿和炎热天气'],
    not_sure_yet: ['选择城市前比较医院资源、气候和航班便利度'],
  },
  riskDisclaimer: '这是一份就医准备指南，不是医学诊断，不能替代持证医生的专业建议。',
  nextStepWithInstitution: '提交预约请求',
  nextStepWithoutInstitution: '浏览机构并选择适合您需求的一家',
};

const RU: CopySet = {
  symptomLabels: {
    orthopedics_rehabilitation: 'ортопедия и реабилитация',
    traditional_chinese_medicine: 'традиционная китайская медицина',
    cancer_screening: 'онкологический скрининг',
    cardiology: 'кардиология',
    general_wellness: 'общее оздоровление',
    other: 'другая медицинская помощь',
  },
  cityLabels: {
    beijing: 'Пекин',
    shanghai: 'Шанхай',
    guangzhou: 'Гуанчжоу',
    sanya: 'Санья',
    not_sure_yet: 'город пока не выбран',
  },
  travelLabels: {
    within_1_month: 'в течение 1 месяца',
    '1_3_months': 'через 1-3 месяца',
    '3_6_months': 'через 3-6 месяцев',
    just_exploring: 'пока только изучаю варианты',
  },
  languageLabels: {
    zh: 'китайский',
    en: 'английский',
    ru: 'русский',
  },
  situationIntro: {
    orthopedics_rehabilitation: 'Вы рассматриваете поездку в Китай для ортопедической помощи и реабилитации',
    traditional_chinese_medicine: 'Вы рассматриваете поездку в Китай для традиционной китайской медицины и восстановления',
    cancer_screening: 'Вы рассматриваете поездку в Китай для онкологического скрининга или оценки',
    cardiology: 'Вы рассматриваете поездку в Китай для кардиологической оценки или планирования лечения',
    general_wellness: 'Вы рассматриваете поездку в Китай для общего оздоровления и профилактической проверки',
    other: 'Вы рассматриваете поездку в Китай для медицинской помощи',
  },
  situationFallback: 'Вы рассматриваете поездку в Китай для медицинской помощи',
  situationSummary: (intro, city, travelWindow) => `${intro}. Город: ${city}. Планируемый период поездки: ${travelWindow}.`,
  situationDetailsPrefix: 'Дополнительные сведения от пациента:',
  institutionSummary: (input, symptom, city, travelWindow, language) => {
    const reports = input.hasMedicalReports
      ? 'У пациента есть медицинские документы, которые можно предоставить для предварительного рассмотрения.'
      : 'Пациент пока не подтвердил наличие медицинских документов.';
    return `Запрос международного пациента по направлению: ${symptom}, город: ${city}. Планируемый период поездки: ${travelWindow}; предпочитаемый язык сопровождения: ${language}. ${reports}`;
  },
  generalPreparation: [
    'Подготовьте паспортные данные и контакт для экстренной связи',
    'Запишите текущие лекарства и аллергии',
    'Сформулируйте главные цели консультации',
  ],
  symptomPreparation: {
    orthopedics_rehabilitation: ['Подготовьте свежие снимки X-ray, MRI или CT, если они есть', 'Запишите уровень боли, ограничения движения и предыдущую реабилитацию'],
    traditional_chinese_medicine: ['Запишите изменения сна, аппетита, пищеварения и энергии за последние две недели', 'Укажите травы, добавки или методы ТКМ, которые уже применялись'],
    cancer_screening: ['Подготовьте прошлые результаты патологии, визуализации и анализов крови, если они есть', 'Запишите семейный онкологический анамнез и хронологию лечения'],
    cardiology: ['Подготовьте свежие ECG, эхокардиографию или записи давления, если они есть', 'Запишите боль в груди, одышку, сердцебиение или изменения переносимости нагрузки'],
    general_wellness: ['Подготовьте результаты последнего чекапа или анализов, если они есть', 'Запишите цели: сон, стресс, вес, подвижность или профилактика'],
    other: ['Соберите свежие результаты обследований по вашему вопросу', 'Запишите, когда начались симптомы и что их усиливает или облегчает'],
  },
  reportItem: 'Возьмите все имеющиеся медицинские документы',
  questions: {
    orthopedics_rehabilitation: ['Какие варианты лечения подходят моему уровню подвижности?', 'Нужна ли операция, реабилитация или оба варианта?', 'Сколько времени стоит провести в Китае для восстановления?', 'Какие результаты реалистичны в моей ситуации?'],
    traditional_chinese_medicine: ['Какие методы ТКМ подходят моему состоянию?', 'Сколько сеансов обычно требуется?', 'Можно ли сочетать ТКМ с моими текущими лекарствами?', 'Какие изменения нужно отслеживать во время лечения?'],
    cancer_screening: ['Какие скрининговые тесты рекомендованы с учетом моего риска?', 'Как быстро можно получить результаты и мнение специалиста?', 'Нужны ли биопсия, визуализация или дополнительные маркеры?', 'Какие данные отправить до приезда?'],
    cardiology: ['Какие кардиологические тесты сделать в первую очередь?', 'Безопасно ли путешествовать с моими текущими симптомами?', 'Нужно ли менять лекарства перед поездкой?', 'Какие признаки требуют срочной помощи?'],
    general_wellness: ['Какой пакет обследования подходит моему возрасту и целям?', 'Какие факторы образа жизни стоит оценить первыми?', 'Как подготовиться к анализам крови натощак?', 'Можно ли совместить оздоровление с реабилитацией или ТКМ?'],
    other: ['Какой специалист должен первым рассмотреть мой случай?', 'Какие документы отправить до бронирования?', 'На какой срок планировать пребывание?', 'Какие симптомы делают ситуацию срочной?'],
  },
  travelBase: ['Подготовьте документы для визы в Китай', 'Оформите туристическую страховку', 'Проверьте варианты перелета и аэропорт прибытия'],
  cityTravel: {
    sanya: ['Забронируйте жилье рядом с медицинской зоной Haitang Bay', 'Возьмите легкую одежду и защиту от солнца'],
    beijing: ['Подготовьтесь к холодной погоде, если поездка зимой', 'Запланируйте дополнительное время на дорогу между аэропортом, отелем и больницей'],
    shanghai: ['Выберите жилье с удобным доступом к международным медицинским районам', 'Учитывайте загруженный городской транспорт в часы пик'],
    guangzhou: ['Выберите жилье рядом с больницей или линией метро', 'Подготовьтесь к влажной погоде весной и летом'],
    not_sure_yet: ['Сравните доступ к больницам, климат и маршруты перелета перед выбором города'],
  },
  riskDisclaimer: 'Это руководство по подготовке, а не диагноз. Оно не заменяет консультацию лицензированного врача.',
  nextStepWithInstitution: 'Отправьте запрос на бронирование',
  nextStepWithoutInstitution: 'Просмотрите учреждения и выберите подходящее',
};

const COPY: Record<Language, CopySet> = {
  en: EN,
  zh: ZH,
  ru: RU,
};

function getCopy(input: CarePreparationInput) {
  return COPY[input.preferredLanguage] || EN;
}

function getSymptomLabel(input: CarePreparationInput, copy: CopySet) {
  return copy.symptomLabels[input.symptomCategory] || input.symptomCategory;
}

function getCityLabel(input: CarePreparationInput, copy: CopySet) {
  return copy.cityLabels[input.city] || input.city;
}

function getTravelWindowLabel(input: CarePreparationInput, copy: CopySet) {
  return copy.travelLabels[input.travelWindow] || input.travelWindow;
}

function getLanguageLabel(input: CarePreparationInput, copy: CopySet) {
  return copy.languageLabels[input.preferredLanguage] || input.preferredLanguage;
}

function createSituationSummary(input: CarePreparationInput): string {
  const copy = getCopy(input);
  const city = getCityLabel(input, copy);
  const travelWindow = getTravelWindowLabel(input, copy);
  const intro = copy.situationIntro[input.symptomCategory] || copy.situationFallback;
  const base = copy.situationSummary(intro, city, travelWindow);

  if (!input.symptomDescription?.trim()) return base;

  return `${base} ${copy.situationDetailsPrefix} ${input.symptomDescription.trim()}`;
}

function createInstitutionSummary(input: CarePreparationInput): string {
  const copy = getCopy(input);
  return copy.institutionSummary(
    input,
    getSymptomLabel(input, copy),
    getCityLabel(input, copy),
    getTravelWindowLabel(input, copy),
    getLanguageLabel(input, copy),
  );
}

function createPreparationChecklist(input: CarePreparationInput): string[] {
  const copy = getCopy(input);
  const symptomItems = copy.symptomPreparation[input.symptomCategory] || copy.symptomPreparation.other;
  const reportItems = input.hasMedicalReports ? [copy.reportItem] : [];

  return [
    ...copy.generalPreparation,
    ...symptomItems,
    ...reportItems,
  ];
}

function createQuestionsForDoctor(input: CarePreparationInput): string[] {
  const copy = getCopy(input);
  return copy.questions[input.symptomCategory] || copy.questions.other;
}

function createTravelChecklist(input: CarePreparationInput): string[] {
  const copy = getCopy(input);
  const cityItems = copy.cityTravel[input.city] || copy.cityTravel.not_sure_yet;

  return [
    ...copy.travelBase,
    ...cityItems,
  ];
}

function createRiskDisclaimer(input: CarePreparationInput): string {
  return getCopy(input).riskDisclaimer;
}

function createRecommendedNextStep(input: CarePreparationInput): string {
  const copy = getCopy(input);
  return input.selectedInstitutionId
    ? copy.nextStepWithInstitution
    : copy.nextStepWithoutInstitution;
}

export function generateCarePreparation(input: CarePreparationInput): CarePreparationResult {
  return {
    situationSummary: createSituationSummary(input),
    institutionSummary: createInstitutionSummary(input),
    preparationChecklist: createPreparationChecklist(input),
    questionsForDoctor: createQuestionsForDoctor(input),
    travelChecklist: createTravelChecklist(input),
    riskDisclaimer: createRiskDisclaimer(input),
    recommendedNextStep: createRecommendedNextStep(input),
  };
}
