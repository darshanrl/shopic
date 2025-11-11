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
    const remainingSlots = maxPhotos - selectedFiles.length;
    
    if (files.length > remainingSlots) {
      setError(`You can only upload ${maxPhotos} photos in total. ${files.length - remainingSlots} photo(s) will not be added.`);
      // Only add up to the max allowed
      const filesToAdd = files.slice(0, remainingSlots);
      setSelectedFiles(prev => [...prev, ...filesToAdd]);
      // Reset the file input to allow selecting the same file again if needed
      e.target.value = null;
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...files]);
    // Reset the file input to allow selecting the same file again if needed
    e.target.value = null;
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
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Your Photo(s) *
            <span className="text-xs text-gray-500 ml-2">
              ({selectedFiles.length}/{maxPhotos} selected)
            </span>
          </label>
          
          {contest && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Contest Rules:</strong> You can upload up to {maxPhotos} photo(s).
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {contest.allow_camera_uploads && contest.allow_gallery_uploads ? (
                  'You can upload photos from both camera and gallery.'
                ) : contest.allow_camera_uploads ? (
                  'Only camera uploads are allowed for this contest.'
                ) : (
                  'Only gallery uploads are allowed for this contest.'
                )}
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-center w-full">
            <label 
              className={`flex flex-col w-full h-32 border-2 border-dashed rounded-lg transition-colors ${
                selectedFiles.length >= maxPhotos 
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-7">
                {selectedFiles.length >= maxPhotos ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-gray-400 group-hover:text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                )}
                <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-blue-600">
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} file(s) selected`
                    : 'Click to select or drag and drop'}
                </p>
                <p className={`text-xs ${
                  selectedFiles.length >= maxPhotos ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {selectedFiles.length >= maxPhotos
                    ? 'Maximum number of photos reached'
                    : `Up to ${maxPhotos} photos allowed (${maxPhotos - selectedFiles.length} remaining)`}
                </p>
              </div>
              <input
                type="file"
                className="opacity-0 absolute"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={selectedFiles.length >= maxPhotos}
                title={selectedFiles.length >= maxPhotos ? 'Maximum number of photos reached' : 'Select photos'}
              />
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Photos:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      aria-label="Remove image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Remove all photos
                </button>
              </div>
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