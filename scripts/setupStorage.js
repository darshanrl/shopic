// @ts-check
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  }
);

async function setupStorage() {
  try {
    console.log('Checking for existing buckets...');
    
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    console.log('Existing buckets:', buckets);
    
    // Check if our bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === 'snapverse-files');
    
    if (bucketExists) {
      console.log('Bucket already exists');
      return;
    }
    
    // Create the bucket if it doesn't exist
    console.log('Creating snapverse-files bucket...');
    const { data: bucket, error: createError } = await supabase.storage.createBucket('snapverse-files', {
      public: true,
      allowedMimeTypes: ['image/*', 'application/pdf'],
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      return;
    }
    
    console.log('Bucket created successfully:', bucket);
    
  } catch (error) {
    console.error('Error in setupStorage:', error);
  }
}

setupStorage();
