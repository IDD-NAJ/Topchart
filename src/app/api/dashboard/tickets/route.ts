import { NextResponse } from "next/server";
import { getTickets, createTicket } from "@/lib/actions/tickets";
import { isPgMissingRelation, sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ensure tables exist before handling requests
async function ensureTicketTables() {
  try {
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketStatus') THEN
        CREATE TYPE "TicketStatus" AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');
      END IF;
    END $$`;
    
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketPriority') THEN
        CREATE TYPE "TicketPriority" AS ENUM ('LOW','MEDIUM','HIGH','URGENT');
      END IF;
    END $$`;
    
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketChannel') THEN
        CREATE TYPE "TicketChannel" AS ENUM ('EMAIL','CHAT','IN_APP');
      END IF;
    END $$`;
    
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TicketSenderType') THEN
        CREATE TYPE "TicketSenderType" AS ENUM ('USER','ADMIN','SYSTEM');
      END IF;
    END $$`;

    await sql`
      CREATE TABLE IF NOT EXISTS tickets (
        id            TEXT PRIMARY KEY,
        "userId"      TEXT NOT NULL,
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
  } catch (error) {
    console.error("ensureTicketTables error:", error);
  }
}

export async function GET() {
  try {
    await ensureTicketTables();
    const tickets = await getTickets();
    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    console.error("Tickets GET error:", error);
    
    // If unauthorized, return 401
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }
    
    // For any other error, return success with empty tickets with 200 status
    return NextResponse.json({ success: true, tickets: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    console.log("POST /api/dashboard/tickets - starting");
    await ensureTicketTables();
    console.log("Tables ensured");
    const body = await req.json();
    console.log("Request body:", body);
    const result = await createTicket(body);
    console.log("Ticket created:", result);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Tickets POST error:", error);
    
    // If unauthorized, return 401
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }
    
    // For any other error, return 500 with details
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}
