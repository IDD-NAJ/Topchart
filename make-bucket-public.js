// Script to make Supabase Storage bucket public
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function makeBucketPublic() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.SUPABASE_BUCKET_HOMEPAGE_MEDIA || 'homepage-media';

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  console.log(`🔧 Configuring bucket: ${bucketName}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    // List current buckets
    const { data: buckets, error: listError } = await client.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      process.exit(1);
    }

    const existingBucket = buckets?.find(b => b.name === bucketName);

    if (!existingBucket) {
      console.log(`⚠️ Bucket "${bucketName}" does not exist. Creating...`);
      
      const { data: newBucket, error: createError } = await client.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
        fileSizeLimit: 104857600, // 100MB
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        process.exit(1);
      }

      console.log('✅ Bucket created successfully with public access');
    } else {
      console.log(`ℹ️ Bucket "${bucketName}" exists (public: ${existingBucket.public})`);
      
      if (!existingBucket.public) {
        console.log('🔓 Making bucket public...');
        
        // Update bucket to be public
        const { error: updateError } = await client.storage.updateBucket(bucketName, {
          public: true,
        });

        if (updateError) {
          console.error('❌ Error making bucket public:', updateError.message);
          console.log('\n⚠️ Please make the bucket public manually:');
          console.log(`1. Go to https://app.supabase.com/project/_/storage/buckets`);
          console.log(`2. Click on "${bucketName}"`);
          console.log('3. Toggle "Public bucket" to ON');
          process.exit(1);
        }

        console.log('✅ Bucket is now public');
      } else {
        console.log('✅ Bucket is already public');
      }
    }

    // Test public URL generation
    const testPath = 'test.txt';
    const { data: urlData } = client.storage.from(bucketName).getPublicUrl(testPath);
    console.log('\n📎 Sample public URL format:');
    console.log(urlData.publicUrl);
    console.log('\n✅ Bucket configuration complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

makeBucketPublic();
