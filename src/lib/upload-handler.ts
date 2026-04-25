import { createClient } from "@supabase/supabase-js";
import { getSupabaseStorageEnv } from "@/lib/env";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export type UploadSource = "local" | "supabase";

// Error codes for client-side handling
export const UPLOAD_ERRORS = {
  FILE_TOO_LARGE: "UPLOAD_FILE_TOO_LARGE",
  INVALID_TYPE: "UPLOAD_INVALID_TYPE",
  DIMENSION_ERROR: "UPLOAD_DIMENSION_ERROR",
  DURATION_ERROR: "UPLOAD_DURATION_ERROR",
  STORAGE_ERROR: "UPLOAD_STORAGE_ERROR",
  VALIDATION_ERROR: "UPLOAD_VALIDATION_ERROR",
} as const;

export type UploadErrorCode = typeof UPLOAD_ERRORS[keyof typeof UPLOAD_ERRORS];

export class UploadError extends Error {
  code: UploadErrorCode;
  details?: Record<string, unknown>;
  
  constructor(code: UploadErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "UploadError";
    this.code = code;
    this.details = details;
  }
}

export interface UploadResult {
  storagePath: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  source: UploadSource;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: UploadErrorCode;
  details?: Record<string, unknown>;
}

// Size limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB (increased for larger videos)

// Dimension limits
const MIN_IMAGE_DIMENSION = 100;
const MAX_IMAGE_DIMENSION = 4096;
const MAX_VIDEO_DURATION_SECONDS = 120; // 2 minutes

// Accepted types
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4"];
const ACCEPTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const ACCEPTED_VIDEO_EXTENSIONS = ["mp4"];

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

/**
 * Extract image dimensions from a buffer (JPEG, PNG, WebP)
 */
function getImageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === "image/png") {
      // PNG: width at bytes 16-19, height at bytes 20-23
      if (buffer.length >= 24 && buffer.toString("hex", 0, 8) === "89504e470d0a1a0a") {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }
    } else if (mimeType === "image/jpeg") {
      // JPEG: scan for SOF markers
      let offset = 2;
      while (offset < buffer.length - 9) {
        if (buffer[offset] === 0xff) {
          const marker = buffer[offset + 1];
          // SOF0, SOF1, SOF2 markers
          if (marker >= 0xc0 && marker <= 0xc3) {
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            return { width, height };
          }
          // Skip to next marker
          const length = buffer.readUInt16BE(offset + 2);
          offset += 2 + length;
        } else {
          offset++;
        }
      }
    } else if (mimeType === "image/webp") {
      // WebP: check for VP8/VP8L/VP8X
      if (buffer.length >= 30 && buffer.toString("ascii", 0, 4) === "RIFF") {
        const format = buffer.toString("ascii", 12, 16);
        if (format === "VP8 ") {
          // Lossy WebP
          const width = buffer.readUInt16LE(26) & 0x3fff;
          const height = buffer.readUInt16LE(28) & 0x3fff;
          return { width, height };
        } else if (format === "VP8L") {
          // Lossless WebP
          const bits = buffer.readUInt32LE(21);
          const width = (bits & 0x3fff) + 1;
          const height = ((bits >> 14) & 0x3fff) + 1;
          return { width, height };
        } else if (format === "VP8X") {
          // Extended WebP
          const width = (buffer.readUIntLE(24, 3) + 1);
          const height = (buffer.readUIntLE(27, 3) + 1);
          return { width, height };
        }
      }
    }
  } catch (err) {
    console.error("[Upload] Failed to extract image dimensions:", err);
  }
  return null;
}

/**
 * Validate file type, size, and dimensions
 */
export async function validateFile(file: File): Promise<ValidationResult> {
  const mimeType = detectMimeType(file);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");

  // Check file type
  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: "File must be an image or video",
      code: UPLOAD_ERRORS.INVALID_TYPE,
      details: { mimeType, extension: ext },
    };
  }

  // Check file size
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Image size exceeds ${MAX_IMAGE_SIZE / (1024 * 1024)}MB limit`,
      code: UPLOAD_ERRORS.FILE_TOO_LARGE,
      details: { maxSize: MAX_IMAGE_SIZE, actualSize: file.size },
    };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `Video size exceeds ${MAX_VIDEO_SIZE / (1024 * 1024)}MB limit`,
      code: UPLOAD_ERRORS.FILE_TOO_LARGE,
      details: { maxSize: MAX_VIDEO_SIZE, actualSize: file.size },
    };
  }

  // Check file format
  if (isImage && (!ACCEPTED_IMAGE_TYPES.includes(mimeType) || !ACCEPTED_IMAGE_EXTENSIONS.includes(ext))) {
    return {
      valid: false,
      error: `Unsupported image format. Accepted: ${ACCEPTED_IMAGE_EXTENSIONS.join(", ")}`,
      code: UPLOAD_ERRORS.INVALID_TYPE,
      details: { acceptedTypes: ACCEPTED_IMAGE_EXTENSIONS, actualType: ext },
    };
  }

  if (isVideo && (!ACCEPTED_VIDEO_TYPES.includes(mimeType) || !ACCEPTED_VIDEO_EXTENSIONS.includes(ext))) {
    return {
      valid: false,
      error: `Unsupported video format. Accepted: ${ACCEPTED_VIDEO_EXTENSIONS.join(", ")}`,
      code: UPLOAD_ERRORS.INVALID_TYPE,
      details: { acceptedTypes: ACCEPTED_VIDEO_EXTENSIONS, actualType: ext },
    };
  }

  // Validate image dimensions
  if (isImage) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const dimensions = getImageDimensions(buffer, mimeType);
      
      if (dimensions) {
        const { width, height } = dimensions;
        
        if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
          return {
            valid: false,
            error: `Image must be at least ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION} pixels`,
            code: UPLOAD_ERRORS.DIMENSION_ERROR,
            details: { minDimension: MIN_IMAGE_DIMENSION, actualWidth: width, actualHeight: height },
          };
        }
        
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          return {
            valid: false,
            error: `Image must be no larger than ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION} pixels`,
            code: UPLOAD_ERRORS.DIMENSION_ERROR,
            details: { maxDimension: MAX_IMAGE_DIMENSION, actualWidth: width, actualHeight: height },
          };
        }
      }
    } catch (err) {
      console.warn("[Upload] Could not validate image dimensions:", err);
      // Continue without dimension validation if extraction fails
    }
  }

  return { valid: true };
}

/**
 * Get upload constraints for client-side validation
 */
export function getUploadConstraints() {
  return {
    image: {
      maxSize: MAX_IMAGE_SIZE,
      maxSizeMB: MAX_IMAGE_SIZE / (1024 * 1024),
      acceptedTypes: ACCEPTED_IMAGE_TYPES,
      acceptedExtensions: ACCEPTED_IMAGE_EXTENSIONS,
      minDimension: MIN_IMAGE_DIMENSION,
      maxDimension: MAX_IMAGE_DIMENSION,
    },
    video: {
      maxSize: MAX_VIDEO_SIZE,
      maxSizeMB: MAX_VIDEO_SIZE / (1024 * 1024),
      acceptedTypes: ACCEPTED_VIDEO_TYPES,
      acceptedExtensions: ACCEPTED_VIDEO_EXTENSIONS,
      maxDurationSeconds: MAX_VIDEO_DURATION_SECONDS,
    },
  };
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
  const mimeType = detectMimeType(file);
  
  // Extract dimensions for images
  let width: number | undefined;
  let height: number | undefined;
  
  if (mimeType.startsWith("image/")) {
    const dimensions = getImageDimensions(buffer, mimeType);
    if (dimensions) {
      width = dimensions.width;
      height = dimensions.height;
    }
  }

  return {
    storagePath,
    publicUrl,
    fileName: file.name,
    mimeType,
    fileSize: file.size,
    source: "local",
    width,
    height,
  };
}

async function uploadToSupabase(
  file: File,
  sectionKey: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const env = getSupabaseStorageEnv();
  
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new UploadError(
      UPLOAD_ERRORS.STORAGE_ERROR,
      "Supabase storage is not configured. Please check your environment variables."
    );
  }

  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const bucketName = env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";
  const sanitizedFileName = sanitizeFileName(file.name);
  const uniqueFileName = `${uuidv4()}_${sanitizedFileName}`;
  
  // Use a consistent folder structure
  const storagePath = `homepage/${sectionKey}/${uniqueFileName}`;
  const mimeType = detectMimeType(file);

  // Convert File to Buffer for reliable server-side upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Extract dimensions for images
  let width: number | undefined;
  let height: number | undefined;
  
  if (mimeType.startsWith("image/")) {
    const dimensions = getImageDimensions(buffer, mimeType);
    if (dimensions) {
      width = dimensions.width;
      height = dimensions.height;
    }
  }

  // Signal initial progress
  onProgress?.(10);

  const { data, error } = await client.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      upsert: false,
      contentType: mimeType,
      duplex: "half",
    } as Parameters<typeof client.storage.from>[0] extends string ? { upsert?: boolean; contentType?: string; duplex?: string } : never);

  // Signal upload complete
  onProgress?.(90);

  if (error) {
    console.error("[SUPABASE_UPLOAD_ERROR]", error);
    throw new UploadError(
      UPLOAD_ERRORS.STORAGE_ERROR,
      `Upload failed: ${error.message}`,
      { originalError: error.message }
    );
  }

  const { data: publicUrlData } = client.storage
    .from(bucketName)
    .getPublicUrl(storagePath);

  onProgress?.(100);

  return {
    storagePath,
    publicUrl: publicUrlData.publicUrl,
    fileName: file.name,
    mimeType,
    fileSize: file.size,
    source: "supabase",
    width,
    height,
  };
}

export interface UploadOptions {
  source?: UploadSource;
  onProgress?: (progress: number) => void;
  skipValidation?: boolean;
}

export async function uploadMedia(
  file: File,
  sectionKey: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { source = "supabase", onProgress, skipValidation = false } = options;
  
  // Validate file unless explicitly skipped
  if (!skipValidation) {
    const validation = await validateFile(file);
    if (!validation.valid) {
      throw new UploadError(
        validation.code || UPLOAD_ERRORS.VALIDATION_ERROR,
        validation.error || "Validation failed",
        validation.details
      );
    }
  }

  onProgress?.(5);

  if (source === "local") {
    const result = await uploadToLocal(file, sectionKey);
    onProgress?.(100);
    return result;
  }

  return uploadToSupabase(file, sectionKey, onProgress);
}

// Legacy function signature for backward compatibility
export async function uploadMediaLegacy(
  file: File,
  sectionKey: string,
  source: UploadSource = "supabase"
): Promise<UploadResult> {
  return uploadMedia(file, sectionKey, { source });
}
