import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ← This was missing!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data without multiparty (simpler approach)
    const formData = await new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });

    // Simple approach - just handle the file name issue first
    const generateSafeFileName = () => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      return `receipt_${timestamp}_${randomString}.jpg`;
    };

    const fileName = generateSafeFileName();
    const filePath = `receipts/${fileName}`;

    console.log('Attempting upload with file path:', filePath);

    // Test upload with a simple text file first
    const testContent = 'test file content';
    
    const { error: uploadError } = await supabase.storage
      .from('snapverse-files')
      .upload(filePath, testContent, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // Specific error handling
      if (uploadError.message.includes('Invalid JWT')) {
        return res.status(500).json({ 
          error: 'Authentication error: Check your Supabase service role key',
          details: 'Make sure SUPABASE_SERVICE_ROLE_KEY is set correctly in Vercel'
        });
      }
      
      if (uploadError.message.includes('Bucket')) {
        return res.status(500).json({ 
          error: 'Storage bucket error',
          details: 'Bucket "snapverse-files" might not exist or have correct permissions'
        });
      }
      
      return res.status(500).json({ 
        error: 'Upload failed',
        details: uploadError.message
      });
    }

    // If we get here, the upload worked!
    const { data: { publicUrl } } = supabase.storage
      .from('snapverse-files')
      .getPublicUrl(filePath);

    // Clean up the test file
    await supabase.storage.from('snapverse-files').remove([filePath]);

    res.status(200).json({ 
      success: true, 
      message: 'Storage test successful!',
      testUrl: publicUrl
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
}