import { z } from "zod";
import { BLOCKS, STATUS_VALUES } from "./camp";

const required = (message: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, message)
    .max(max, `अधिकतम ${max} अक्षर`);

export const registrationInputSchema = z.object({
  name: required("नाम आवश्यक है"),
  fatherOrHusbandName: required("पिता/पति का नाम आवश्यक है"),
  village: required("ग्राम आवश्यक है"),
  post: required("पोस्ट आवश्यक है"),
  nyayaPanchayat: required("न्याय पंचायत आवश्यक है"),
  block: z.enum(BLOCKS, { message: "ब्लॉक चुनें — चहनियाँ या सकलडीहा" }),
  tehsil: required("तहसील आवश्यक है"),
  district: required("जनपद आवश्यक है"),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "मोबाइल नंबर ठीक 10 अंक का होना चाहिए"),
  note: z.string().trim().max(500, "नोट अधिकतम 500 अक्षर").optional().default(""),
  confirmed: z.boolean().refine((v) => v === true, {
    message: "कृपया घोषणा पर सही का निशान लगाएँ",
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

export const adminTokenSchema = z.object({
  token: z.string().optional(),
});

export const adminListSchema = z.object({
  token: z.string().optional(),
  name: z.string().optional().default(""),
  mobile: z.string().optional().default(""),
  block: z.string().optional().default(""),
  nyayaPanchayat: z.string().optional().default(""),
  date: z.string().optional().default(""),
  status: z.string().optional().default(""),
});

export const adminStatusSchema = z.object({
  token: z.string().optional(),
  id: z.number().int().positive(),
  status: z.enum(STATUS_VALUES),
});
