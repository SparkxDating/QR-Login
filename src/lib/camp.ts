export const CAMP = {
  foundation: "त्रिशक्ति सेवा फाउण्डेशन",
  hospital: "आर जे शंकरा आई हॉस्पिटल, वाराणसी",
  hospitalEn: "RJ Shankara Eye Hospital",
  hospitalUnit: "Unit of Sri Kanchi Kamakoti Medical Trust",
  campaign: "मासिक अभियान",
  title: "वृहद निःशुल्क मोतियाबिंद जाࠓच एवं ऑपरेशन शिविर",
  formTitle: "निःशुल्क मोतियाबिंद शिविर पंजीकरण",
  subtitle:
    "(चहनियाँ-सकलडीहा ब्लॉक, जनपद-चंदौली के प्रत्येक न्याय पंचायत में)",
  dateLabel: "11 जनवरी 2026",
  dayLabel: "रविवार",
  timeLabel: "सुबह 10:00 बजे से सायं 4:00 बजे तक",
  address:
    "रिंग रोड - फेस 1, माधोपुर, सीएचसीजी पम्प के पास, वाराणसी - 221003",
  phones: ["9453793949", "9616656572", "7678821001"] as const,
  organizer: "अम्बरीश सिंह ‘भोला’",
  organizerRole:
    "सदस्य, वाराणसी विकास प्राधिकरण बोर्ड, वाराणसी (उत्तर प्रदेश सरकार)",
  districtDefault: "चंदौली",
  freeNote: "रजिस्ट्रेशन एवं जाࠓच पूर्णतः निःशुल्क",
  operationNote: "जाࠓच एवं ऑपरेशन पूरी तरह निःशुल्क किया जाएगा।",
} as const;

export const BLOCKS = ["चहनियाँ", "सकलडीहा"] as const;
export type BlockName = (typeof BLOCKS)[number];

export const STATUSES = [
  { value: "registered", label: "पंजीकृत" },
  { value: "screened", label: "जाࠓच पूर्ण" },
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

export const PHOTO_SLOTS = [
  {
    src: "/photos/narendra-modi.svg",
    name: "श्री नरेन्द्र मोदी",
    title: "माननीय प्रधानमंत्री",
  },
  {
    src: "/photos/yogi-adityanath.svg",
    name: "योगी आदित्यनाथ",
    title: "माननीय मुख्यमंत्री, उ.प्र.",
  },
  {
    src: "/photos/ambarish-singh-bhola.svg",
    name: "अम्बरीश सिंह ‘भोला’",
    title: "कार्यक्रम संयोजक",
  },
] as const;

export const SERVICES = [
  { title: "निःशुल्क मोतियाबिंद जाࠓच", detail: "विशेषज्ञ चिकित्सकों द्वारा" },
  { title: "निःशुल्क ऑपरेशन", detail: "सुरक्षित शल्य चिकित्सा" },
  { title: "निःशुल्क दवा एवं चश्मा", detail: "आवश्यक दवा और चश्मा" },
] as const;

export const DOCUMENTS = [
  "आधार कार्ड की फोटो कॉपी",
  "मोबाइल नंबर",
  "मास्क",
  "दवाईयाँ (अगर पहले से कोई दवाई लेते हों)",
] as const;
