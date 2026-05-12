import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKETS = [
  {
    name: 'homepage-media',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
    fileSizeLimit: 104857600, // 100MB
  },
];

export async function setupStorageBuckets() {
  console.log('Setting up Supabase storage buckets...\n');

  for (const bucketConfig of BUCKETS) {
    try {
      // Check if bucket exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        continue;
      }

      const bucketExists = existingBuckets?.some(b => b.name === bucketConfig.name);

      if (bucketExists) {
        console.log(`✓ Bucket "${bucketConfig.name}" already exists`);
      } else {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(bucketConfig.name, {
          public: bucketConfig.public,
          allowedMimeTypes: bucketConfig.allowedMimeTypes,
          fileSizeLimit: bucketConfig.fileSizeLimit,
        });

        if (error) {
          console.error(`✗ Failed to create bucket "${bucketConfig.name}":`, error.message);
          continue;
        }

        console.log(`✓ Created bucket "${bucketConfig.name}"`);
      }

      // Verify bucket is publicly accessible
      const { data: publicUrlData } = supabase.storage.from(bucketConfig.name).getPublicUrl('test');
      
      if (publicUrlData?.publicUrl) {
        console.log(`✓ Bucket "${bucketConfig.name}" is publicly accessible`);
      }

    } catch (error) {
      console.error(`✗ Error setting up bucket "${bucketConfig.name}":`, error);
    }
  }

  console.log('\n✓ Storage setup complete!');
}

// Run if called directly
if (require.main === module) {
  setupStorageBuckets().catch(console.error);
}
