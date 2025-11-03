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
    file: null,
    payment_screenshot: null // Added payment_screenshot
  });
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
    const file = e.target.files[0];
    if (file) {
      setEntryForm(prev => ({ ...prev, file }));
    }
  };

  const handlePaymentScreenshot = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEntryForm(prev => ({ ...prev, payment_screenshot: file }));
    }
  };

  const proceedToPayment = () => {
    if (!entryForm.title || !entryForm.file) {
      alert('Please fill in entry title and upload your creative work first.');
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
      // Upload entry file
      const { file_url } = await UploadFile({ file: entryForm.file });

      // Optional: AI judge
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
              media_url: file_url,
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
        media_url: file_url,
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
      // Upload entry file
      const { file_url } = await UploadFile({ file: entryForm.file });
      
      // Upload payment screenshot
      const { file_url: payment_url } = await UploadFile({ file: entryForm.payment_screenshot, category: 'payment_proofs' }); // Added category for clarity
      
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
              media_url: file_url,
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
        media_url: file_url,
        media_type: entryForm.media_type,
        payment_status: 'approved', // Immediately approve so user is joined
        payment_screenshot: payment_url,
        ai_score: aiScore
      });

      // Note: Admin team can later verify receipts from dataset/dashboard.

      // Update user stats (increment contests_joined)
      await User.update(user.id, {
        contests_joined: (user.contests_joined || 0) + 1
      });

      setPaymentStep('uploaded'); // Move to success screen
      loadData(); // Reload data to show updated entry status potentially
      
    } catch (error) {
      console.error('Error submitting entry:', error);
      alert('Error submitting entry. Please try again.');
    }
    setUploading(false);
  };

  const closeDialog = () => {
    setJoinDialogOpen(false);
    setPaymentStep('details'); // Reset step for next open
    setEntryForm({
      title: '',
      caption: '',
      media_type: 'image',
      file: null,
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
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    </div>
                  </div>

                  <div>
                    <Label>Upload File</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept={entryForm.media_type === 'image' ? 'image/*' : 'video/*'}
                        onChange={handleFileSelect}
                        className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                      />
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
                     disabled={!entryForm.file || !entryForm.title}
                   >
                     {(selectedContest?.entry_fee || 0) === 0 ? (
                       <>Join for Free</>
                     ) : (
                       <>
                         <QrCode className="w-4 h-4 mr-2" />
                         Proceed to Payment
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
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c7b613b5f93c0f8691117d/b175f03de_image.png" // Placeholder QR code
                      alt="Payment QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-slate-300 mt-4 mb-2">Scan QR code to pay ₹{selectedContest?.entry_fee}</p>
                  <p className="text-sm text-slate-400">UPI Payment • Secure Transaction</p>
                </div>

                <div className="space-y-4">
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
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setPaymentStep('details')}
                  >
                    Back
                  </Button>
                   <Button
                     className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                     onClick={submitPaymentProof}
                     disabled={!entryForm.payment_screenshot || uploading}
                   >
                     {uploading ? (
                       <>
                         <Upload className="w-4 h-4 mr-2 animate-spin" />
                         Submitting...
                       </>
                     ) : (
                       <>
                         <CheckCircle className="w-4 h-4 mr-2" />
                         Submit for Approval
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
      </div>
    </div>
  );
}