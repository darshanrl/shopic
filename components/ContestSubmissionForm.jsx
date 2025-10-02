import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ContestSubmissionForm({ contestName = 'Bike Bake', entryFee = 85 }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData(event.target);
    const file = formData.get('receipt');
    const userName = formData.get('userName');
    const userEmail = formData.get('userEmail');
    
    // Validation
    if (!userName || !userEmail) {
      setError('Please fill in your name and email');
      setSubmitting(false);
      return;
    }
    
    if (!file) {
      setError('Please select a receipt file');
      setSubmitting(false);
      return;
    }

    try {
      console.log('=== USING SIMPLE FILENAME ===');
      
      // SIMPLE FILENAME - NO SPECIAL CHARACTERS
      const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
      const filePath = `receipts/${fileName}`;

      console.log('Uploading with filename:', fileName);

      // Upload to Supabase (uses global client configured via VITE_ envs)
      const { error: uploadError } = await supabase.storage
        .from('snapverse-files')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('snapverse-files')
        .getPublicUrl(filePath);

      // Save to database (optional)
      try {
        const { error: dbError } = await supabase
          .from('entries')
          .insert([{
            user_name: userName,
            user_email: userEmail,
            contest_name: contestName,
            entry_fee: entryFee,
            receipt_url: publicUrl,
            receipt_file_name: fileName,
            status: 'pending_review',
            submitted_at: new Date().toISOString()
          }]);

        if (dbError) {
          console.warn('Database warning:', dbError);
        }
      } catch (dbError) {
        console.warn('Database error:', dbError);
      }

      setSuccess(true);
      event.target.reset();
      console.log('✅ SUCCESS with simple filename');

    } catch (error) {
      setError('Upload failed: ' + (error?.message || 'Unknown error'));
      console.error('Entry submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h3 className="text-xl font-semibold mb-2">Entry Submitted Successfully!</h3>
        <p className="text-gray-600 mb-4">Admin will verify your receipt within 24 hours.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Submit Another Entry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Join Contest: {contestName}</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="userName"
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            name="userEmail"
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Payment Receipt *
          </label>
          <input
            type="file"
            name="receipt"
            accept="image/*"
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Clear screenshot showing transaction ID and amount (₹{entryFee})
          </p>
        </div>
        
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit for Approval'}
        </button>
      </form>
    </div>
  );
}