import React, { useState, useEffect } from "react";
import { Contest } from "@/entities/Contest";
import { Entry } from "@/entities/Entry";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification"; // Added Notification import
import { UploadFile } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  Calendar,
  Users,
  Clock,
  Upload,
  Image as ImageIcon,
  Video,
  CreditCard,
  CheckCircle,
  Camera as CameraIcon,
  AlertCircle,
  X,
} from "lucide-react";

import { format } from "date-fns";
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function Contests() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  /* --- State Variables --- */
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myEntries, setMyEntries] = useState([]);
  const [adminEntries, setAdminEntries] = useState([]); // Added for Admin
  const [selectedContest, setSelectedContest] = useState(null);

  // Progress State
  const [uploadStats, setUploadStats] = useState({ loaded: 0, total: 0 });


  const [paymentStep, setPaymentStep] = useState('details');
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [user, setUser] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);



  const [entryForm, setEntryForm] = useState({
    title: '',
    caption: '',
    media_type: 'image',
    file: null, // used for video uploads
    images: [], // used for multi-image uploads
    payment_screenshot: null, // Added payment_screenshot
    existing_media: [], // For editing: stores { url, type }
    // For mixed media contests
    mixed_media: {
      images: [], // Support multiple photos
      video: null
    }

  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  // Expose state for debugging
  useEffect(() => {
    window.entryForm = entryForm;
    window.selectedContest = selectedContest;

    // Debug logging for mixed media
    if (selectedContest?.media_type === 'both') {
      console.log('=== MIXED MEDIA DEBUG ===');
      console.log('selectedContest:', selectedContest);
      console.log('entryForm.mixed_media:', entryForm.mixed_media);
      console.log('images count:', entryForm.mixed_media?.images?.length || 0);
      console.log('videos count:', entryForm.mixed_media?.videos?.length || 0);
      console.log('required_photos:', selectedContest.required_photos);
      console.log('required_videos:', selectedContest.required_videos);
      console.log('max_photos_allowed:', selectedContest.max_photos_allowed);
      console.log('max_videos_allowed:', selectedContest.max_videos_allowed);
      console.log('========================');
    }
  }, [entryForm, selectedContest]);

  // Open join dialog when URL has ?join=<contestId>
  useEffect(() => {
    if (!loading && contests?.length) {
      const params = new URLSearchParams(location.search);
      const joinId = params.get('join');
      if (joinId) {
        const contest = contests.find(c => c.id === joinId);
        if (contest) handleJoinContest(contest);
      }

      const editEntryId = params.get('editEntry');
      if (editEntryId) {
        // Find the entry in myEntries
        // Note: myEntries might not be loaded yet if we just derived it from entries? 
        // Actually loadData fetches entries.
        if (myEntries.length > 0) {
          const entry = myEntries.find(e => e.id === editEntryId);
          if (entry) {
            handleUploadEntry(entry);
            // clear param to avoid re-opening
            params.delete('editEntry');
            navigate({ search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
          }
        }
      }
    }
  }, [loading, contests, myEntries, location.search]);

  const loadData = async () => {
    try {
      const [contestsData, userData] = await Promise.all([
        Contest.list('-created_date'),
        User.me()
      ]);

      setContests(contestsData);
      setUser(userData);

      // Debug: expose user to window and log admin status
      window.user = userData;
      console.log('User loaded:', { email: userData?.email, is_admin: userData?.is_admin });

      if (userData) {
        const entries = await Entry.filter({ user_id: userData.id });
        setMyEntries(entries);

        // Load Admin Entries if user is admin
        if (userData.is_admin) {
          const pending = await Entry.filter({ payment_status: 'paid_waiting_approval' });
          setAdminEntries(pending);
        }
      }
    } catch (error) {
      console.error('Error loading contests:', error);
    }
    setLoading(false);
  };

  const getContestStatus = (contest) => {
    const now = new Date();
    const start = new Date(contest.start_date);
    const end = new Date(contest.end_date);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'ongoing';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ongoing': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completed': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  const isAdmin = () => Boolean(user?.is_admin);

  const handleEditContest = async (contest) => {
    try {
      if (!isAdmin()) return;
      const newTitle = window.prompt('Edit contest title:', contest.title || '');
      if (newTitle === null) return;
      const newDescription = window.prompt('Edit description:', contest.description || '');
      if (newDescription === null) return;
      const newEntryFeeStr = window.prompt('Edit entry fee:', String(contest.entry_fee ?? 0));
      if (newEntryFeeStr === null) return;
      const newPrizePoolStr = window.prompt('Edit prize pool:', String(contest.prize_pool ?? 0));
      if (newPrizePoolStr === null) return;
      const newMaxPhotosStr = window.prompt('Max photos per entry:', String(contest.max_photos_per_entry ?? 1));
      if (newMaxPhotosStr === null) return;

      const updates = {
        title: newTitle,
        description: newDescription,
        entry_fee: Number(newEntryFeeStr) || 0,
        prize_pool: Number(newPrizePoolStr) || 0,
        max_photos_per_entry: Math.max(1, Number(newMaxPhotosStr) || 1),
        updated_at: new Date().toISOString()
      };

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/contests/${contest.id}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update contest');
      }

      await loadData();
      alert('Contest updated.');
    } catch (e) {
      console.error('Edit contest failed:', e);
      alert(e?.message || 'Failed to update contest');
    }
  };

  const handleDeleteContest = async (contest) => {
    try {
      if (!isAdmin()) return;
      if (!window.confirm('Delete this contest? This will remove all its entries.')) return;

      console.log('Attempting to delete contest:', contest.id);

      await Contest.delete(contest.id);

      console.log('Contest deleted successfully');

      // Force refresh contests list
      console.log('Reloading data...');
      await loadData();

      alert('Contest deleted.');
    } catch (e) {
      console.error('Delete contest failed:', e);
      alert(e?.message || 'Failed to delete contest');
    }
  };

  const filterContests = (status) => {
    if (status === 'my') {
      return contests.filter(contest =>
        myEntries.some(entry => entry.contest_id === contest.id)
      );
    }
    return contests.filter(contest => getContestStatus(contest) === status);
  };

  const handleJoinContest = (contest) => {
    if (!user) {
      User.login();
      return;
    }

    if (contest.created_by === user.id) {
      alert("You cannot join your own contest.");
      return;
    }

    console.log('handleJoinContest called with:', contest);
    setSelectedContest(contest);
    setJoinDialogOpen(true);
    setPaymentStep('details'); // Set step to 'details' when opening dialog
    resetEntryForm();
  };


  const resetEntryForm = () => {
    const newForm = {
      title: '',
      caption: '',
      media_type: 'image',
      file: null,
      images: [],
      payment_screenshot: null,
      mixed_media: {
        images: [], // Support multiple photos
        videos: [] // Support multiple videos
      }
    };
    console.log('resetEntryForm setting:', newForm);
    setEntryForm(newForm);
    setImagePreviews([]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (entryForm.media_type === 'video') {
      const file = files[0];
      if (file) {
        imagePreviews.forEach((url) => URL.revokeObjectURL(url));
        setImagePreviews([]);
        setEntryForm(prev => ({ ...prev, file, images: [] }));
      }
      return;
    }
    const limit = Number(selectedContest?.max_photos_per_entry || 1);

    // Build a unique list combining already selected images + new ones, up to limit
    const existing = entryForm.images || [];
    const uniqueKey = (f) => `${f.name}_${f.lastModified}_${f.size}`;
    const existingKeys = new Set(existing.map(uniqueKey));

    const toAdd = [];
    for (const f of files) {
      if (toAdd.length + existing.length >= limit) break;
      const key = uniqueKey(f);
      if (!existingKeys.has(key)) {
        toAdd.push(f);
        existingKeys.add(key);
      }
    }

    const nextImages = [...existing, ...toAdd].slice(0, limit);

    if (existing.length + files.length > limit) {
      const remaining = Math.max(0, limit - existing.length);
      alert(`This contest allows up to ${limit} photos per entry. Only ${remaining} more ${remaining === 1 ? 'photo' : 'photos'} accepted.`);
    }

    // Rebuild previews for nextImages
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    const previews = nextImages.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);
    setEntryForm(prev => ({ ...prev, images: nextImages, file: null }));
  };

  const removeImageAt = (index) => {
    const nextImages = [...(entryForm.images || [])];
    const nextPreviews = [...imagePreviews];
    const [removed] = nextPreviews.splice(index, 1);
    if (removed) URL.revokeObjectURL(removed);
    nextImages.splice(index, 1);
    setEntryForm(prev => ({ ...prev, images: nextImages }));
    setImagePreviews(nextPreviews);
  };

  const clearVideo = () => {
    setEntryForm(prev => ({ ...prev, file: null }));
  };
  // Helper: Upload with progress tracking using XMLHttpRequest
  const uploadWithProgress = async (file, onProgress) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error('No session');

        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileName = `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const url = `${supabaseUrl}/storage/v1/object/snapverse-files/${filePath}`;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);

        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY);
        // xhr.setRequestHeader('Content-Type', file.type); // Supabase might want this or let it detect from body
        // Unlike simple fetch, Supabase standard upload expects raw body but headers might need adjustment or x-upsert
        // Actually, for standard upload, we should use the proper content-type.
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.setRequestHeader('x-upsert', 'false');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            if (onProgress) onProgress(percent, event.loaded, event.total);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Construct public URL manually or fetch it
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/snapverse-files/${filePath}`;
            resolve(publicUrl);
          } else {
            console.error('Upload failed:', xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));

        xhr.send(file);
      } catch (err) {
        reject(err);
      }
    });
  };

  // Upload a file directly to Vercel Blob and return its public URL
  async function uploadToVercelBlob(file, meta = {}, onProgress) {
    if (file.type.startsWith('video/') && onProgress) {
      // Use XHR for video progress
      return await uploadWithProgress(file, onProgress);
    }
    // Temporarily use Supabase only to avoid 405 error
    console.log('Using Supabase fallback for file upload');
    const res = await UploadFile({ file });
    return res.file_url;
  }

  const handlePaymentScreenshot = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEntryForm(prev => ({ ...prev, payment_screenshot: file }));
    }
  };

  const handleUploadEntry = (entry) => {
    setSelectedEntry(entry);
    const contest = contests.find(c => c.id === entry.contest_id);
    setSelectedContest(contest);
    // Force media type from contest. No user choice allowed if contest specifies 'both'.
    // If contest is 'both', entryForm must handle both.
    const type = contest?.media_type || 'image';

    // Parse existing media
    let existing = [];
    if (entry.media_url !== 'pending_upload') {
      if (entry.media_urls && entry.media_urls.length > 0) {
        existing = entry.media_urls.map(url => ({
          url,
          type: url.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'image'
        }));
      } else if (entry.media_url) {
        existing = [{
          url: entry.media_url,
          type: entry.media_type === 'video' ? 'video' : 'image'
        }];
      }
    }

    setEntryForm({
      ...entryForm,
      title: entry.title,
      caption: entry.caption,
      media_type: type,
      images: [],
      file: null,
      existing_media: existing,
      mixed_media: { images: [], videos: [] }
    });
    setUploadDialogOpen(true);
  };



  const submitMediaUpload = async () => {
    if (!selectedEntry) return;

    // Validate media selection
    if (selectedContest?.media_type === 'both') {
      const requiredPhotos = selectedContest.required_photos || 1;
      const requiredVideos = selectedContest.required_videos || 1;
      const uploadedImages = entryForm.mixed_media?.images?.length || 0;
      const uploadedVideos = entryForm.mixed_media?.videos?.length || 0;

      if (uploadedImages < requiredPhotos) return alert(`At least ${requiredPhotos} photo(s) required.`);
      if (uploadedVideos < requiredVideos) return alert(`At least ${requiredVideos} video(s) required.`);
    } else {
      const isImage = entryForm.media_type === 'image';
      const limit = Number(selectedContest?.max_photos_per_entry || 1);
      if (isImage && (entryForm.images?.length || 0) !== limit) return alert(`Please select exactly ${limit} photos.`);
      if (!isImage && !entryForm.file) return alert('Please upload a video.');
    }

    setUploading(true);
    try {
      let primaryUrl = '';
      let mediaUrls = null;
      let finalMediaType = entryForm.media_type;

      // reuse existing upload logic (extracted or duplicated for safety)
      if (selectedContest?.media_type === 'both') {
        finalMediaType = 'both';
        const images = entryForm.mixed_media?.images || [];
        const videos = entryForm.mixed_media?.videos || [];

        const imageUploads = images.map((img) => UploadFile({ file: img }));

        let videoResults = [];
        if (videos.length > 0) {
          // Upload videos sequentially to track progress properly or use Promise.all with individual progress?
          // For simplicity, let's just upload them. 
          // If we want detailed progress for multiple files, we'd need more complex state.
          // Let's wrap uploadWithProgress to update overall progress? 
          // Or just use the last one's progress for now.
          const videoUploadPromises = videos.map(video => uploadWithProgress(video, (pct, loaded, total) => {
            setUploadProgress(pct);
            setUploadStats({ loaded, total });
          }));
          videoResults = await Promise.all(videoUploadPromises);
        }

        const imageResults = await Promise.all(imageUploads);

        const newUrls = [...imageResults.map(r => r.file_url), ...videoResults].filter(Boolean);

        // Combine with existing
        const existingUrls = entryForm.existing_media.map(m => m.url);
        mediaUrls = [...existingUrls, ...newUrls];

        // Primary URL logic (prefer image)
        const allImages = [...entryForm.existing_media.filter(m => m.type === 'image').map(m => m.url), ...imageResults.map(r => r.file_url)];
        primaryUrl = allImages[0] || mediaUrls[0];

      } else if (entryForm.media_type === 'image') {
        const uploads = entryForm.images.map((img) => UploadFile({ file: img }));
        const results = await Promise.all(uploads);
        const newUrls = results.map(r => r.file_url).filter(Boolean);

        mediaUrls = [...entryForm.existing_media.map(m => m.url), ...newUrls];
        primaryUrl = mediaUrls[0];
      } else {
        // Video
        let newUrl = null;
        if (entryForm.file) {
          newUrl = await uploadWithProgress(entryForm.file, (pct, loaded, total) => {
            setUploadProgress(pct);
            setUploadStats({ loaded, total });
          });
        }

        mediaUrls = [...entryForm.existing_media.map(m => m.url), ...(newUrl ? [newUrl] : [])];
        primaryUrl = mediaUrls[0];
      }

      // Calculate AI Score (optional)
      const AI_JUDGE_URL = import.meta.env.VITE_AI_JUDGE_URL;
      let aiScore = 0;
      if (primaryUrl && AI_JUDGE_URL) {
        try {
          /* AI Score logic omitted for brevity, keeping existing if needed */
        } catch { }
      }

      // Update Entry
      await Entry.update(selectedEntry.id, {
        media_url: primaryUrl,
        media_urls: mediaUrls,
        media_type: finalMediaType,
        // payment status stays 'approved'
      });

      alert('Entry updated successfully!');
      setUploadDialogOpen(false);

      loadData();
    } catch (e) {
      console.error(e);
      alert('Upload failed: ' + e.message);
    }
    setUploading(false);
  };

  /* proceedToPayment removed as it is merged into submitPaymentProof */


  const submitPaymentProof = async () => {
    if (!entryForm.title) {
      alert('Please fill in entry title first.');
      return;
    }
    if (!entryForm.payment_screenshot) {
      alert('Please upload payment screenshot.');
      return;
    }

    setUploading(true);
    try {
      // Check for existing entry to prevent duplicates
      const existingEntries = await Entry.filter({ user_id: user.id, contest_id: selectedContest.id });
      if (existingEntries && existingEntries.length > 0) {
        alert('You have already joined this contest!');
        setUploading(false);
        setJoinDialogOpen(false);
        loadData();
        return;
      }

      // Upload payment screenshot

      const { file_url: payment_url } = await UploadFile({ file: entryForm.payment_screenshot, category: 'payment_proofs' });

      // Create entry and mark as waiting for approval
      await Entry.create({
        contest_id: selectedContest.id,
        user_id: user.id,
        title: entryForm.title,
        caption: entryForm.caption,
        media_url: 'pending_upload', // Placeholder
        media_urls: [],
        media_type: selectedContest.media_type === 'both' ? 'image' : selectedContest.media_type, // Use valid type to satisfy DB constraint
        payment_status: 'paid_waiting_approval', // Wait for admin approval
        payment_screenshot: payment_url,
        ai_score: 0
      });


      await User.update(user.id, {
        contests_joined: (user.contests_joined || 0) + 1
      });

      setPaymentStep('uploaded');
      loadData();

    } catch (error) {
      console.error('Error submitting entry:', error);
      alert('Error submitting entry: ' + (error.message || JSON.stringify(error)));
    }
    setUploading(false);
  };

  const handleApproveEntry = async (entry) => {
    if (!isAdmin()) return;
    try {
      await Entry.update(entry.id, { payment_status: 'approved' });
      alert('Entry approved! User can now upload media.');
      loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to approve: ' + e.message);
    }
  };

  const handleRejectEntry = async (entry) => {
    if (!isAdmin()) return;
    if (!confirm('Reject this entry?')) return;
    try {
      await Entry.update(entry.id, { payment_status: 'rejected' });
      alert('Entry rejected.');
      loadData();
    } catch (e) {
      console.error(e);
      alert('Failed to reject: ' + e.message);
    }
  };

  const closeDialog = () => {
    setJoinDialogOpen(false);
    setUploadDialogOpen(false);
    setPaymentStep('details'); // Reset step for next open
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setEntryForm({
      title: '',
      caption: '',
      media_type: 'image',
      file: null,
      images: [],
      payment_screenshot: null,
      mixed_media: { images: [], videos: [] }
    });
    // Remove ?join param from URL
    const params = new URLSearchParams(location.search);
    if (params.has('join')) {
      params.delete('join');
      navigate({ search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse pulse-glow"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-700/50 rounded w-32 skeleton"></div>
              <div className="h-3 bg-slate-700/30 rounded w-24 skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Creative Contests</h1>
          <p className="text-xl text-slate-300">Join exciting contests and showcase your creativity</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 mobile-sticky-tabs overflow-x-auto no-scrollbar whitespace-nowrap">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Clock className="w-4 h-4 mr-2" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300">
              <Trophy className="w-4 h-4 mr-2" />
              Ongoing
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-gray-500/20 data-[state=active]:text-gray-300">
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="my" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300">
              <Users className="w-4 h-4 mr-2" />
              My Contests
            </TabsTrigger>
            {isAdmin() && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300">
                <CheckCircle className="w-4 h-4 mr-2" />
                Admin Approvals
                {adminEntries.length > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white animate-pulse">{adminEntries.length}</Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {['upcoming', 'ongoing', 'completed', 'my'].map(status => (
            <TabsContent key={status} value={status}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterContests(status).map((contest) => (
                  <Card
                    key={contest.id}
                    className="glass-card card-hover gradient-border group cursor-pointer relative"
                    onClick={() => navigate(`/contest/${contest.id}`)}
                  >

                    <div>
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={contest.banner_image || `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=300&fit=crop`}
                          alt={contest.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Badge className={`absolute top-4 right-4 ${getStatusColor(getContestStatus(contest))}`}>
                          {getContestStatus(contest)}
                        </Badge>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2">{contest.title}</h3>
                        <p className="text-slate-400 mb-4 line-clamp-3">{contest.description}</p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Entry Fee</span>
                            <span className="text-white font-semibold">₹{contest.entry_fee}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Prize Pool</span>
                            <span className="text-green-400 font-semibold">₹{contest.prize_pool}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Ends</span>
                            <span className="text-white">{format(new Date(contest.end_date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>

                        {(() => {
                          const entry = myEntries.find(e => e.contest_id === contest.id);
                          if (entry) {
                            if (entry.payment_status === 'paid_waiting_approval') {
                              return (
                                <Button disabled className="w-full bg-yellow-500/20 text-yellow-500 border-yellow-500/50 cursor-not-allowed">
                                  <Clock className="w-4 h-4 mr-2" />
                                  Verification Pending
                                </Button>
                              );
                            } else if (entry.payment_status === 'approved' && entry.media_url === 'pending_upload') {
                              return (
                                <Button
                                  onClick={(e) => { e.stopPropagation(); handleUploadEntry(entry); }}
                                  className="w-full btn-primary animate-pulse"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Entry
                                </Button>

                              );
                            } else {
                              return (
                                <Button disabled className="w-full bg-green-500/20 text-green-500 border-green-500/50 cursor-not-allowed">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Submitted
                                </Button>
                              );
                            }
                          } else {
                            return (
                              <Button
                                className="w-full btn-primary"
                                onClick={(e) => { e.stopPropagation(); handleJoinContest(contest); }}
                                disabled={getContestStatus(contest) === 'completed'}
                              >
                                {getContestStatus(contest) === 'completed' ? 'Contest Ended' : 'Join Contest'}
                              </Button>

                            );
                          }
                        })()}

                        {(() => {
                          const adminCheck = isAdmin();
                          console.log(`Admin check for contest ${contest.id}:`, adminCheck, 'user:', user);
                          return adminCheck && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              <Button variant="outline" className="border-slate-600 text-slate-200" onClick={(e) => { e.stopPropagation(); handleEditContest(contest); }}>
                                Edit
                              </Button>
                              <Button variant="destructive" onClick={(e) => { e.stopPropagation(); handleDeleteContest(contest); }}>
                                Delete
                              </Button>
                            </div>

                          );
                        })()}
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}

          {/* Admin Tab Content */}
          <TabsContent value="admin">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminEntries.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400">
                  <p>No pending approvals.</p>
                </div>
              ) : (
                adminEntries.map(entry => {
                  const contest = contests.find(c => c.id === entry.contest_id);
                  return (
                    <Card key={entry.id} className="glass-card border-l-4 border-l-yellow-500">
                      <CardHeader>
                        <CardTitle className="text-white text-lg flex justify-between">
                          <span>{entry.title}</span>
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400">Pending</Badge>
                        </CardTitle>
                        <p className="text-sm text-slate-400">{contest?.title || 'Unknown Contest'}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <Label className="text-xs text-slate-500 uppercase">Payment Proof</Label>
                          <div className="mt-2 rounded-lg overflow-hidden border border-slate-700 h-48 bg-black/50 flex items-center justify-center cursor-pointer" onClick={() => window.open(entry.payment_screenshot, '_blank')}>
                            {entry.payment_screenshot ? (
                              <img src={entry.payment_screenshot} alt="Proof" className="max-h-full max-w-full object-contain" />
                            ) : (
                              <span className="text-slate-500">No Screenshot</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApproveEntry(entry)}>
                            Approve
                          </Button>
                          <Button variant="destructive" className="flex-1" onClick={() => handleRejectEntry(entry)}>
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Join Contest Dialog */}
        <Dialog open={joinDialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl gradient-text">
                Join Contest: {selectedContest?.title}
              </DialogTitle>
            </DialogHeader>

            {paymentStep !== 'uploaded' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 glass-effect rounded-lg border border-slate-700/50">
                  <span>Entry Fee</span>
                  <span className="font-bold text-lg">₹{selectedContest?.entry_fee}</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Entry Title</Label>
                    <Input
                      id="title"
                      value={entryForm.title}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Give your entry a catchy title"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="caption">Caption/Description</Label>
                    <Textarea
                      id="caption"
                      value={entryForm.caption}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="Describe your creative work..."
                      className="bg-slate-800 border-slate-600 text-white h-24"
                    />
                  </div>

                  <div>
                    <Label>Upload Type</Label>
                    <div className="flex gap-3 mt-2">
                      {selectedContest?.media_type === 'both' ? (
                        <div className="flex-1 text-center">
                          <span className="text-sm text-purple-400">Mixed Media Contest</span>
                          <p className="text-xs text-slate-400 mt-1">Both image and video required</p>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant={entryForm.media_type === 'image' ? 'default' : 'outline'}
                            className={`flex-1 ${entryForm.media_type === 'image' ? 'bg-purple-600 text-white hover:bg-purple-600' : ''}`}
                            onClick={() => setEntryForm(prev => ({ ...prev, media_type: 'image' }))}
                            aria-pressed={entryForm.media_type === 'image'}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Image
                          </Button>
                          <Button
                            variant={entryForm.media_type === 'video' ? 'default' : 'outline'}
                            className={`flex-1 ${entryForm.media_type === 'video' ? 'bg-purple-600 text-white hover:bg-purple-600' : ''}`}
                            onClick={() => setEntryForm(prev => ({ ...prev, media_type: 'video' }))}
                            aria-pressed={entryForm.media_type === 'video'}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Video
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-300 font-medium">Two-Stage Entry Process</p>
                        <p className="text-xs text-blue-400 mt-1">
                          1. Provide details and pay the entry fee.<br />
                          2. Wait for admin approval.<br />
                          3. Once approved, you can upload your photos/videos from "My Contests".
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Section (Merged) */}
                  <div className="border-t border-slate-700/50 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Payment & Verification</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 text-center bg-white p-2 rounded-lg h-fit">
                        <img
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c7b613b5f93c0f8691117d/b175f03de_image.png"
                          alt="Payment QR Code"
                          className="w-32 h-32 object-contain"
                        />
                        <p className="text-xs text-slate-900 font-bold mt-1">Scan to Pay</p>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <Label>Upload Payment Screenshot</Label>
                          <div className="mt-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePaymentScreenshot}
                              className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600"
                            />
                          </div>
                          {entryForm.payment_screenshot && (
                            <p className="text-sm text-green-400 mt-2">✓ Screenshot uploaded: {entryForm.payment_screenshot.name}</p>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          Please upload a screenshot of your successful transaction.
                          Our team will verify it before you can upload your entry media.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={submitPaymentProof}
                    disabled={
                      !entryForm.title ||
                      !entryForm.payment_screenshot ||
                      uploading
                    }
                  >
                    {uploading ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Submit Entry
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}


            {paymentStep === 'uploaded' && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Joined Contest Successfully!</h3>
                  <p className="text-slate-300 mb-4">
                    Your creative work and payment proof have been submitted our team will verify it. You're all set—good luck!
                  </p>

                </div>
                <Button
                  className="btn-primary"
                  onClick={closeDialog}
                >
                  Continue Browsing
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Upload Entry Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Upload Submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Existing Media Section */}
              {entryForm.existing_media && entryForm.existing_media.length > 0 && (
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <Label className="mb-3 block text-yellow-400">Current Uploads (Click X to remove)</Label>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {entryForm.existing_media.map((item, idx) => (
                      <div key={idx} className="relative group shrink-0 w-24 h-24">
                        {item.type === 'video' ? (
                          <video src={item.url} className="w-full h-full object-cover rounded border border-white/20" />
                        ) : (
                          <img src={item.url} className="w-full h-full object-cover rounded border border-white/20" />
                        )}
                        <button
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg"
                          onClick={() => {
                            const newExisting = [...entryForm.existing_media];
                            newExisting.splice(idx, 1);
                            setEntryForm(prev => ({ ...prev, existing_media: newExisting }));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enforce Media Type - No User Selection */}

              <div>
                <Label className="mb-2 block">
                  Upload Files ({selectedContest?.media_type === 'both' ? 'Photos & Videos Required' : (selectedContest?.media_type === 'video' ? 'Video Required' : 'Photos Required')})
                </Label>

                <div className="space-y-4">
                  {selectedContest?.media_type === 'both' ? (
                    <>
                      <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
                        <Label className="text-sm mb-2 block">1. Upload Photos</Label>
                        <input type="file" multiple accept="image/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const limit = Number(selectedContest?.max_photos_per_entry || selectedContest?.settings?.max_photos_per_entry || 3);
                            const currentcount = entryForm.mixed_media.images.length;
                            if (currentcount + files.length > limit) {
                              alert(`Maximum ${limit} photos allowed.`);
                              const remaining = limit - currentcount;
                              if (remaining > 0) {
                                setEntryForm(prev => ({ ...prev, mixed_media: { ...prev.mixed_media, images: [...prev.mixed_media.images, ...files.slice(0, remaining)] } }));
                              }
                            } else {
                              setEntryForm(prev => ({ ...prev, mixed_media: { ...prev.mixed_media, images: [...prev.mixed_media.images, ...files] } }));
                            }
                          }}
                          className="w-full text-slate-300"
                        />
                        <p className="text-xs text-slate-400 mt-2">{entryForm.mixed_media?.images?.length || 0} photos selected (Min: {selectedContest.required_photos || 1})</p>
                        {/* Preview Images for Mixed */}
                        {entryForm.mixed_media?.images?.length > 0 && (
                          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                            {entryForm.mixed_media.images.map((file, idx) => (
                              <img key={idx} src={URL.createObjectURL(file)} className="w-12 h-12 object-cover rounded" />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
                        <Label className="text-sm mb-2 block">2. Upload Videos</Label>
                        <input type="file" multiple accept="video/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const limit = Number(selectedContest?.max_videos_allowed || selectedContest?.settings?.max_videos_allowed || 1);
                            const currentcount = entryForm.mixed_media.videos.length;
                            if (currentcount + files.length > limit) {
                              alert(`Maximum ${limit} videos allowed.`);
                              const remaining = limit - currentcount;
                              if (remaining > 0) {
                                setEntryForm(prev => ({ ...prev, mixed_media: { ...prev.mixed_media, videos: [...prev.mixed_media.videos, ...files.slice(0, remaining)] } }));
                              }
                            } else {
                              setEntryForm(prev => ({ ...prev, mixed_media: { ...prev.mixed_media, videos: [...prev.mixed_media.videos, ...files] } }));
                            }
                          }}
                          className="w-full text-slate-300"
                        />
                        <p className="text-xs text-slate-400 mt-2">{entryForm.mixed_media?.videos?.length || 0} videos selected (Min: {selectedContest.required_videos || 1})</p>
                      </div>
                    </>
                  ) : (
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors">
                      <input
                        type="file"
                        accept={selectedContest?.media_type === 'video' ? 'video/*' : 'image/*'}
                        multiple={selectedContest?.media_type !== 'video'}
                        onChange={handleFileSelect}
                        className="w-full text-slate-300"
                      />
                      {/* Simple Preview */}
                      {selectedContest?.media_type !== 'video' && imagePreviews.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                          {imagePreviews.map((src, idx) => (
                            <img key={idx} src={src} className="w-full h-16 object-cover rounded" />
                          ))}
                        </div>
                      )}
                      {entryForm.file && <p className="mt-2 text-green-400">{entryForm.file.name}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Uploading... {uploadProgress}%</span>
                    <span>
                      {uploadStats.total > 0 ? (
                        `${(uploadStats.loaded / (1024 * 1024)).toFixed(2)} MB / ${(uploadStats.total / (1024 * 1024)).toFixed(2)} MB`
                      ) : 'Preparing...'}
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="w-full btn-primary"
                onClick={submitMediaUpload}
                disabled={uploading}
              >
                {uploading ? 'Processing...' : 'Submit Entry'}
              </Button>
            </div>

          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}