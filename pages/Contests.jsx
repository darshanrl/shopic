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
  QrCode, // Added QrCode icon
  Camera as CameraIcon, // Added CameraIcon
  AlertCircle // Added AlertCircle icon
} from "lucide-react";
import { format } from "date-fns";
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import RazorpayPayment from '@/components/RazorpayPayment';

export default function Contests() {
  const [contests, setContests] = useState([]);
  const [myEntries, setMyEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  // const [paymentDialogOpen, setPaymentDialogOpen] = useState(false); // Not needed, using joinDialogOpen
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [paymentStep, setPaymentStep] = useState('details'); // 'details', 'payment', 'uploaded'
  const [entryForm, setEntryForm] = useState({
    title: '',
    caption: '',
    media_type: 'image',
    file: null, // used for video uploads
    images: [], // used for multi-image uploads
    payment_screenshot: null // Added payment_screenshot
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  // Open join dialog when URL has ?join=<contestId>
  useEffect(() => {
    if (!loading && contests?.length) {
      const params = new URLSearchParams(location.search);
      const joinId = params.get('join');
      if (joinId) {
        const contest = contests.find(c => String(c.id) === String(joinId));
        if (contest) {
          handleJoinContest(contest);
        }
      }
    }
  }, [loading, contests, location.search]);

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
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`/api/contests/${contest.id}`, {
        method: 'DELETE',
        headers: { 
          'content-type': 'application/json',
          'authorization': `Bearer ${token}`
        }
      });
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete contest');
      }
      
      const result = await response.json();
      console.log('Delete result:', result);
      
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
    
    setSelectedContest(contest);
    setJoinDialogOpen(true);
    setPaymentStep('details'); // Set step to 'details' when opening dialog
    setEntryForm({
      title: '',
      caption: '',
      media_type: 'image',
      file: null,
      payment_screenshot: null // Reset payment screenshot
    });
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
    
    if (entryForm.media_type === 'mixed') {
      const images = [];
      let videoFile = null;
      
      // Separate images and videos
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          images.push(file);
        } else if (file.type.startsWith('video/') && !videoFile) {
          videoFile = file;
        }
      });
      
      // Handle images
      const limit = Number(selectedContest?.max_photos_per_entry || 1);
      const existing = entryForm.images || [];
      const uniqueKey = (f) => `${f.name}_${f.lastModified}_${f.size}`;
      const existingKeys = new Set(existing.map(uniqueKey));
      
      const toAdd = [];
      for (const f of images) {
        if (toAdd.length + existing.length >= limit) break;
        const key = uniqueKey(f);
        if (!existingKeys.has(key)) {
          toAdd.push(f);
          existingKeys.add(key);
        }
      }
      
      const nextImages = [...existing, ...toAdd].slice(0, limit);
      
      // Rebuild previews for nextImages
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      const previews = nextImages.map(f => URL.createObjectURL(f));
      setImagePreviews(previews);
      
      // Update form with both images and video
      setEntryForm(prev => ({ ...prev, images: nextImages, file: videoFile }));
      return;
    }
    
    // Handle image-only uploads (original logic)
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
       // Upload a file directly to Vercel Blob and return its public URL
  async function uploadToVercelBlob(file, meta = {}) {
    const r = await fetch('/api/blob/generate-upload-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
     body: JSON.stringify({
        contentType: file.type,
      filename: file.name,
      clientPayload: meta,
    }),
  });
  if (!r.ok) throw new Error('Failed to get upload URL');
  const { uploadUrl } = await r.json();
  const up = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'content-type': file.type },
    body: file,
  });
  if (!up.ok) throw new Error('Upload failed');
  const blob = await up.json(); // { url, downloadUrl, ... }
  return blob.downloadUrl || blob.url;
  }
 
  const handlePaymentScreenshot = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEntryForm(prev => ({ ...prev, payment_screenshot: file }));
    }
  };

  const proceedToPayment = () => {
    if (!entryForm.title) {
      alert('Please fill in entry title first.');
      return;
    }
    const isImage = entryForm.media_type === 'image';
    const limit = Number(selectedContest?.max_photos_per_entry || 1);
    const valid = isImage ? (entryForm.images?.length || 0) === limit : !!entryForm.file;
    if (!valid) {
      if (isImage) {
        alert(`Please select exactly ${limit} photos to continue.`);
      } else {
        alert('Please upload your video.');
      }
      return;
    }
    // If contest is free, submit immediately without payment step
    if ((selectedContest?.entry_fee || 0) === 0) {
      submitFreeEntry();
      return;
    }
    setPaymentStep('payment');
  };

  const submitFreeEntry = async () => {
    setUploading(true);
    try {
      let primaryUrl = '';
      let mediaUrls = null;

      if (entryForm.media_type === 'image') {
        // Upload multiple images
        const uploads = [];
        for (const img of entryForm.images) {
          uploads.push(UploadFile({ file: img }));
        }
        const results = await Promise.all(uploads);
        mediaUrls = results.map(r => r.file_url).filter(Boolean);
        primaryUrl = mediaUrls[0];
      } else {
        const { file_url } = await UploadFile({ file: entryForm.file });
        primaryUrl = file_url;
      }

      // Optional: AI judge uses primaryUrl
      const AI_JUDGE_URL = import.meta.env.VITE_AI_JUDGE_URL;
      const ENABLE_AI = String(import.meta.env.VITE_ENABLE_AI || '').toLowerCase() === 'true';
      let aiScore = 0;
      if (ENABLE_AI && AI_JUDGE_URL) {
        try {
          const resp = await fetch(AI_JUDGE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              media_url: primaryUrl,
              media_type: entryForm.media_type
            })
          });
          if (resp.ok) {
            const data = await resp.json().catch(() => ({}));
            aiScore = Math.max(0, Math.min(100, Number(data?.ai_score) || 0));
          }
        } catch {}
      }

      await Entry.create({
        contest_id: selectedContest.id,
        user_id: user.id,
        title: entryForm.title,
        caption: entryForm.caption,
        media_url: primaryUrl,
        media_urls: mediaUrls,
        media_type: entryForm.media_type,
        payment_status: 'approved',
        ai_score: aiScore
      });

      await User.update(user.id, { contests_joined: (user.contests_joined || 0) + 1 });
      setPaymentStep('uploaded');
      loadData();
    } catch (e) {
      console.error('Free entry submit error:', e);
      alert('Error submitting entry. Please try again.');
    }
    setUploading(false);
  };

  const submitPaymentProof = async () => {
    if (!entryForm.payment_screenshot) {
      alert('Please upload payment screenshot.');
      return;
    }

    setUploading(true);
    try {
      let primaryUrl = '';
      let mediaUrls = null;

      if (entryForm.media_type === 'image') {
        const uploads = entryForm.images.map((img) => UploadFile({ file: img }));
        const results = await Promise.all(uploads);
        mediaUrls = results.map(r => r.file_url).filter(Boolean);
        primaryUrl = mediaUrls[0];
      } else {
        const url = await uploadToVercelBlob(
          entryForm.file,
          { kind: 'contest_video', contestId: selectedContest.id }
        );
        primaryUrl = url;
      }
      
      // Upload payment screenshot
      const { file_url: payment_url } = await UploadFile({ file: entryForm.payment_screenshot, category: 'payment_proofs' });
      
      // Call AI Judge to compute AI score for the uploaded media
      const AI_JUDGE_URL = import.meta.env.VITE_AI_JUDGE_URL;
      const ENABLE_AI = String(import.meta.env.VITE_ENABLE_AI || '').toLowerCase() === 'true';
      let aiScore = 0;
      if (ENABLE_AI && AI_JUDGE_URL) {
        try {
          const resp = await fetch(AI_JUDGE_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              media_url: primaryUrl,
              media_type: entryForm.media_type
            })
          });
          if (resp.ok) {
            const data = await resp.json().catch(() => ({}));
            aiScore = Math.max(0, Math.min(100, Number(data?.ai_score) || 0));
          }
        } catch (e) {
          // Fail closed to 0 without blocking submission
        }
      }
      
      // Create entry and immediately mark as approved (joined)
      await Entry.create({
        contest_id: selectedContest.id,
        user_id: user.id,
        title: entryForm.title,
        caption: entryForm.caption,
        media_url: primaryUrl,
        media_urls: mediaUrls,
        media_type: entryForm.media_type,
        payment_status: 'approved', // Immediately approve so user is joined
        payment_screenshot: payment_url,
        ai_score: aiScore
      });

      await User.update(user.id, {
        contests_joined: (user.contests_joined || 0) + 1
      });

      setPaymentStep('uploaded');
      loadData();
      
    } catch (error) {
      console.error('Error submitting entry:', error);
      alert('Error submitting entry. Please try again.');
    }
    setUploading(false);
  };

  const closeDialog = () => {
    setJoinDialogOpen(false);
    setPaymentStep('details'); // Reset step for next open
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setEntryForm({
      title: '',
      caption: '',
      media_type: 'image',
      file: null,
      images: [],
      payment_screenshot: null
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
          </TabsList>

          {['upcoming', 'ongoing', 'completed', 'my'].map(status => (
            <TabsContent key={status} value={status}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filterContests(status).map((contest) => (
                   <Card key={contest.id} className="glass-card card-hover gradient-border group">
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

                         <Button 
                           className="w-full btn-primary"
                           onClick={() => handleJoinContest(contest)}
                           disabled={getContestStatus(contest) === 'completed'}
                         >
                           {getContestStatus(contest) === 'completed' 
                             ? 'Contest Ended' 
                             : myEntries.some(entry => entry.contest_id === contest.id)
                               ? 'Already Joined'
                               : 'Join Contest'
                           }
                         </Button>
                         {(() => {
                           const adminCheck = isAdmin();
                           console.log(`Admin check for contest ${contest.id}:`, adminCheck, 'user:', user);
                           return adminCheck && (
                           <div className="mt-3 grid grid-cols-2 gap-3">
                             <Button variant="outline" className="border-slate-600 text-slate-200" onClick={() => handleEditContest(contest)}>
                               Edit
                             </Button>
                             <Button variant="destructive" onClick={() => handleDeleteContest(contest)}>
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
        </Tabs>

        {/* Join Contest Dialog */}
        <Dialog open={joinDialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl gradient-text">
                Join Contest: {selectedContest?.title}
              </DialogTitle>
            </DialogHeader>
            
            {paymentStep === 'details' && (
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
                      {selectedContest?.media_type === 'both' && (
                        <Button
                          variant={entryForm.media_type === 'mixed' ? 'default' : 'outline'}
                          className={`flex-1 ${entryForm.media_type === 'mixed' ? 'bg-purple-600 text-white hover:bg-purple-600' : ''}`}
                          onClick={() => setEntryForm(prev => ({ ...prev, media_type: 'mixed' }))}
                          aria-pressed={entryForm.media_type === 'mixed'}
                        >
                          <CameraIcon className="w-4 h-4 mr-2" />
                          Mixed
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Upload File</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept={entryForm.media_type === 'image' ? 'image/*' : entryForm.media_type === 'video' ? 'video/*' : 'image/*,video/*'}
                        multiple={entryForm.media_type === 'image' || entryForm.media_type === 'mixed'}
                        onChange={handleFileSelect}
                        className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                      />
                      {entryForm.media_type === 'image' ? (
                        <>
                          <p className="text-xs text-slate-400 mt-2">
                            {imagePreviews.length}/{Number(selectedContest?.max_photos_per_entry || 1)} selected. You can select up to {Number(selectedContest?.max_photos_per_entry || 1)} photos.
                          </p>
                          {imagePreviews?.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {imagePreviews.map((src, idx) => (
                                <div key={idx} className="relative rounded overflow-hidden border border-slate-700">
                                  <img src={src} alt={`selected ${idx+1}`} className="w-full h-24 object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => removeImageAt(idx)}
                                    className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : entryForm.media_type === 'video' ? (
                        entryForm.file && (
                          <div className="mt-3 flex items-center justify-between bg-slate-800/60 px-3 py-2 rounded border border-slate-700">
                            <span className="text-sm text-slate-300 truncate">{entryForm.file.name}</span>
                            <button type="button" onClick={clearVideo} className="text-xs text-red-400">Remove</button>
                          </div>
                        )
                      ) : (
                        <>
                          <p className="text-xs text-slate-400 mt-2">
                            {imagePreviews.length} photo(s) and {entryForm.file ? 1 : 0} video(s) selected. You can upload multiple photos and one video.
                          </p>
                          {imagePreviews?.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {imagePreviews.map((src, idx) => (
                                <div key={idx} className="relative rounded overflow-hidden border border-slate-700">
                                  <img src={src} alt={`selected ${idx+1}`} className="w-full h-24 object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => removeImageAt(idx)}
                                    className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {entryForm.file && (
                            <div className="mt-3 flex items-center justify-between bg-slate-800/60 px-3 py-2 rounded border border-slate-700">
                              <span className="text-sm text-slate-300 truncate">{entryForm.file.name}</span>
                              <button type="button" onClick={clearVideo} className="text-xs text-red-400">Remove</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                   <Button
                      className="flex-1 btn-primary"
                      onClick={proceedToPayment}
                      disabled={
                        !entryForm.title ||
                        (entryForm.media_type === 'image'
                          ? (entryForm.images?.length || 0) !== Number(selectedContest?.max_photos_per_entry || 1)
                          : entryForm.media_type === 'video'
                          ? !entryForm.file
                          : !entryForm.file && (entryForm.images?.length || 0) === 0)
                      }
                    >
                     {(selectedContest?.entry_fee || 0) === 0 ? (
                       <>Join with {entryForm.media_type === 'image' ? (entryForm.images?.length || 0) : entryForm.media_type === 'video' ? 1 : `${(entryForm.images?.length || 0)} photos + 1 video`} of {entryForm.media_type === 'image' ? Number(selectedContest?.max_photos_per_entry || 1) : entryForm.media_type === 'video' ? 1 : 'multiple'}</>
                     ) : (
                       <>
                         <CreditCard className="w-4 h-4 mr-2" />
                         Pay with Razorpay
                       </>
                     )}
                   </Button>
                </div>
              </div>
            )}

            {paymentStep === 'payment' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-4">Complete Payment</h3>
                  <p className="text-slate-400 mb-6">
                    Pay securely with Razorpay to enter "{selectedContest?.title}"
                  </p>
                </div>
                
                <RazorpayPayment
                  contestTitle={selectedContest?.title}
                  entryFee={selectedContest?.entry_fee}
                  userEmail={user?.email}
                  onPaymentSuccess={async (paymentData) => {
                    console.log('Payment successful:', paymentData);
                    setPaymentStep('uploaded');
                    loadData();
                  }}
                />
                
                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setPaymentStep('details')}
                  >
                    Back
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
      </div>
    </div>
  );
}