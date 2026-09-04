import { z } from "zod";
import { BLOCKS, FOLLOW_UP_STATUS_VALUES, STATUS_VALUES } from "./camp";
import { csvCell } from "./sanitize";

const required = (message: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, message)
    .max(max, `अधिकतम ${max} अक्षर`);

export const registrationInputSchema = z.object({
  name: required("कृपया अपना नाम दर्ज करें।"),
  fatherOrHusbandName: required("कृपया पिता/पति का नाम दर्ज करें।"),
  village: required("कृपया ग्राम दर्ज करें।"),
  post: required("कृपया पोस्ट दर्ज करें।"),
  nyayaPanchayat: required("कृपया न्याय पंचायत दर्ज करें।"),
  block: z.enum(BLOCKS, { message: "कृपया ब्लॉक चुनें — चहनियाँ या सकलडीहा।" }),
  tehsil: required("कृपया तहसील दर्ज करें।"),
  district: required("कृपया जनपद दर्ज करें।"),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।"),
  note: z.string().trim().max(500, "नोट अधिकतम 500 अक्षर").optional().default(""),
  confirmed: z.boolean().refine((v) => v === true, {
    message: "कृपया घोषणा पर सही का निशान लगाएँ।",
  }),
  website: z.string().optional().default(""),
});

export type RegistrationInput = z.infer<typeof registrationInputSchema>;

export type DuplicateKind = "" | "mobile" | "name_village" | "both";

export function duplicateLabel(kind: DuplicateKind): string {
  if (kind === "both") {
    return "संभावित डुप्लिकेट: यही मोबाइल तथा नाम+ग्राम अन्य पंजीकरण से मेल खाते हैं। रिकॉर्ड नहीं हटाया गया।";
  }
  if (kind === "mobile") {
    return "संभावित डुप्लिकेट: यही मोबाइल अन्य पंजीकरण में भी है। रिकॉर्ड नहीं हटाया गया।";
  }
  if (kind === "name_village") {
    return "संभावित डुप्लिकेट: यही नाम और ग्राम अन्य पंजीकरण में भी हैं। रिकॉर्ड नहीं हटाया गया।";
  }
  return "";
}

export type RegistrationRow = {
  id: number;
  registrationNumber: string;
  name: string;
  fatherOrHusbandName: string;
  village: string;
  post: string;
  nyayaPanchayat: string;
  block: string;
  tehsil: string;
  district: string;
  mobile: string;
  note: string;
  status: string;
  createdAt: string;
  screeningDate: string;
  surgeryDate: string;
  followUpDate: string;
  followUpStatus: string;
  followUpNotes: string;
  duplicate: DuplicateKind;
};

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "अमान्य तिथि");

export const adminListSchema = z.object({
  registrationNumber: z.string().optional().default(""),
  name: z.string().optional().default(""),
  mobile: z.string().optional().default(""),
  village: z.string().optional().default(""),
  block: z.string().optional().default(""),
  nyayaPanchayat: z.string().optional().default(""),
  date: z.string().optional().default(""),
  dateFrom: z.string().optional().default(""),
  dateTo: z.string().optional().default(""),
  status: z.string().optional().default(""),
});

export type AdminListFilters = z.infer<typeof adminListSchema>;

export const adminStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(STATUS_VALUES),
});

export const adminBulkStatusSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  status: z.enum(STATUS_VALUES),
});

export const adminEditSchema = z.object({
  id: z.number().int().positive(),
  name: required("कृपया अपना नाम दर्ज करें।"),
  fatherOrHusbandName: required("कृपया पिता/पति का नाम दर्ज करें।"),
  village: required("कृपया ग्राम दर्ज करें।"),
  post: required("कृपया पोस्ट दर्ज करें।"),
  nyayaPanchayat: required("कृपया न्याय पंचायत दर्ज करें।"),
  block: z.enum(BLOCKS, { message: "कृपया ब्लॉक चुनें — चहनियाँ या सकलडीहा।" }),
  tehsil: required("कृपया तहसील दर्ज करें।"),
  district: required("कृपया जनपद दर्ज करें।"),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।"),
  note: z.string().trim().max(500, "नोट अधिकतम 500 अक्षर").optional().default(""),
  status: z.enum(STATUS_VALUES),
  screeningDate: optionalDate.optional().default(""),
  surgeryDate: optionalDate.optional().default(""),
  followUpDate: optionalDate.optional().default(""),
  followUpStatus: z.union([z.literal(""), z.enum(FOLLOW_UP_STATUS_VALUES)]).optional().default(""),
  followUpNotes: z.string().trim().max(500, "नोट अधिकतम 500 अक्षर").optional().default(""),
});

const CSV_HEADER = [
  "registrationNumber",
  "name",
  "fatherOrHusbandName",
  "village",
  "post",
  "nyayaPanchayat",
  "block",
  "tehsil",
  "district",
  "mobile",
  "note",
  "status",
  "createdAt",
  "screeningDate",
  "surgeryDate",
  "followUpDate",
  "followUpStatus",
  "followUpNotes",
] as const;

export function registrationCsv(rows: RegistrationRow[]): string {
  const lines = [
    CSV_HEADER.join(","),
    ...rows.map((row) =>
      [
        row.registrationNumber,
        row.name,
        row.fatherOrHusbandName,
        row.village,
        row.post,
        row.nyayaPanchayat,
        row.block,
        row.tehsil,
        row.district,
        row.mobile,
        row.note,
        row.status,
        row.createdAt,
        row.screeningDate,
        row.surgeryDate,
        row.followUpDate,
        row.followUpStatus,
        row.followUpNotes,
      ]
        .map((cell) => csvCell(String(cell)))
        .join(","),
    ),
  ];
  return `\uFEFF${lines.join("\n")}`;
}
