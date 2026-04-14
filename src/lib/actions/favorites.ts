"use server"

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface Favorite {
  id: string;
  user_id: string;
  phone_number: string;
  name: string | null;
  type: string;
  network: string | null;
  created_at: string;
}

export async function getFavorites(userId: string, type?: string) {
  try {
    let result;
    if (type) {
      result = await sql`
        SELECT * FROM favorites 
        WHERE user_id = ${userId} AND (type = ${type} OR type = 'general')
        ORDER BY created_at DESC
      ` as Favorite[];
    } else {
      result = await sql`
        SELECT * FROM favorites 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      ` as Favorite[];
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return { success: false, error: "Failed to fetch favorite numbers" };
  }
}

export async function addFavorite(data: {
  userId: string;
  phoneNumber: string;
  name?: string;
  type?: string;
  network?: string;
}) {
  try {
    const { userId, phoneNumber, name, type = 'general', network } = data;
    
    // Check if already exists to provide better feedback
    const existing = await sql`
      SELECT id FROM favorites 
      WHERE user_id = ${userId} AND phone_number = ${phoneNumber}
    ` as any[];

    if (existing.length > 0) {
      return { success: false, error: "This recipient is already in your registry." };
    }

    await sql`
      INSERT INTO favorites (user_id, phone_number, name, type, network)
      VALUES (${userId}, ${phoneNumber}, ${name || null}, ${type}, ${network || null})
    `;
    
    revalidatePath("/dashboard/airtime");
    revalidatePath("/dashboard/data");
    return { success: true };
  } catch (error) {
    console.error("Error adding favorite:", error);
    return { success: false, error: "Failed to save favorite number" };
  }
}

export async function removeFavorite(id: string, userId: string) {
  try {
    const result = await sql`DELETE FROM favorites WHERE id = ${id} AND user_id = ${userId}`;
    revalidatePath("/dashboard/airtime");
    revalidatePath("/dashboard/data");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to remove favorite number" };
  }
}
