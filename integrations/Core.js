import { supabase } from '@/lib/supabase'
import { generateUniqueFilename } from '@src/utils/fileUtils';

export async function UploadFile({ file, category = 'uploads', filename }) {
  if (!file) throw new Error('No file provided')
  
  // Generate a safe filename
  const fileExt = file.name.split('.').pop().toLowerCase()
  const safeFileName = filename || `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
  const filePath = `${category}/${safeFileName}`
  
  try {
    // Handle both File objects and file paths
    let fileToUpload = file;
    if (typeof file === 'string') {
      const fileContent = await fs.promises.readFile(file);
      fileToUpload = new File([fileContent], safeFileName, {
        type: file.headers?.['content-type'] || 'application/octet-stream',
        lastModified: Date.now()
      });
    }
    
    const { error } = await supabase.storage
      .from('snapverse-files')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
        contentType: fileToUpload.type || 'application/octet-stream'
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      if (error.message.includes('Bucket not found')) {
        throw new Error('Storage bucket not found. Please contact admin to set up file storage.');
      }
      throw error;
    }
    
    // Get public URL via SDK (avoids relying on process.env on client)
    const { data: { publicUrl } } = supabase.storage
      .from('snapverse-files')
      .getPublicUrl(filePath);
    
    return { 
      file_url: publicUrl,
      public_url: publicUrl,
      file_name: safeFileName,
      file_path: filePath
    }
  } catch (error) {
    console.error('Error in UploadFile:', error);
    throw new Error(`Failed to upload file: ${error?.message || 'Unknown error'}`);
  }
}

// Function to handle file uploads for receipts and payment screenshots
export async function UploadReceipt({ file, userId, contestId, userName = 'user', contestTitle = 'contest', entryFee = '0', type = 'receipt' }) {
  console.log('Starting UploadReceipt with:', { type, fileName: file?.name, userId, contestId });
  
  if (!file) throw new Error('No file provided');
  if (!userId) throw new Error('User ID is required');
  
  // Sanitize inputs and create a safe file name
  const fileExt = file.name.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const safeName = String(userName || 'user').replace(/[^a-zA-Z0-9]/g, '_');
  const safeContestTitle = String(contestTitle || 'contest').replace(/[^a-zA-Z0-9]/g, '_');
  const safeEntryFee = String(entryFee || '0').replace(/[^0-9.]/g, '');
  const fileName = `${type === 'receipt' ? 'receipt' : 'payment'}-${userId}-${timestamp}.${fileExt}`.toLowerCase();
  const folder = type === 'receipt' ? 'receipts' : 'payments';
  const filePath = `${folder}/${fileName}`;
  
  try {
    console.log('Uploading file to storage:', { bucket: 'snapverse-files', filePath });
    
    // 1. Upload the file to storage
    const { error: uploadError } = await supabase.storage
      .from('snapverse-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('snapverse-files')
      .getPublicUrl(filePath);

    // 3. If this is a receipt and contestId is provided, save to receipts table
    if (type === 'receipt' && contestId) {
      console.log('Saving receipt to database...');
      const receiptData = {
        user_id: userId,
        contest_id: contestId,
        receipt_url: publicUrl,
        uploaded_at: new Date().toISOString(),
        file_name: fileName,
        file_path: filePath,
        entry_fee: parseFloat(safeEntryFee) || 0,
        status: 'pending_review',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: receipt, error: dbError } = await supabase
        .from('receipts')
        .insert([receiptData])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Don't throw error, we still want to return the file info
      } else {
        console.log('Receipt saved to database:', receipt);
      }
    }

    return {
      file_url: publicUrl,
      file_name: fileName,
      file_path: filePath,
      public_url: publicUrl,
      success: true,
      entry_fee: parseFloat(safeEntryFee) || 0,
      status: 'pending_review'
    };

  } catch (error) {
    console.error('Error in UploadReceipt:', error);
    // Clean up the uploaded file if there was an error
    try {
      await supabase.storage.from('snapverse-files').remove([filePath]);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }
    throw error;
  }
}
