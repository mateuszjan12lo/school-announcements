import { z } from "zod";
import { parseLocal } from "./dates";

const bool = z.preprocess((v) => v === "on" || v === true || v === "true", z.boolean());
const dt = z.string().optional().transform((v) => (v ? parseLocal(v) : null)).refine((v) => v === null || !Number.isNaN(v), "Nieprawidłowa data");

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Tytuł jest za krótki (minimum 3 znaki)").max(120, "Tytuł jest za długi (maksymalnie 120 znaków)"),
  body: z.string().trim().max(2000, "Treść jest za długa (maksymalnie 2000 znaków)").default(""),
  classId: z.string().max(60).optional().transform((v) => (v ? v : null)),
  pinned: bool.default(false),
  deadlineAt: dt,
  expiresAt: dt,
}).refine((v) => !v.expiresAt || !v.deadlineAt || v.expiresAt >= v.deadlineAt, { message: "Ogłoszenie nie może wygasnąć przed terminem", path: ["expiresAt"] });

export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email("Podaj poprawny adres e-mail"), password: z.string().min(1, "Podaj hasło").max(200) });
