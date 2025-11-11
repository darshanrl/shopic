import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Contest } from '@/entities/Contest';
import { Camera, Image as ImageIcon } from 'lucide-react';

export default function ContestSubmissionForm({ contestId, contestName = 'Bike Bake', entryFee = 85 }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [photoSource, setPhotoSource] = useState('gallery');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [maxPhotos, setMaxPhotos] = useState(1);
  const [contest, setContest] = useState(null);

  useEffect(() => {
    const fetchContest = async () => {
      if (contestId) {
        try {
          const data = await Contest.getById(contestId);
          setContest(data);
          setMaxPhotos(data.max_photos_per_entry || 1);
          
          // Set default photo source based on allowed sources
          if (data.allow_camera_uploads) {
            setPhotoSource('camera');
          } else if (data.allow_gallery_uploads) {
            setPhotoSource('gallery');
          }
        } catch (err) {
          console.error('Error fetching contest:', err);
          setError('Failed to load contest details');
        }
      }
    };

    fetchContest();
  }, [contestId]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > maxPhotos) {
      setError(`You can upload a maximum of ${maxPhotos} photos`);
      return;
    }
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData(event.target);
    const userName = formData.get('userName');
    const userEmail = formData.get('userEmail');
    
    // Validation
    if (!userName || !userEmail) {
      setError('Please fill in your name and email');
      setSubmitting(false);
      return;
    }
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one photo');
      setSubmitting(false);
      return;
    }

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `entries/${fileName}`;

        // Upload to Supabase
        const { error: uploadError } = await supabase.storage
          .from('snapverse-files')
          .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('snapverse-files')
          .getPublicUrl(filePath);

        // Create entry record
        const { data: entry, error: entryError } = await supabase
          .from('entries')
          .insert([{
            contest_id: contestId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            user_name: userName,
            user_email: userEmail,
            photo_url: publicUrl,
            photo_source: photoSource,
            status: 'pending',
            payment_status: 'pending',
            payment_amount: entryFee,
            payment_currency: 'USD'
          }])
          .select()
          .single();

        if (entryError) throw entryError;
        return entry;
      });

      const entries = await Promise.all(uploadPromises);

      if (entries.length === 0) {
        throw new Error('No entries were created');
      }

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
      setSelectedFiles([]);
      event.target.reset();
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              id="userName"
              name="userName"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              id="userEmail"
              name="userEmail"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {contest && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo Source
            </label>
            <div className="flex space-x-4">
              {contest.allow_camera_uploads && (
                <button
                  type="button"
                  onClick={() => setPhotoSource('camera')}
                  className={`flex-1 py-2 px-4 rounded-md border ${
                    photoSource === 'camera'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <Camera className="w-5 h-5 mx-auto mb-1" />
                  <span>Take Photo</span>
                </button>
              )}
              {contest.allow_gallery_uploads && (
                <button
                  type="button"
                  onClick={() => setPhotoSource('gallery')}
                  className={`flex-1 py-2 px-4 rounded-md border ${
                    photoSource === 'gallery'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <ImageIcon className="w-5 h-5 mx-auto mb-1" />
                  <span>Choose from Gallery</span>
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {selectedFiles.length} of {maxPhotos} photos selected
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {photoSource === 'camera' ? 'Take Photo' : 'Upload Photos'} *
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <div className="flex text-sm text-gray-600 justify-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                >
                  <span>Upload files</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    multiple
                    capture={photoSource === 'camera' ? 'environment' : null}
                    onChange={handleFileChange}
                    disabled={selectedFiles.length >= maxPhotos}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {selectedFiles.length >= maxPhotos 
                  ? `Maximum ${maxPhotos} photo${maxPhotos > 1 ? 's' : ''} reached`
                  : `PNG, JPG, GIF up to ${maxPhotos} photo${maxPhotos > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="h-32 w-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
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