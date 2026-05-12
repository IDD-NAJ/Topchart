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
    const fromNum = sanitizeSmsFromNumber(msg.from || "Unknown");
    const smsId = msg._id || null;
    const receivedAt = msg.receivedAt || new Date().toISOString();
    const message = msg.message || "";

    try {
      if (smsId) {
        await sql`
          INSERT INTO verification_sms (
            id, number_id, from_number, message, pvadeals_sms_id, received_at
          ) VALUES (
            ${uuidv4()}, ${numberId}, ${fromNum},
            ${message}, ${smsId}, ${receivedAt}
          )
          ON CONFLICT (pvadeals_sms_id) DO NOTHING
        `;
      } else {
        await sql`
          INSERT INTO verification_sms (
            id, number_id, from_number, message, received_at
          ) VALUES (
            ${uuidv4()}, ${numberId}, ${fromNum}, ${message}, ${receivedAt}
          )
        `;
      }
    } catch (primaryErr: any) {
      const pgCode: string = primaryErr?.code ?? "";
      const isColumnMissing = pgCode === "42703" || String(primaryErr?.message ?? "").includes("column");
      if (isColumnMissing) {
        console.warn("[verification-sms-sync] Column missing — retrying minimal insert:", primaryErr?.message);
        try {
          await sql`
            INSERT INTO verification_sms (id, number_id, message, received_at)
            VALUES (${uuidv4()}, ${numberId}, ${message}, ${receivedAt})
          `;
        } catch (fallbackErr) {
          console.error("[verification-sms-sync] Fallback insert also failed:", fallbackErr);
        }
      } else {
        console.error("[verification-sms-sync] Failed to store SMS row (pg code:", pgCode, "):", primaryErr?.message ?? primaryErr);
      }
    }
  }
}

function embeddedSmsFromRequestPayload(pva: PVARequest): PVASMS[] {
  const o = pva as unknown as Record<string, unknown>;
  const collected: unknown[] = [];
  for (const k of ["sms", "smsList", "sms_list", "messages", "incomingSms", "incomingSMS", "codes"]) {
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
  console.log(`[PVA-REQUEST-RAW] numberId=${opts.numberId} requestId=${opts.pvadealsRequestId} status=${pva.status} msgCounter=${pva.messageCounter ?? "n/a"} embeddedSmsFound=${embeddedSms.length}`);
  if (embeddedSms.length > 0) {
    console.log(`[PVA-REQUEST-RAW] embedded SMS preview:`, JSON.stringify(embeddedSms.slice(0, 2)));
    await upsertPvadealsSmsRows(opts.numberId, embeddedSms);
  }

  let smsSyncWarning: string | undefined;
  const smsResult = await getRequestSMS(opts.pvadealsRequestId);
  if (smsResult.success && Array.isArray(smsResult.data)) {
    console.log(`[PVA-SMS-RAW] numberId=${opts.numberId} smsCount=${smsResult.data.length} preview:`, JSON.stringify(smsResult.data.slice(0, 2)));
    await upsertPvadealsSmsRows(opts.numberId, smsResult.data);
  } else if (!smsResult.success) {
    smsSyncWarning = smsResult.error || "Failed to fetch SMS from provider";
    console.error("[PVA-SMS-RAW] getRequestSMS failed:", smsSyncWarning);
  } else {
    console.log(`[PVA-SMS-RAW] numberId=${opts.numberId} success but data is not an array:`, typeof smsResult.data, JSON.stringify(smsResult.data)?.slice(0, 300));
  }

  return { ok: true, pva, dbStatus, smsSyncWarning };
}
