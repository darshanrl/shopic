# Vercel Blob Setup Guide

## Issue: 405 Method Not Allowed Error

The error `POST /api/blob/generate-upload-url net::ERR_ABORTED 405 (Method Not Allowed)` indicates that Vercel Blob is not properly configured.

## Solution 1: Configure Vercel Blob (Recommended)

1. **Install Vercel Blob** (if not already installed):
   ```bash
   npm install @vercel/blob
   ```

2. **Set up environment variables in Vercel Dashboard**:
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add: `BLOB_READ_WRITE_TOKEN` (get from Vercel Blob dashboard)

3. **Create Vercel Blob store**:
   - Go to https://vercel.com/dashboard/stores
   - Create new Blob store
   - Copy the read/write token

4. **Deploy again** after setting environment variables

## Solution 2: Use Supabase Storage (Fallback)

The code now includes automatic fallback to Supabase storage if Vercel Blob fails.

## Solution 3: Disable Vercel Blob temporarily

If you want to use only Supabase storage:

```javascript
// In uploadToVercelBlob function, replace with:
async function uploadToVercelBlob(file, meta = {}) {
  // Always use Supabase storage
  return await UploadFile({ file });
}
```

## Testing

After configuration, test with:
1. Mixed media contest upload
2. Check browser console for any errors
3. Verify files are uploaded successfully

## Current Status

The app will now automatically fall back to Supabase storage if Vercel Blob fails, so uploads should work even without Blob configuration.
