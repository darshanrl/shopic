import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Contest } from "@/entities/Contest";
import { Entry } from "@/entities/Entry"; // Import Entry to check status
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Trophy,
    Calendar,
    Users,
    Clock,
    ArrowLeft,
    Share2,
    AlertCircle,
    X
} from "lucide-react";

import { format } from "date-fns";

export default function ContestDetails() {
    const { contestId } = useParams();
    const navigate = useNavigate();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [myEntry, setMyEntry] = useState(null);

    // Lightbox State
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [mediaType, setMediaType] = useState('image'); // 'image' or 'video'

    const openMedia = (url, type) => {
        setSelectedMedia(url);
        setMediaType(type);
    };

    const closeMedia = () => {
        setSelectedMedia(null);
    };


    useEffect(() => {
        loadData();
    }, [contestId]);

    const loadData = async () => {
        try {
            const [contestData, userData] = await Promise.all([
                Contest.getById(contestId),
                User.me()
            ]);
            setContest(contestData);
            setUser(userData);

            if (userData) {
                // Check if user has already joined
                const entries = await Entry.filter({ user_id: userData.id, contest_id: contestId });
                if (entries.length > 0) {
                    setMyEntry(entries[0]);
                }
            }
        } catch (error) {
            console.error("Error loading contest details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClick = () => {
        // Navigate back to contests page with ?join param to open the dialog
        // Or we could implement the join dialog here directly. 
        // For consistency and Reuse, let's redirect to main page with join param for now, 
        // OR better, since user wants a "page", we should probably implement the join flow here.
        // But given the complexity of the Join Dialog I just refactored, it is better to reuse it.
        navigate(`/contests?join=${contestId}`);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    if (!contest) {
        return <div className="min-h-screen flex items-center justify-center text-white">Contest not found</div>;
    }

    const isOwner = user && contest.created_by === user.id;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header / Back */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => navigate('/contests')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Contests
                    </Button>
                </div>

                {/* Hero Section */}
                <div className="relative rounded-2xl overflow-hidden glass-card">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10"></div>
                    <img
                        src={contest.banner_image || "https://images.unsplash.com/photo-1552168324-d612d77725e3?q=80&w=1000&auto=format&fit=crop"}
                        alt={contest.title}
                        className="w-full h-80 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <Badge className="mb-4 bg-purple-500/80 hover:bg-purple-500 text-white border-none text-sm px-3 py-1 uppercase tracking-wider">
                                    {contest.category}
                                </Badge>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">{contest.title}</h1>
                                <div className="flex items-center gap-4 text-slate-300">
                                    <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">{format(new Date(contest.start_date), 'MMM d, yyyy')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm font-medium">{contest.max_participants} Spots</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                                    <Share2 className="w-4 h-4" /> Share
                                </Button>
                                {myEntry ? (
                                    (() => {
                                        if (myEntry.payment_status === 'paid_waiting_approval') {
                                            return <Button disabled className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Verification Pending</Button>;
                                        } else if (myEntry.payment_status === 'approved' && myEntry.media_url === 'pending_upload') {
                                            return (
                                                <Button
                                                    className="btn-primary animate-pulse"
                                                    onClick={() => navigate('/contests')}
                                                >
                                                    Upload Entry (Go to My Contests)
                                                </Button>
                                            );
                                        } else {
                                            return <Button disabled className="bg-green-500/20 text-green-300 border-green-500/30">Already Joined</Button>;
                                        }
                                    })()
                                ) : (
                                    <Button
                                        size="lg"
                                        className="btn-primary shadow-xl shadow-purple-500/20"
                                        onClick={handleJoinClick}
                                        disabled={isOwner} // Creator cannot join
                                    >
                                        {isOwner ? 'You Organized This' : 'Join Contest'}
                                    </Button>
                                )}             </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* User Submission Display */}
                        {myEntry && (
                            <Card className="glass-card border-l-4 border-l-purple-500">
                                <CardHeader>
                                    <CardTitle className="text-white flex justify-between items-center">
                                        <span className="flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-purple-400" />
                                            My Submission
                                        </span>
                                        <div className="flex gap-2">
                                            {myEntry.payment_status === 'approved' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-purple-400 text-purple-300 hover:bg-purple-500/20"
                                                    onClick={() => navigate(`/contests?editEntry=${myEntry.id}`)}
                                                >
                                                    Edit Submission
                                                </Button>
                                            )}
                                            <Badge variant={myEntry.payment_status === 'approved' ? 'default' : 'secondary'}
                                                className={`${myEntry.payment_status === 'approved' ? 'bg-green-500' : 'bg-yellow-500 text-yellow-900'}`}>
                                                {myEntry.payment_status === 'approved' ? (myEntry.media_url === 'pending_upload' ? 'Approved - Upload Needed' : 'Submitted') : 'Verifying Payment'}
                                            </Badge>
                                        </div>
                                    </CardTitle>

                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{myEntry.title}</h3>
                                        <p className="text-slate-300 italic">{myEntry.caption}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Payment Proof */}
                                        <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                                            <p className="text-xs text-slate-500 uppercase mb-2">Payment Proof</p>
                                            <div className="h-32 rounded bg-black/50 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(myEntry.payment_screenshot, '_blank')}>
                                                <img src={myEntry.payment_screenshot} alt="Payment" className="h-full object-contain" />
                                            </div>
                                        </div>

                                        {/* Entry Media */}
                                        {myEntry.media_url !== 'pending_upload' && (
                                            <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                                                <p className="text-xs text-slate-500 uppercase mb-2">Submission Media</p>
                                                {/* Logic to show different media types */}
                                                <div className="h-48 rounded bg-black/50 overflow-y-auto custom-scrollbar p-1">
                                                    {myEntry.media_type === 'video' ? (
                                                        <div className="relative group cursor-pointer" onClick={() => openMedia(myEntry.media_url, 'video')}>
                                                            <video src={myEntry.media_url} className="w-full rounded object-contain" />
                                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                                                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        myEntry.media_type === 'image' && (!myEntry.media_urls || myEntry.media_urls.length <= 1) ? (
                                                            <img
                                                                src={myEntry.media_url}
                                                                alt="Entry"
                                                                className="w-full h-full object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => openMedia(myEntry.media_url, 'image')}
                                                            />
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {/* Show all images in scrollable grid, checking for video type */}
                                                                {(myEntry.media_urls || [myEntry.media_url]).map((url, i) => {
                                                                    const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
                                                                    if (isVideo) {
                                                                        return (
                                                                            <div key={i} className="relative group cursor-pointer h-32 rounded-sm overflow-hidden border border-white/10 hover:border-purple-500/50 transition-colors" onClick={() => openMedia(url, 'video')}>
                                                                                <video src={url} className="w-full h-full object-cover" muted />
                                                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                                                                                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                                                                        <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">Storage</div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <img
                                                                            key={i}
                                                                            src={url}
                                                                            className="w-full h-32 object-cover rounded-sm border border-white/10 cursor-pointer hover:scale-[1.02] transition-transform"
                                                                            onClick={() => openMedia(url, 'image')}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        )
                                                    )}
                                                </div>

                                            </div>
                                        )}

                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="glass-card p-8 rounded-2xl space-y-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="w-5 h-5 text-purple-400" />
                                <h2 className="text-2xl font-bold text-white">About the Contest</h2>
                            </div>
                            <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
                                {contest.description}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                                    <h3 className="text-purple-300 font-semibold mb-1">Theme</h3>
                                    <p className="text-white">Design Indowestern Style</p>
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                    <h3 className="text-blue-300 font-semibold mb-1">Format</h3>
                                    <p className="text-white">Online Submission</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-8 rounded-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6">Rules & Guidelines</h2>
                            <div className="prose prose-invert max-w-none text-slate-300">
                                {contest.rules ? (
                                    <div className="whitespace-pre-wrap">{contest.rules}</div>
                                ) : (
                                    <ul className="list-disc pl-5 space-y-2">
                                        <li>Topic - Indo - Western Style</li>
                                        <li>Anyone can compete</li>
                                        <li>Round 1: Online Submission</li>
                                        <li>Last date to submit: {format(new Date(contest.end_date), 'do MMMM, yyyy')}</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="glass-card border-l-4 border-l-green-500">
                            <CardHeader>
                                <CardTitle className="text-white">Contest Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <Trophy className="w-4 h-4" /> Prize Pool
                                    </span>
                                    <span className="text-xl font-bold text-green-400">₹{contest.prize_pool}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" /> Entry Fee
                                    </span>
                                    <span className="text-xl font-bold text-white">₹{contest.entry_fee}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Max Entries
                                    </span>
                                    <span className="font-medium text-white">{contest.max_participants}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-slate-400 flex items-center gap-2">
                                        Media Type
                                    </span>
                                    <span className="font-medium text-purple-300 capitalize">{contest.media_type}</span>
                                </div>
                                {(contest.media_type === 'image' || contest.media_type === 'both') && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-slate-400">Max Photos/Entry</span>
                                        <span className="font-medium text-white">{contest.max_photos_per_entry || contest.settings?.max_photos_per_entry || 3}</span>
                                    </div>
                                )}
                                {contest.media_type === 'both' && (
                                    <>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-slate-400">Required Photos</span>
                                            <span className="font-medium text-white">{contest.required_photos || contest.settings?.required_photos || 1}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-slate-400">Required Videos</span>
                                            <span className="font-medium text-white">{contest.required_videos || contest.settings?.required_videos || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-slate-400">Max Videos/Entry</span>
                                            <span className="font-medium text-white">{contest.max_videos_allowed || contest.settings?.max_videos_allowed || 1}</span>
                                        </div>
                                    </>
                                )}

                            </CardContent>
                        </Card>

                        {/* Countdown or similar can go here */}
                    </div>
                </div>
            </div>
            {/* Media Lightbox Dialog */}
            <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && closeMedia()}>
                <DialogContent className="max-w-4xl bg-black/95 border-slate-800 p-0 overflow-hidden flex items-center justify-center">
                    <button
                        onClick={closeMedia}
                        className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="w-full h-full max-h-[90vh] flex items-center justify-center p-4">
                        {mediaType === 'video' ? (
                            <video
                                src={selectedMedia}
                                controls
                                autoPlay
                                className="max-w-full max-h-full rounded-lg"
                            />
                        ) : (
                            <img
                                src={selectedMedia}
                                alt="Full View"
                                className="max-w-full max-h-full object-contain rounded-lg"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );

}

function DollarSign({ className }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
}
