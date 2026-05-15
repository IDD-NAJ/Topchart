import { sql, isPgMissingRelation } from "@/lib/db";

export type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  priority?: number;
  category?: string;
};

async function getHomepageFaqs(): Promise<PublicFaq[] | null> {
  try {
    const rows = await sql`
      SELECT id, question, answer, priority
      FROM homepage_faqs
      WHERE is_active = TRUE
      ORDER BY priority ASC, created_at ASC
    `;
    return (rows as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      question: String(row.question),
      answer: String(row.answer),
      priority: row.priority != null ? Number(row.priority) : 0,
      category: "General",
    }));
  } catch (error) {
    if (isPgMissingRelation(error)) return null;
    throw error;
  }
}

async function getLegacyFaqs(): Promise<PublicFaq[]> {
  try {
    const rows = await sql`
      SELECT id, question, answer, category, sort_order
      FROM faqs
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, created_at ASC
    `;
    return (rows as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      question: String(row.question),
      answer: String(row.answer),
      priority: row.sort_order != null ? Number(row.sort_order) : 0,
      category: row.category ? String(row.category) : "General",
    }));
  } catch (error) {
    if (isPgMissingRelation(error)) return [];
    throw error;
  }
}

export async function getActiveFaqs(): Promise<PublicFaq[]> {
  const homepage = await getHomepageFaqs();
  if (homepage && homepage.length > 0) return homepage;

  const legacy = await getLegacyFaqs();
  if (legacy.length > 0) return legacy;

  return homepage ?? [];
}
