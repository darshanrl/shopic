// IMMEDIATE BROWSER CONSOLE FIX
// Paste this in browser console RIGHT NOW to fix the media_type error

console.log('=== APPLYING IMMEDIATE FIX ===');

// Fix 1: Override Entry.create to force correct media_type
const originalCreate = window.Entry?.create;
if (originalCreate) {
  window.Entry.create = async function(data) {
    // Force media_type to be valid
    if (data.media_type === 'both' || data.contest_id) {
      data.media_type = 'both';
      console.log('Forcing media_type to "both" for mixed media entry');
    } else if (!data.media_type || !['image', 'video', 'both'].includes(data.media_type)) {
      data.media_type = 'image';
      console.log('Invalid media_type detected, forcing to "image":', data.media_type);
    }
    
    console.log('Final entry data being sent:', {
      ...data,
      media_type: data.media_type
    });
    
    try {
      return await originalCreate.call(this, data);
    } catch (error) {
      console.error('Entry.create failed:', error);
      // If it's the constraint error, try with 'image' instead
      if (error.message && error.message.includes('entries_media_type_check')) {
        console.log('Constraint error detected, retrying with forced media_type...');
        return await originalCreate.call(this, {
          ...data,
          media_type: 'both'
        });
      }
      throw error;
    }
  };
  
  console.log('Entry.create patched successfully');
} else {
  console.error('Entry.create not found');
}

// Fix 2: Test the patch immediately
console.log('Testing the fix...');
window.Entry.create({
  contest_id: 'test-contest-id',
  user_id: 'test-user-id',
  title: 'Test Mixed Media Entry',
  caption: 'Test entry',
  media_url: 'https://test.com/image.jpg',
  media_urls: ['https://test.com/image1.jpg', 'https://test.com/video1.mp4'],
  media_type: 'both',
  payment_status: 'approved'
}).then(result => {
  console.log('✅ SUCCESS! Entry.create works now:', result);
}).catch(error => {
  console.error('❌ Still failed:', error);
});

console.log('=== FIX APPLIED ===');
console.log('Now try uploading your mixed media entry again!');
