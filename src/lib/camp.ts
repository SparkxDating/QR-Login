export const CAMP = {
  foundation: "त्रिशक्ति सेवा फाउंडेशन",
  hospital: "आर जे शंकरा आई हॉस्पिटल, वाराणसी",
  hospitalEn: "RJ Shankara Eye Hospital",
  hospitalUnit: "Unit of Sri Kanchi Kamakoti Medical Trust",
  campaign: "मासिक अभियान",
  inspiration: "प्रेरणा स्रोत",
  title: "वृहद निःशुल्क मोतियाबिंद जाँच एवं ऑपरेशन शिविर",
  titleLine1: "वृहद निःशुल्क मोतियाबिंद",
  titleLine2: "जाँच एवं ऑपरेशन शिविर",
  formTitle: "निःशुल्क मोतियाबिंद शिविर पंजीकरण",
  formHeading: "पंजीकरण हेतु विवरण",
  servicesHeading: "शिविर की विशेषताएँ",
  documentsHeading:
    "आवश्यक दस्तावेज एवम् सामग्री जो मरीज को जाँच के दिन साथ लाना है",
  contactHeading: "अधिक जानकारी के लिए नीचे दिए गए नंबर से संपर्क करें",
  subtitle:
    "(चहनियाँ-सकलडीहा ब्लॉक, जनपद-चंदौली के प्रत्येक न्याय पंचायत में)",
  dateLabel: "15 सितंबर 2026",
  dateLine: "चहनियाँ ब्लॉक में 15 सितंबर 2026 से कार्यक्रम का शुभारंभ होगा",
  dayLabel: "मंगलवार",
  timeLabel: "सुबह 10:00 बजे से सायं 4:00 बजे तक",
  address:
    "रिंग रोड - फेस 1, माधोपुर, सीएचसीजी पम्प के पास, वाराणसी - 221003",
  organizer: "अम्बरीश सिंह “भोला”",
  organizerRole: "कार्यक्रम संयोजक",
  organizerBoard: "मानद सदस्य, वाराणसी विकास प्राधिकरण बोर्ड",
  organizerGov: "उ०प्र० सरकार",
  organizerHonor: "मानद सदस्य,वाराणसी विकास प्राधिकरण बोर्ड उ०प्र० सरकार",
  districtDefault: "चंदौली",
  freeNote: "रजिस्ट्रेशन एवं जाँच पूर्णतः निःशुल्क",
  operationNote: "जाँच एवं ऑपरेशन पूरी तरह निःशुल्क किया जाएगा।",
  privacyNote:
    "आपकी दी गई जानकारी केवल शिविर पंजीकरण एवं आवश्यक संपर्क के लिए उपयोग की जाएगी।",
  logo: {
    src: "/photos/trishakti-seva-foundation.jpg",
    alt: "त्रिशक्ति सेवा फाउंडेशन",
  },
} as const;

export const BLOCKS = ["चहनियाँ", "सकलडीहा"] as const;
export type BlockName = (typeof BLOCKS)[number];

export const STATUSES = [
  { value: "registered", label: "पंजीकृत" },
  { value: "screened", label: "जाँच पूर्ण" },
  { value: "operation_recommended", label: "ऑपरेशन अनुशंसित" },
  { value: "operation_completed", label: "ऑपरेशन पूर्ण" },
  { value: "follow_up", label: "फॉलो-अप" },
] as const;

export type RegistrationStatus = (typeof STATUSES)[number]["value"];

export const STATUS_VALUES = STATUSES.map((s) => s.value) as [
  RegistrationStatus,
  ...RegistrationStatus[],
];

export function statusLabel(value: string): string {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}

export const PHOTOS = {
  yogi: {
    src: "/photos/yogi-adityanath.jpg",
    name: "योगी आदित्यनाथ जी",
    title: "मुख्यमंत्री उत्तर प्रदेश",
  },
  modi: {
    src: "/photos/narendra-modi.jpg",
    name: "श्री नरेंद्र मोदी जी",
    title: "माननीय प्रधानमंत्री",
  },
  jagatguru: {
    src: "/photos/jagatguru-vijendra-saraswati.jpg",
    name: "जगतगुरु विजेंद्र सरस्वती जी",
    title: "शंकराचार्य, कांची कामकोटि पीठम",
  },
  bhola: {
    src: "/photos/ambarish-singh-bhola.jpg",
    name: "अम्बरीश सिंह “भोला”",
    title: "कार्यक्रम संयोजक",
  },
} as const;

export const CONTACTS = [
  { name: "रामदयाल यादव रिंकू", phone: "9453889858" },
  { name: "अतुल सिंह रघुवंशी", phone: "9453793949" },
  { name: "हरिश्चंद्र यादव", phone: "7389848701" },
  { name: "रामदयाल साहनी", phone: "8299108081" },
  { name: "मोहित राय", phone: "7237847349" },
] as const;

export const SERVICES = [
  { title: "निःशुल्क मोतियाबिंद जाँच", icon: "eye" },
  { title: "निःशुल्क ऑपरेशन", icon: "bed" },
  { title: "निःशुल्क दवा", icon: "pill" },
] as const;

export const DOCUMENTS = [
  "आधार कार्ड की फोटो कॉपी",
  "मोबाइल नंबर",
  "मास्क",
  "दवाईयाँ (अगर पहले से कोई दवाई लेते हों)",
] as const;
