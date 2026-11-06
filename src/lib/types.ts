export interface Klass { id: string; name: string }
export interface Announcement {
  id: string; title: string; body: string;
  /** null = cała szkoła */
  classId: string | null;
  pinned: boolean;
  /** Termin (np. oddania pracy) – to on trafia do kalendarza. */
  deadlineAt: number | null;
  /** Po tej dacie ogłoszenie znika z listy publicznej. null = nie wygasa. */
  expiresAt: number | null;
  createdAt: number;
}
export interface AdminUser { id: string; email: string }
