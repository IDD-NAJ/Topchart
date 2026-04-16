import { createClient } from "@supabase/supabase-js";
import { getSupabaseStorageEnv } from "@/lib/env";

export type HomepageMediaAssetType = "image" | "video";

function getStorageClient() {
  const env = getSupabaseStorageEnv();
  const bucketName = env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || "homepage-media";
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return { client, bucketName };
}

export async function uploadHomepageMedia(params: {
  file: File;
  sectionKey: string;
  assetType: HomepageMediaAssetType;
}) {
  const { client, bucketName } = getStorageClient();
  const safeName = params.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const extension = safeName.includes(".") ? safeName.split(".").pop() : "";
  const objectPath = `homepage/${params.sectionKey}/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;

  const uploadResult = await client.storage.from(bucketName).upload(objectPath, params.file, {
    upsert: false,
    contentType: params.file.type || (params.assetType === "video" ? "video/mp4" : "image/jpeg"),
  });

  if (uploadResult.error) {
    throw new Error(`Storage upload failed: ${uploadResult.error.message}`);
  }

  const publicResult = client.storage.from(bucketName).getPublicUrl(objectPath);
  return {
    storagePath: objectPath,
    publicUrl: publicResult.data.publicUrl,
    bucketName,
  };
}

export async function deleteHomepageMediaObject(storagePath: string) {
  const { client, bucketName } = getStorageClient();
  const removeResult = await client.storage.from(bucketName).remove([storagePath]);
  if (removeResult.error) {
    throw new Error(`Storage delete failed: ${removeResult.error.message}`);
  }
}
