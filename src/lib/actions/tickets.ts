"use server";

import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";
import { nanoid } from "nanoid";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketChannel = "EMAIL" | "CHAT" | "IN_APP";
export type TicketSenderType = "USER" | "ADMIN" | "SYSTEM";

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderType: TicketSenderType;
  body: string;
  attachments: string[] | null;
  createdAt: Date;
}

export const TICKET_CATEGORIES = [
  "General",
  "Payment & Billing",
  "Account & Security",
  "Data & Airtime",
  "Verification Numbers",
  "Technical Issue",
  "Reseller",
  "Other",
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: TicketChannel;
  externalRef: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: TicketMessage[];
}

export async function getTickets() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const tickets = await sql`
    SELECT * FROM tickets 
    WHERE "userId" = ${user.id} 
    ORDER BY "createdAt" DESC
  `;

  return tickets as unknown as Ticket[];
}

export async function getTicketById(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const ticketResult = await sql`
    SELECT * FROM tickets 
    WHERE id = ${id} AND "userId" = ${user.id}
  `;

  if (!ticketResult || ticketResult.length === 0) return null;

  const messages = await sql`
    SELECT * FROM ticket_messages 
    WHERE "ticketId" = ${id} 
    ORDER BY "createdAt" ASC
  `;

  const ticket = ticketResult[0] as unknown as Ticket;
  ticket.messages = messages as unknown as TicketMessage[];

  return ticket;
}

export async function createTicket(data: {
  subject: string;
  message: string;
  priority?: TicketPriority;
  category?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const ticketId = `TKT-${nanoid(10).toUpperCase()}`;
  const now = new Date();
  const category = data.category || "General";

  await sql`
    INSERT INTO tickets (id, "userId", subject, category, status, priority, channel, "createdAt", "updatedAt")
    VALUES (
      ${ticketId},
      ${user.id},
      ${data.subject},
      ${category},
      'OPEN'::"TicketStatus",
      ${data.priority || 'MEDIUM'}::"TicketPriority",
      'IN_APP'::"TicketChannel",
      ${now},
      ${now}
    )
  `;

  const messageId = nanoid();
  await sql`
    INSERT INTO ticket_messages (id, "ticketId", "senderType", body, "createdAt")
    VALUES (
      ${messageId},
      ${ticketId},
      'USER'::"TicketSenderType",
      ${data.message},
      ${now}
    )
  `;

  return { id: ticketId };
}

export async function closeTicket(ticketId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const ticketResult = await sql`
    SELECT id FROM tickets WHERE id = ${ticketId} AND "userId" = ${user.id}
  `;
  if (!ticketResult || ticketResult.length === 0) throw new Error("Ticket not found or unauthorized");

  const now = new Date();
  await sql`
    UPDATE tickets SET status = 'CLOSED'::"TicketStatus", "updatedAt" = ${now}
    WHERE id = ${ticketId}
  `;
  return { ok: true };
}

export async function reopenTicket(ticketId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const ticketResult = await sql`
    SELECT id FROM tickets WHERE id = ${ticketId} AND "userId" = ${user.id}
  `;
  if (!ticketResult || ticketResult.length === 0) throw new Error("Ticket not found or unauthorized");

  const now = new Date();
  await sql`
    UPDATE tickets SET status = 'OPEN'::"TicketStatus", "updatedAt" = ${now}
    WHERE id = ${ticketId}
  `;
  return { ok: true };
}

export async function sendTicketMessage(ticketId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const ticketResult = await sql`
    SELECT id FROM tickets WHERE id = ${ticketId} AND "userId" = ${user.id}
  `;
  if (!ticketResult || ticketResult.length === 0) throw new Error("Ticket not found or unauthorized");

  const messageId = nanoid();
  const now = new Date();

  await sql`
    INSERT INTO ticket_messages (id, "ticketId", "senderType", body, "createdAt")
    VALUES (
      ${messageId}, 
      ${ticketId}, 
      'USER'::"TicketSenderType", 
      ${body}, 
      ${now}
    )
  `;

  await sql`
    UPDATE tickets SET "updatedAt" = ${now} WHERE id = ${ticketId}
  `;

  return { id: messageId };
}
