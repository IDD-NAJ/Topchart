import { v4 as uuidv4 } from "uuid";
import { sql } from "@/lib/db";
import {
  getRequest,
  getRequestSMS,
  mapUnknownToPvadealsSms,
  type PVARequest,
  type PVASMS,
} from "@/lib/pvadeals";

export type VerificationNumberDbStatus = "active" | "completed" | "expired" | "cancelled";

export function mapPvaRequestStatusToDb(pvaStatus: string | undefined): VerificationNumberDbStatus {
  const u = pvaStatus?.toUpperCase();
  if (u === "COMPLETED") return "completed";
  if (u === "FLAGGED") return "cancelled";
  if (u === "EXPIRED") return "expired";
  return "active";
}

function sanitizeSmsFromNumber(from: string): string {
  const t = from.trim();
  if (!t) return "Unknown";
  return t.length > 20 ? t.slice(0, 20) : t;
}

export async function upsertPvadealsSmsRows(
  numberId: string,
  messages: Array<{ _id?: string; from?: string; message?: string; receivedAt?: string }>
): Promise<void> {
  for (const msg of messages) {
    try {
      const fromNum = sanitizeSmsFromNumber(msg.from || "Unknown");
      await sql`
        INSERT INTO verification_sms (
          id, number_id, from_number, message, pvadeals_sms_id, received_at
        ) VALUES (
          ${uuidv4()}, ${numberId}, ${fromNum},
          ${msg.message || ""}, ${msg._id || null},
          ${msg.receivedAt || new Date().toISOString()}
        )
        ON CONFLICT (pvadeals_sms_id) DO NOTHING
      `;
    } catch (error) {
      console.error("[verification-sms-sync] Failed to store SMS row:", error);
    }
  }
}

function embeddedSmsFromRequestPayload(pva: PVARequest): PVASMS[] {
  const o = pva as unknown as Record<string, unknown>;
  const collected: unknown[] = [];
  for (const k of ["sms", "smsList", "sms_list", "messages", "incomingSms", "incomingSMS"]) {
    const v = o[k];
    if (Array.isArray(v)) collected.push(...v);
  }
  return collected.map(mapUnknownToPvadealsSms).filter(Boolean) as PVASMS[];
}

export async function syncPvadealsRequestAndSms(opts: {
  numberId: string;
  pvadealsRequestId: string;
}): Promise<
  | { ok: true; pva: PVARequest; dbStatus: VerificationNumberDbStatus; smsSyncWarning?: string }
  | { ok: false; error: string }
> {
  const pvaResult = await getRequest(opts.pvadealsRequestId);
  if (!pvaResult.success || !pvaResult.data) {
    return { ok: false, error: pvaResult.error || "Failed to fetch request from provider" };
  }

  const pva = pvaResult.data;
  const dbStatus = mapPvaRequestStatusToDb(pva.status);

  await sql`
    UPDATE verification_numbers
    SET
      status = ${dbStatus},
      allow_flag = ${pva.allowFlag},
      allow_reuse = ${pva.allowReuse ?? false},
      completed_at = CASE
        WHEN ${dbStatus} IN ('completed', 'cancelled', 'expired') THEN COALESCE(completed_at, NOW())
        ELSE completed_at
      END,
      updated_at = NOW()
    WHERE id = ${opts.numberId}
  `.catch(() => null);

  const embeddedSms = embeddedSmsFromRequestPayload(pva);
  if (embeddedSms.length > 0) {
    await upsertPvadealsSmsRows(opts.numberId, embeddedSms);
  }

  let smsSyncWarning: string | undefined;
  const smsResult = await getRequestSMS(opts.pvadealsRequestId);
  if (smsResult.success && Array.isArray(smsResult.data)) {
    await upsertPvadealsSmsRows(opts.numberId, smsResult.data);
  } else if (!smsResult.success) {
    smsSyncWarning = smsResult.error || "Failed to fetch SMS from provider";
    console.warn("[verification-sms-sync]", smsSyncWarning);
  }

  if (embeddedSms.length === 0 && (!smsResult.success || !Array.isArray(smsResult.data) || smsResult.data.length === 0)) {
    return { ok: false, error: smsSyncWarning || "No SMS available from provider" };
  }

  return { ok: true, pva, dbStatus, smsSyncWarning };
}
