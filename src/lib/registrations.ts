import { z } from "zod";
import { BLOCKS, STATUS_VALUES } from "./camp";

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
};

export const adminListSchema = z.object({
  name: z.string().optional().default(""),
  mobile: z.string().optional().default(""),
  block: z.string().optional().default(""),
  nyayaPanchayat: z.string().optional().default(""),
  date: z.string().optional().default(""),
  status: z.string().optional().default(""),
});

export const adminStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(STATUS_VALUES),
});
