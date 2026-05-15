import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const steps: string[] = [];

    // Create enum types
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketStatus') THEN
        CREATE TYPE "TicketStatus" AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');
      END IF;
    END $$`;
    steps.push("TicketStatus enum created");

    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketPriority') THEN
        CREATE TYPE "TicketPriority" AS ENUM ('LOW','MEDIUM','HIGH','URGENT');
      END IF;
    END $$`;
    steps.push("TicketPriority enum created");

    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketChannel') THEN
        CREATE TYPE "TicketChannel" AS ENUM ('EMAIL','CHAT','IN_APP');
      END IF;
    END $$`;
    steps.push("TicketChannel enum created");

    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketSenderType') THEN
        CREATE TYPE "TicketSenderType" AS ENUM ('USER','ADMIN','SYSTEM');
      END IF;
    END $$`;
    steps.push("TicketSenderType enum created");

    // Create tickets table
    await sql`
      CREATE TABLE IF NOT EXISTS tickets (
        id            TEXT PRIMARY KEY,
        "userId"      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject       TEXT NOT NULL,
        category      TEXT NOT NULL DEFAULT 'General',
        status        "TicketStatus"   NOT NULL DEFAULT 'OPEN',
        priority      "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
        channel       "TicketChannel"  NOT NULL DEFAULT 'IN_APP',
        "externalRef" TEXT,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_userId ON tickets("userId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tickets_createdAt ON tickets("createdAt" DESC)`;
    steps.push("tickets table created");

    // Create ticket_messages table
    await sql`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id           TEXT PRIMARY KEY,
        "ticketId"   TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        "senderType" "TicketSenderType" NOT NULL DEFAULT 'USER',
        body         TEXT NOT NULL,
        attachments  JSONB NOT NULL DEFAULT '[]'::jsonb,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticketId ON ticket_messages("ticketId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ticket_messages_createdAt ON ticket_messages("createdAt" ASC)`;
    steps.push("ticket_messages table created");

    return NextResponse.json({ success: true, steps });
  } catch (error: any) {
    console.error("Tickets migration failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
