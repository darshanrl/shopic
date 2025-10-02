import { createClient } from '@supabase/supabase-js';

// Use ANON key for client-side style uploads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileData } = req.body;
    
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Missing fileName or fileData' });
    }

    // This will only work if your bucket has proper policies
    const { error } = await supabase.storage
      .from('snapverse-files')
      .upload(`receipts/${fileName}`, fileData);

    if (error) {
      return res.status(500).json({ 
        error: 'Upload failed', 
        details: error.message,
        hint: 'Check bucket policies or use service role key'
      });
    }

    res.status(200).json({ success: true, message: 'Upload successful' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}