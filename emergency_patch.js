// Emergency Fix for Mixed Media Upload Issues
// Add this to browser console to patch the issue immediately

// Patch 1: Fix media_type constraint violation
window.fixEntryCreate = function(originalEntryCreate) {
  return async function(data) {
    // Ensure media_type is always valid
    if (data.media_type && !['image', 'video', 'both'].includes(data.media_type)) {
      console.warn('Invalid media_type detected, fixing:', data.media_type);
      data.media_type = data.media_type === 'both' ? 'both' : 'image';
    }
    
    console.log('Fixed entry data:', data);
    return await originalEntryCreate(data);
  };
};

// Patch 2: Force Supabase upload for videos
window.forceSupabaseUpload = function() {
  // Override Vercel Blob to use Supabase only
  if (window.uploadToVercelBlob) {
    const originalUpload = window.uploadToVercelBlob;
    window.uploadToVercelBlob = async function(file, meta) {
      console.log('Forcing Supabase upload for video:', file.name);
      return await window.UploadFile({ file });
    };
    console.log('Vercel Blob disabled, using Supabase only');
  }
};

// Patch 3: Debug photo accumulation
window.debugPhotoUpload = function() {
  let photoCount = 0;
  
  // Override file input change handler to accumulate photos
  document.addEventListener('change', function(e) {
    if (e.target && e.target.type === 'file' && e.target.accept && e.target.accept.includes('image')) {
      const files = Array.from(e.target.files || []);
      console.log('Photo upload detected:', files.length, 'files');
      
      // Get current photos from entryForm
      const currentPhotos = window.entryForm?.mixed_media?.images || [];
      const newPhotos = [...currentPhotos, ...files];
      
      console.log('Current photos:', currentPhotos.length);
      console.log('New photos:', newPhotos.length);
      console.log('All photos:', newPhotos.map(f => f.name));
      
      // Update the form
      if (window.setEntryForm) {
        window.setEntryForm(prev => ({
          ...prev,
          mixed_media: { ...prev.mixed_media, images: newPhotos }
        }));
      }
      
      photoCount = newPhotos.length;
    }
  });
  
  return photoCount;
};

// Apply patches immediately
console.log('=== APPLYING EMERGENCY FIXES ===');

// Fix 1: Patch Entry.create
if (window.Entry && window.Entry.create) {
  window.Entry.create = window.fixEntryCreate(window.Entry.create);
  console.log('Entry.create patched');
}

// Fix 2: Force Supabase
window.forceSupabaseUpload();

// Fix 3: Debug photo upload
const photoCount = window.debugPhotoUpload();
console.log('Emergency fixes applied. Photo count:', photoCount);
console.log('====================================');

// Test the fixes
console.log('Testing Entry.create with mixed media...');
window.Entry.create({
  contest_id: 'test-contest-id',
  user_id: 'test-user-id', 
  title: 'Test Entry',
  media_url: 'https://test.com/image1.jpg',
  media_urls: ['https://test.com/image1.jpg', 'https://test.com/video1.mp4'],
  media_type: 'both',
  payment_status: 'approved'
}).then(result => {
  console.log('✅ Entry.create test passed:', result);
}).catch(error => {
  console.error('❌ Entry.create test failed:', error);
});
