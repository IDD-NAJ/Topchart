"use server";

import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/actions/auth";
import bcrypt from "bcryptjs";

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const { firstName, lastName, phone } = data;

  if (phone) {
    const phoneRegex = /^0[2-5][0-9]\d{7}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error("Please enter a valid ian phone number");
    }
  }

  if (!firstName && !lastName && !phone) return { success: true };

  await sql`
    UPDATE users
    SET first_name = ${firstName || user.first_name},
        last_name = ${lastName || user.last_name},
        phone = ${phone || user.phone}
    WHERE id = ${user.id}
  `;

  return { success: true };
}

export async function updatePassword(data: {
  currentPassword?: string;
  newPassword?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { currentPassword, newPassword } = data;
  if (!currentPassword || !newPassword) {
    return { success: false, error: "Current and new passwords are required" };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters" };
  }

  const result = await sql`
    SELECT password_hash FROM users WHERE id = ${user.id}
  `;
  if (result.length === 0) return { success: false, error: "User not found" };

  const isValid = await bcrypt.compare(currentPassword, result[0].password_hash);
  if (!isValid) return { success: false, error: "Incorrect current password" };

  const newHash = await bcrypt.hash(newPassword, 10);

  await sql`
    UPDATE users
    SET password_hash = ${newHash}
    WHERE id = ${user.id}
  `;

  return { success: true };
}
