// @ts-check
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

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
    
    // Create the required folders
    const folders = ['receipts', 'payments', 'submissions'];
    
    for (const folder of folders) {
      console.log(`Creating folder: ${folder}`);
      const { error: uploadError } = await supabase.storage
        .from('snapverse-files')
        .upload(`${folder}/.keep`, new Uint8Array());
      
      if (uploadError && !uploadError.message.includes('already exists')) {
        console.error(`Error creating folder ${folder}:`, uploadError);
      }
    }
    
    console.log('Storage setup completed successfully!');
    
  } catch (error) {
    console.error('Error in setupStorage:', error);
  }
}

setupStorage();
