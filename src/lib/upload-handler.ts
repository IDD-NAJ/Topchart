import { createClient } from "@supabase/supabase-js";
import { getSupabaseStorageEnv } from "@/lib/env";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export type UploadSource = "local" | "supabase";

export interface UploadResult {
  storagePath: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  source: UploadSource;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function detectMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "video/ogg",
  };
  return mimeMap[ext] || "application/octet-stream";
}

function validateFile(file: File): { valid: boolean; error?: string } {
  const mimeType = detectMimeType(file);
  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");

  if (!isImage && !isVideo) {
    return { valid: false, error: "File must be an image or video" };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Image size exceeds 5MB limit" };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: "Video size exceeds 50MB limit" };
  }

  if (isImage && !ACCEPTED_IMAGE_TYPES.includes(mimeType)) {
    return { valid: false, error: "Unsupported image format" };
  }

  if (isVideo && !ACCEPTED_VIDEO_TYPES.includes(mimeType)) {
    return { valid: false, error: "Unsupported video format" };
  }

  return { valid: true };
}

async function uploadToLocal(
  file: File,
  sectionKey: string
): Promise<UploadResult> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "homepage-media", sectionKey);
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const sanitizedFileName = sanitizeFileName(file.name);
  const uniqueFileName = `${uuidv4()}_${sanitizedFileName}`;
  const filePath = path.join(uploadsDir, uniqueFileName);
  
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const storagePath = `/uploads/homepage-media/${sectionKey}/${uniqueFileName}`;
  const publicUrl = storagePath;

  return {
    storagePath,
    publicUrl,
    fileName: file.name,
    mimeType: detectMimeType(file),
    fileSize: file.size,
    source: "local",
  };
}

async function uploadToSupabase(
  file: File,
  sectionKey: string
): Promise<UploadResult> {
  const env = getSupabaseStorageEnv();
  
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase not configured");
  }

  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const bucketName = env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";
  const sanitizedFileName = sanitizeFileName(file.name);
  const uniqueFileName = `${uuidv4()}_${sanitizedFileName}`;
  const storagePath = `${sectionKey}/${uniqueFileName}`;

  const { data, error } = await client.storage
    .from(bucketName)
    .upload(storagePath, file, {
      upsert: false,
      contentType: detectMimeType(file),
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = client.storage
    .from(bucketName)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: publicUrlData.publicUrl,
    fileName: file.name,
    mimeType: detectMimeType(file),
    fileSize: file.size,
    source: "supabase",
  };
}

export async function uploadMedia(
  file: File,
  sectionKey: string,
  source: UploadSource = "supabase"
): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (source === "local") {
    return uploadToLocal(file, sectionKey);
  }

  return uploadToSupabase(file, sectionKey);
}
