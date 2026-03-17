import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Contest } from "@/entities/Contest";
import { Entry } from "@/entities/Entry"; // Import Entry to check status
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    X,
    Pencil,
    Check
} from "lucide-react";

import { format } from "date-fns";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import parse from "html-react-parser";
export default function ContestDetails() {
    const { contestId } = useParams();
    const navigate = useNavigate();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [myEntry, setMyEntry] = useState(null);
    const [participantsCount, setParticipantsCount] = useState(0);

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

    // Editing State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editDescription, setEditDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleEditTitle = () => {
        setEditTitle(contest.title);
        setIsEditingTitle(true);
    };

    const handleSaveTitle = async () => {
        if (!editTitle.trim() || editTitle === contest.title) {
            setIsEditingTitle(false);
            return;
        }
        setIsSaving(true);
        try {
            await Contest.update(contest.id, { title: editTitle });
            setContest(prev => ({ ...prev, title: editTitle }));
            setIsEditingTitle(false);
        } catch (error) {
            console.error("Failed to update title:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditDescription = () => {
        setEditDescription(contest.description);
        setIsEditingDescription(true);
    };

    const handleSaveDescription = async () => {
        if (!editDescription.trim() || editDescription === contest.description) {
            setIsEditingDescription(false);
            return;
        }
        setIsSaving(true);
        try {
            await Contest.update(contest.id, { description: editDescription });
            setContest(prev => ({ ...prev, description: editDescription }));
            setIsEditingDescription(false);
        } catch (error) {
            console.error("Failed to update description:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Rules State
    const [isEditingRules, setIsEditingRules] = useState(false);
    const [editRules, setEditRules] = useState("");

    // Details State
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editDetails, setEditDetails] = useState({});

    // Dates & Spots State
    const [isEditingHeroStats, setIsEditingHeroStats] = useState(false);
    const [editStartDate, setEditStartDate] = useState("");
    const [editEndDate, setEditEndDate] = useState("");
    const [editMaxParticipants, setEditMaxParticipants] = useState("");

    const handleEditRules = () => {
        setEditRules(contest.rules || "");
        setIsEditingRules(true);
    };

    const handleSaveRules = async () => {
        if (editRules === contest.rules) {
            setIsEditingRules(false);
            return;
        }
        setIsSaving(true);
        try {
            await Contest.update(contest.id, { rules: editRules });
            setContest(prev => ({ ...prev, rules: editRules }));
            setIsEditingRules(false);
        } catch (error) {
            console.error("Failed to update rules:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditDetails = () => {
        setEditDetails({
            prize_pool: contest.prize_pool || 0,
            entry_fee: contest.entry_fee || 0,
            max_participants: contest.max_participants || 500,
            media_type: contest.media_type || 'both',
            max_photos_per_entry: contest.max_photos_per_entry || contest.settings?.max_photos_per_entry || 3,
            required_photos: contest.required_photos || contest.settings?.required_photos || 1,
            required_videos: contest.required_videos || contest.settings?.required_videos || 0,
            max_videos_allowed: contest.max_videos_allowed || contest.settings?.max_videos_allowed || 1,
        });
        setIsEditingDetails(true);
    };

    const handleSaveDetails = async () => {
        setIsSaving(true);
        try {
            await Contest.update(contest.id, editDetails);
            setContest(prev => ({ ...prev, ...editDetails }));
            setIsEditingDetails(false);
        } catch (error) {
            console.error("Failed to update details:", error);
            alert(`Failed to save contest details: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditHeroStats = () => {
        setEditStartDate(format(new Date(contest.start_date || new Date()), "yyyy-MM-dd'T'HH:mm"));
        setEditEndDate(format(new Date(contest.end_date || new Date()), "yyyy-MM-dd'T'HH:mm"));
        setEditMaxParticipants(contest.max_participants || "");
        setIsEditingHeroStats(true);
    };

    const handleSaveHeroStats = async () => {
        setIsSaving(true);
        try {
            const updates = { 
                start_date: new Date(editStartDate).toISOString(), 
                end_date: new Date(editEndDate).toISOString(), 
                max_participants: editMaxParticipants ? parseInt(editMaxParticipants) : null
            };
            await Contest.update(contest.id, updates);
            setContest(prev => ({ ...prev, ...updates }));
            setIsEditingHeroStats(false);
        } catch (error) {
            console.error("Failed to update hero stats:", error);
        } finally {
            setIsSaving(false);
        }
    };


    useEffect(() => {
        loadData();
    }, [contestId]);

    const loadData = async () => {
        try {
            // Fetch contest and all visible entries for it
            const [contestData, allEntries] = await Promise.all([
                Contest.getById(contestId),
                Entry.filter({ contest_id: contestId })
            ]);
            setContest(contestData);
            setParticipantsCount(allEntries.length);

            // Try fetching user. If not logged in, it might fail.
            let userData = null;
            try {
                userData = await User.me();
                setUser(userData);
            } catch (e) {
                // User might not be logged in
            }

            if (userData) {
                // Check if user has already joined
                const myUserEntry = allEntries.find(e => e.user_id === userData.id);
                if (myUserEntry) {
                    setMyEntry(myUserEntry);
                } else {
                    // Fallback to fetch just in case it wasn't returned in the main list
                    const myEntries = await Entry.filter({ user_id: userData.id, contest_id: contestId });
                    if (myEntries.length > 0) {
                        setMyEntry(myEntries[0]);
                    }
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
                                <div className="flex items-center gap-3 mb-2 group">
                                    {isEditingTitle ? (
                                        <div className="flex items-center gap-2 w-full max-w-2xl bg-black/40 p-1 rounded-lg backdrop-blur-sm">
                                            <Input 
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="text-2xl md:text-3xl font-bold text-white bg-transparent border-none focus-visible:ring-1 focus-visible:ring-purple-500 flex-1 h-auto py-1"
                                                autoFocus
                                                disabled={isSaving}
                                            />
                                            <Button size="icon" variant="ghost" className="h-10 w-10 text-green-400 hover:text-green-300 hover:bg-green-400/20 shrink-0" onClick={handleSaveTitle} disabled={isSaving}>
                                                <Check className="h-5 w-5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-10 w-10 text-red-400 hover:text-red-300 hover:bg-red-400/20 shrink-0" onClick={() => setIsEditingTitle(false)} disabled={isSaving}>
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight break-all md:break-words">{contest.title}</h1>
                                            {isOwner && (
                                                <Button size="icon" variant="ghost" className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-white/20 rounded-full shrink-0" onClick={handleEditTitle}>
                                                    <Pencil className="h-5 w-5" />
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-slate-300 relative group/stats">
                                    {isEditingHeroStats ? (
                                        <div className="flex flex-col gap-3 bg-black/60 p-4 rounded-xl backdrop-blur-md border border-white/20 w-fit">
                                            <div className="flex gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">Start Date & Time</label>
                                                    <Input type="datetime-local" value={editStartDate} onChange={e=>setEditStartDate(e.target.value)} className="bg-black/40 border-white/10 text-white w-48" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">End Date & Time</label>
                                                    <Input type="datetime-local" value={editEndDate} onChange={e=>setEditEndDate(e.target.value)} className="bg-black/40 border-white/10 text-white w-48" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-400 mb-1 block">Max Spots (leave empty for infinite)</label>
                                                <Input type="number" value={editMaxParticipants} onChange={e=>setEditMaxParticipants(e.target.value)} className="bg-black/40 border-white/10 text-white w-full" />
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={()=>setIsEditingHeroStats(false)} disabled={isSaving}>Cancel</Button>
                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white" onClick={handleSaveHeroStats} disabled={isSaving}>Save</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-sm font-medium">{format(new Date(contest.start_date), 'MMM d, yyyy h:mm a')} - {format(new Date(contest.end_date), 'MMM d, yyyy h:mm a')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                                                <Users className="w-4 h-4" />
                                                <span className="text-sm font-medium">{participantsCount}/{contest.max_participants || '\u221E'} Spots</span>
                                            </div>
                                            {isOwner && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover/stats:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-white/20 rounded-full shrink-0" onClick={handleEditHeroStats}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </>
                                    )}
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

                        <div className="glass-card p-8 rounded-2xl space-y-6 group/desc">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-purple-400" />
                                    <h2 className="text-2xl font-bold text-white">About the Contest</h2>
                                </div>
                                {isOwner && !isEditingDescription && (
                                    <Button size="sm" variant="ghost" className="opacity-0 group-hover/desc:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-white/10" onClick={handleEditDescription}>
                                        <Pencil className="h-4 w-4 mr-2" /> Edit Details
                                    </Button>
                                )}
                            </div>
                            
                            {isEditingDescription ? (
                                <div className="space-y-3">
                                    <div className="bg-white text-black rounded-lg overflow-hidden [&_.ql-toolbar]:bg-slate-100 [&_.ql-container]:min-h-[200px] [&_.ql-editor]:text-base">
                                        <ReactQuill 
                                            value={editDescription}
                                            onChange={setEditDescription}
                                            theme="snow"
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, 3, false] }],
                                                    [{ 'size': ['small', false, 'large', 'huge'] }],
                                                    ['bold', 'italic', 'underline', 'strike'],
                                                    [{ 'color': [] }, { 'background': [] }],
                                                    [{ 'align': [] }],
                                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                    ['link', 'image'],
                                                    ['clean']
                                                ]
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10" onClick={() => setIsEditingDescription(false)} disabled={isSaving}>
                                            Cancel
                                        </Button>
                                        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2" onClick={handleSaveDescription} disabled={isSaving}>
                                            <Check className="h-4 w-4" /> Save Changes
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-300 leading-relaxed text-lg prose prose-invert max-w-none ql-snow">
                                    <div className="ql-editor p-0">
                                        {/* Handle formatted text safely */}
                                        {contest.description ? parse(contest.description) : ''}
                                    </div>
                                </div>
                            )}

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

                        <div className="glass-card p-8 rounded-2xl group/rules">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Rules & Guidelines</h2>
                                {isOwner && !isEditingRules && (
                                    <Button size="sm" variant="ghost" className="opacity-0 group-hover/rules:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-white/10" onClick={handleEditRules}>
                                        <Pencil className="h-4 w-4 mr-2" /> Edit Rules
                                    </Button>
                                )}
                            </div>
                            {isEditingRules ? (
                                <div className="space-y-3">
                                    <Textarea 
                                        value={editRules}
                                        onChange={(e) => setEditRules(e.target.value)}
                                        className="min-h-[200px] text-slate-300 text-lg bg-black/40 border-slate-700/50 focus-visible:ring-1 focus-visible:ring-purple-500 p-4"
                                        placeholder="Enter rules here... (bullets, etc.)"
                                        disabled={isSaving}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10" onClick={() => setIsEditingRules(false)} disabled={isSaving}>
                                            Cancel
                                        </Button>
                                        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2" onClick={handleSaveRules} disabled={isSaving}>
                                            <Check className="h-4 w-4" /> Save Changes
                                        </Button>
                                    </div>
                                </div>
                            ) : (
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
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card className="glass-card border-l-4 border-l-green-500 group/sidebar">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-white">Contest Details</CardTitle>
                                {isOwner && !isEditingDetails && (
                                    <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover/sidebar:opacity-100 transition-opacity text-slate-300 hover:text-white hover:bg-white/10 rounded-full" onClick={handleEditDetails}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                {isEditingDetails ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-slate-400 mb-1 block">Prize Pool (₹)</label>
                                                <Input type="number" value={editDetails.prize_pool} onChange={e=>setEditDetails({...editDetails, prize_pool: parseInt(e.target.value) || 0})} className="bg-black/40 border-white/10 text-white h-9" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-400 mb-1 block">Entry Fee (₹)</label>
                                                <Input type="number" value={editDetails.entry_fee} onChange={e=>setEditDetails({...editDetails, entry_fee: parseInt(e.target.value) || 0})} className="bg-black/40 border-white/10 text-white h-9" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Max Entries</label>
                                            <Input type="number" value={editDetails.max_participants} onChange={e=>setEditDetails({...editDetails, max_participants: parseInt(e.target.value) || null})} className="bg-black/40 border-white/10 text-white h-9" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Media Type</label>
                                            <select className="flex h-9 w-full rounded-md border border-white/10 bg-black/40 px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500" value={editDetails.media_type} onChange={e=>setEditDetails({...editDetails, media_type:e.target.value})}>
                                                <option value="image">Image</option>
                                                <option value="video">Video</option>
                                                <option value="both">Both</option>
                                            </select>
                                        </div>
                                        {(editDetails.media_type === 'image' || editDetails.media_type === 'both') && (
                                            <div>
                                                <label className="text-xs text-slate-400 mb-1 block">Max Photos/Entry</label>
                                                <Input type="number" value={editDetails.max_photos_per_entry} onChange={e=>setEditDetails({...editDetails, max_photos_per_entry: parseInt(e.target.value) || 1})} className="bg-black/40 border-white/10 text-white h-9" />
                                            </div>
                                        )}
                                        {editDetails.media_type === 'both' && (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-slate-400 mb-1 block">Req. Photos</label>
                                                        <Input type="number" value={editDetails.required_photos} onChange={e=>setEditDetails({...editDetails, required_photos: parseInt(e.target.value) || 1})} className="bg-black/40 border-white/10 text-white h-9" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-400 mb-1 block">Req. Videos</label>
                                                        <Input type="number" value={editDetails.required_videos} onChange={e=>setEditDetails({...editDetails, required_videos: parseInt(e.target.value) || 0})} className="bg-black/40 border-white/10 text-white h-9" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 mb-1 block">Max Videos/Entry</label>
                                                    <Input type="number" value={editDetails.max_videos_allowed} onChange={e=>setEditDetails({...editDetails, max_videos_allowed: parseInt(e.target.value) || 1})} className="bg-black/40 border-white/10 text-white h-9" />
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-end gap-2 pt-2">
                                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => setIsEditingDetails(false)} disabled={isSaving}>Cancel</Button>
                                            <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white" onClick={handleSaveDetails} disabled={isSaving}>Save</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
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
