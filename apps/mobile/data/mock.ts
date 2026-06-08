export const INSTITUTIONS = [
  {
    id: '1',
    name: { zh: '北京协和医院', en: 'Peking Union Medical College Hospital', ru: 'Больница медицинского колледжа Пекинского союза' },
    city: { zh: '北京', en: 'Beijing', ru: 'Пекин' },
    type: 'western',
    tags: ['level3', 'jci'],
    rating: 4.9,
    reviewCount: 312,
    priceFrom: 3800,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600',
    description: {
      zh: '中国最权威的综合性医院之一，拥有100年历史，JCI国际认证，多学科顶级专家团队。',
      en: 'One of China\'s most prestigious hospitals with 100 years of history, JCI accreditation, and world-class multidisciplinary specialists.',
      ru: 'Одна из самых престижных больниц Китая с историей более 100 лет, аккредитацией JCI и специалистами мирового класса.',
    },
    doctors: [
      { name: { zh: '王教授', en: 'Prof. Wang', ru: 'Проф. Ван' }, specialty: { zh: '骨科', en: 'Orthopaedics', ru: 'Ортопедия' }, years: 32 },
      { name: { zh: '李主任', en: 'Dr. Li', ru: 'Д-р Ли' }, specialty: { zh: '心脏科', en: 'Cardiology', ru: 'Кардиология' }, years: 28 },
    ],
    services: [
      { id: 's1', name: { zh: '关节置换手术套餐', en: 'Joint Replacement Package', ru: 'Пакет замены суставов' }, price: 7500, includes: ['surgery', 'stay7', 'physio'] },
      { id: 's2', name: { zh: '心脏全面检查套餐', en: 'Cardiac Comprehensive Check', ru: 'Полная кардиологическая проверка' }, price: 3800, includes: ['echo', 'ecg', 'bloodwork'] },
    ],
    symptoms: ['joint pain', 'knee pain', 'heart', 'cardiology', 'orthopedics', '膝盖痛', '关节痛'],
  },
  {
    id: '2',
    name: { zh: '三亚国际中医康养中心', en: 'Sanya International TCM Wellness Centre', ru: 'Международный оздоровительный центр ТКМ Санья' },
    city: { zh: '三亚', en: 'Sanya', ru: 'Санья' },
    type: 'tcm',
    tags: ['level3'],
    rating: 4.8,
    reviewCount: 189,
    priceFrom: 2200,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
    description: {
      zh: '坐落于三亚国际旅游岛，集中医治疗、海滨康养于一体，提供针灸、推拿、中药调理等全系列服务。',
      en: 'Located on Hainan\'s beautiful coast, combining traditional Chinese medicine with beachside wellness. Acupuncture, Tuina, herbal therapy and more.',
      ru: 'Расположен на живописном побережье Хайнань, сочетает традиционную китайскую медицину с оздоровлением у моря. Акупунктура, Туйна, фитотерапия.',
    },
    doctors: [
      { name: { zh: '陈老中医', en: 'Master Chen', ru: 'Мастер Чэнь' }, specialty: { zh: '针灸推拿', en: 'Acupuncture & Tuina', ru: 'Акупунктура и Туйна' }, years: 40 },
    ],
    services: [
      { id: 's3', name: { zh: '21天针灸康复套餐', en: '21-Day Acupuncture Recovery', ru: '21-дневная акупунктурная реабилитация' }, price: 4200, includes: ['acupuncture', 'tuina', 'herbal', 'stay21'] },
      { id: 's4', name: { zh: '7天中医调理体验', en: '7-Day TCM Wellness Retreat', ru: '7-дневный оздоровительный ретрит ТКМ' }, price: 2200, includes: ['assessment', 'tuina', 'herbal', 'stay7'] },
    ],
    symptoms: ['chronic pain', 'insomnia', 'fatigue', 'acupuncture', 'tcm', '失眠', '疲劳', '慢性疼痛'],
  },
  {
    id: '3',
    name: { zh: '上海仁济医院国际部', en: 'Shanghai Renji Hospital International', ru: 'Международное отделение больницы Жэньцзи' },
    city: { zh: '上海', en: 'Shanghai', ru: 'Шанхай' },
    type: 'western',
    tags: ['level3', 'jci'],
    rating: 4.7,
    reviewCount: 245,
    priceFrom: 5000,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=600',
    description: {
      zh: '上海领先的国际医疗机构，提供专属外籍患者的多语种服务，专注肿瘤、肝脏等复杂病症。',
      en: 'Shanghai\'s leading international medical facility with multilingual services for overseas patients. Specialising in oncology, hepatology, and complex conditions.',
      ru: 'Ведущее международное медицинское учреждение Шанхая с многоязычными услугами. Специализация: онкология, гепатология и сложные случаи.',
    },
    doctors: [
      { name: { zh: '张院长', en: 'Director Zhang', ru: 'Директор Чжан' }, specialty: { zh: '肝脏外科', en: 'Hepatic Surgery', ru: 'Хирургия печени' }, years: 35 },
    ],
    services: [
      { id: 's5', name: { zh: '肿瘤全面评估套餐', en: 'Comprehensive Cancer Screening', ru: 'Комплексный онкологический скрининг' }, price: 5000, includes: ['mri', 'ct', 'bloodwork', 'consultation'] },
    ],
    symptoms: ['cancer', 'liver', 'oncology', 'screening', '癌症', '肿瘤', '肝脏'],
  },
  {
    id: '4',
    name: { zh: '博鳌超级医院', en: 'Boao Super Hospital', ru: 'Суперхоспиталь Боао' },
    city: { zh: '博鳌', en: 'Boao', ru: 'Боао' },
    type: 'western',
    tags: ['level3', 'jci'],
    rating: 4.9,
    reviewCount: 98,
    priceFrom: 8000,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600',
    description: {
      zh: '中国最先进的特许医疗区，可使用最新进口药物和医疗器械，专为海外患者设计。',
      en: 'China\'s most advanced special zone hospital with access to the latest imported drugs and devices, designed for international patients.',
      ru: 'Самая передовая больница в специальной зоне Китая с доступом к новейшим импортным препаратам и устройствам для международных пациентов.',
    },
    doctors: [],
    services: [
      { id: 's6', name: { zh: '进口新药尝试计划', en: 'New Drug Access Programme', ru: 'Программа доступа к новым препаратам' }, price: 12000, includes: ['evaluation', 'treatment', 'monitoring'] },
    ],
    symptoms: ['rare disease', 'advanced cancer', 'clinical trial', '罕见病', '晚期癌症'],
  },
  {
    id: '5',
    name: { zh: '成都天府中医养生园', en: 'Chengdu Tianfu TCM Garden', ru: 'Сад ТКМ Тяньфу Чэнду' },
    city: { zh: '成都', en: 'Chengdu', ru: 'Чэнду' },
    type: 'wellness',
    tags: [],
    rating: 4.6,
    reviewCount: 156,
    priceFrom: 1800,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600',
    description: {
      zh: '依托成都悠久的中医文化，提供沉浸式养生体验，含功夫茶道、太极、药膳美食。',
      en: 'Immersive wellness experience rooted in Chengdu\'s rich TCM culture. Includes kung fu tea ceremony, Tai Chi, and medicinal cuisine.',
      ru: 'Погружной оздоровительный опыт, основанный на богатой культуре ТКМ Чэнду. Включает чайную церемонию кунг-фу, Тайчи и лечебную кухню.',
    },
    doctors: [],
    services: [
      { id: 's7', name: { zh: '14天养生旅居套餐', en: '14-Day Wellness Residency', ru: '14-дневная оздоровительная программа' }, price: 3200, includes: ['accommodation', 'meals', 'classes', 'spa'] },
    ],
    symptoms: ['stress', 'wellness', 'relaxation', 'lifestyle', '减压', '养生'],
  },
];

export const DESTINATIONS = [
  { id: 'd1', name: { zh: '三亚', en: 'Sanya', ru: 'Санья' }, image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf4?w=400', count: 18 },
  { id: 'd2', name: { zh: '北京', en: 'Beijing', ru: 'Пекин' }, image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400', count: 42 },
  { id: 'd3', name: { zh: '上海', en: 'Shanghai', ru: 'Шанхай' }, image: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=400', count: 36 },
  { id: 'd4', name: { zh: '成都', en: 'Chengdu', ru: 'Чэнду' }, image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400', count: 24 },
  { id: 'd5', name: { zh: '博鳌', en: 'Boao', ru: 'Боао' }, image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400', count: 8 },
];

export const FAQ_ANSWERS: Record<string, { zh: string; en: string; ru: string }> = {
  visa: {
    zh: '来华就医签证（医疗签证）申请：\n\n1. 准备资料：中国医院邀请函、护照照片、填写签证申请表\n2. 通过中国驻本国大使馆申请\n3. 通常5-10个工作日出签\n\n我们可以协助您获取医院邀请函，并提供签证代办服务（见"增值服务"）。',
    en: 'To apply for a China Medical Visa:\n\n1. Prepare: Hospital invitation letter from China, passport photos, completed visa form\n2. Apply at the Chinese Embassy in your country\n3. Usually takes 5–10 business days\n\nWe can help obtain the hospital invitation letter and offer a full visa service (see add-ons).',
    ru: 'Для получения медицинской визы в Китай:\n\n1. Подготовьте: приглашение от китайской больницы, фото паспорта, заполненную анкету\n2. Подайте заявку в Посольстве Китая в вашей стране\n3. Обычно 5–10 рабочих дней\n\nМы поможем получить приглашение от больницы и предлагаем полное визовое сопровождение.',
  },
  medication: {
    zh: '携带处方药入境中国：\n\n✅ 允许：3个月以内用量的处方药（需携带医生处方英文版）\n❌ 不允许：麻醉品、精神类药物（需提前申报）\n\n建议携带：处方原件、药物说明书、医生证明信（英文或中文）',
    en: 'Bringing prescription medication to China:\n\n✅ Allowed: Up to 3 months\' supply with original prescription (English preferred)\n❌ Restricted: Narcotics/psychotropic substances (must be declared in advance)\n\nRecommend bringing: original prescription, medication leaflet, doctor\'s letter in English.',
    ru: 'Ввоз рецептурных препаратов в Китай:\n\n✅ Разрешено: до 3 месяцев запаса с оригинальным рецептом (предпочтительно на английском)\n❌ Ограничено: наркотики/психотропные препараты (необходимо декларировать заранее)\n\nРекомендуется: оригинальный рецепт, листок-вкладыш, справка от врача на английском.',
  },
  insurance: {
    zh: '医疗费用报销：\n\n目前大多数国家的公立医保不覆盖海外就医费用。建议：\n\n1. 购买国际医疗保险（如AXA、Cigna国际版）\n2. 向我们索取正规发票及英文诊断报告\n3. 部分机构可提供英文收据用于报销\n\n我们的客服可协助您整理所有报销所需文件。',
    en: 'Insurance reimbursement:\n\nMost public health systems don\'t cover overseas treatment. We recommend:\n\n1. Purchase international health insurance (e.g. AXA, Cigna International)\n2. Request official invoices and English diagnostic reports from us\n3. Some clinics can issue English-language receipts\n\nOur team can help prepare all documents needed for your claim.',
    ru: 'Страховое возмещение:\n\nБольшинство государственных систем здравоохранения не покрывают лечение за рубежом. Рекомендуем:\n\n1. Оформить международную медицинскую страховку (например, AXA, Cigna International)\n2. Запросить официальные счета и отчёты на английском\n3. Некоторые клиники могут выдавать квитанции на английском\n\nНаша команда поможет подготовить все документы для вашего заявления.',
  },
  companion: {
    zh: '是否需要家人陪同：\n\n不需要！我们提供专业陪诊服务：\n\n• 接机 → 医院 → 酒店全程陪同\n• 医患实时翻译（俄语/英语↔中文）\n• 24小时紧急联络\n• 回国后远程随访\n\n独自来华的老人是我们最主要的服务对象。您来，我们就在。',
    en: 'Do you need a family member?\n\nNo! Our professional companion service covers everything:\n\n• Airport → Hospital → Hotel — full accompaniment\n• Real-time medical translation (Russian/English ↔ Chinese)\n• 24-hour emergency contact\n• Remote follow-up after you return home\n\nSolo elderly travellers are our core clients. You come, we\'re there.',
    ru: 'Нужен ли сопровождающий?\n\nНет! Наша профессиональная служба сопровождения включает:\n\n• Аэропорт → Больница → Отель — полное сопровождение\n• Синхронный медицинский перевод (русский/английский ↔ китайский)\n• Круглосуточная экстренная связь\n• Дистанционное наблюдение после возвращения домой\n\nПожилые путешественники без сопровождения — наши основные клиенты.',
  },
};

export const MOCK_TRIP = {
  active: true,
  institution: INSTITUTIONS[1],
  arrivalDate: '2026-06-10',
  departureDate: '2026-07-01',
  driver: { name: '张师傅', phone: '+86 138 0001 0001', vehiclePlate: '沪A 12345', verified: true },
  timeline: [
    { time: '14:30', type: 'pickup', label: { zh: '接机', en: 'Airport Pickup', ru: 'Трансфер из аэропорта' }, done: false },
    { time: '17:00', type: 'checkin', label: { zh: '酒店入住', en: 'Hotel Check-in', ru: 'Заезд в отель' }, done: false },
    { time: '09:00', type: 'hospital', label: { zh: '初诊 · 三亚国际中医康养中心', en: 'First Visit · Sanya TCM Centre', ru: 'Первый визит · ТКМ Санья' }, done: false, date: 'tomorrow' },
  ],
  reminders: [
    { id: 'r1', text: { zh: '今晚禁止饮酒，明日初诊前请空腹', en: 'No alcohol tonight. Fast before tomorrow\'s first appointment.', ru: 'Сегодня вечером не употребляйте алкоголь. Завтра перед приёмом не есть.' } },
  ],
};
