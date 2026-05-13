import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";
import { nanoid } from "nanoid";

export type DisputeStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Dispute {
  id: string;
  transactionId: string;
  userId: string;
  status: DisputeStatus;
  reason: string | null;
  resolution: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export async function getDisputes() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const disputes = await sql`
    SELECT d.*, t.type as "transactionType", t.amount as "transactionAmount"
    FROM disputes d
    JOIN transactions t ON d."transactionId" = t.id
    WHERE d."userId" = ${user.id}
    ORDER BY d."createdAt" DESC
  `;

  return disputes as unknown as (Dispute & { transactionType: string, transactionAmount: number })[];
}

export async function createDispute(data: {
  transactionId: string;
  reason: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify transaction ownership
  const txResult = await sql`
    SELECT id FROM transactions WHERE id = ${data.transactionId} AND user_id = ${user.id}
  `;
  if (!txResult || txResult.length === 0) throw new Error("Transaction not found or unauthorized");

  // Check if dispute already exists for this transaction
  const existingDispute = await sql`
    SELECT id FROM disputes WHERE "transactionId" = ${data.transactionId}
  `;
  if (existingDispute && existingDispute.length > 0) throw new Error("A dispute already exists for this transaction");

  const disputeId = `DSP-${nanoid(10).toUpperCase()}`;
  const now = new Date();

  await sql`
    INSERT INTO disputes (id, "transactionId", "userId", status, reason, "createdAt")
    VALUES (
      ${disputeId}, 
      ${data.transactionId}, 
      ${user.id}, 
      'OPEN'::"DisputeStatus", 
      ${data.reason}, 
      ${now}
    )
  `;

  return { id: disputeId };
}
