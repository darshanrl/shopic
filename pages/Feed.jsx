import React, { useState, useEffect } from "react";
import { Entry } from "@/entities/Entry";
import { Like } from "@/entities/Like";
import { Comment } from "@/entities/Comment";
import { Contest } from "@/entities/Contest";
import { User } from "@/entities/User";
import { useAuth } from "@/src/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  Share2,
  Play,
  Camera,
  TrendingUp,
  Clock,
  Send,
  MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Feed() {
  const [entries, setEntries] = useState([]);
  const [contests, setContests] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('latest');
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const { isAdmin } = useAuth ? useAuth() : { isAdmin: false };
  const navigate = useNavigate();

  useEffect(() => {
    loadFeedData();
  }, []);

  const loadFeedData = async () => {
    try {
      const [entriesData, contestsData, userData, likesData, allUsersData] = await Promise.all([
        Entry.list(), // Show all entries for now to see uploads
        Contest.list(),
        User.me().catch(() => null),
        Like.list(),
        User.list()
      ]);
      
      setEntries(entriesData);
      setContests(contestsData);
      setUser(userData);
      setUsers(allUsersData);
      setLikes(likesData);

      // Load comments for each entry
      const commentPromises = entriesData.map(async (entry) => {
        const entryComments = await Comment.filter({ entry_id: entry.id });
        return { [entry.id]: entryComments };
      });
      
      const commentResults = await Promise.all(commentPromises);
      const commentsMap = commentResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setComments(commentsMap);
      
    } catch (error) {
      console.error('Error loading feed:', error);
    }
    setLoading(false);
  };

  const getUserInfoByEmail = (email) => {
    return users.find(u => u.email === email);
  };

  const getContestTitle = (contestId) => {
    const contest = contests.find(c => c.id === contestId);
    return contest?.title || 'Unknown Contest';
  };

  const isLikedByUser = (entryId) => {
    return likes.some(like => like.entry_id === entryId && like.user_id === user?.id);
  };

  const handleLike = async (entryId) => {
    if (!user) {
      User.login();
      return;
    }

    try {
      const existingLike = likes.find(like => 
        like.entry_id === entryId && like.user_id === user.id
      );

      if (existingLike) {
        // Unlike
        await Like.delete(existingLike.id);
        setLikes(prev => prev.filter(like => like.id !== existingLike.id));
      } else {
        // Like
        const newLike = await Like.create({
          entry_id: entryId,
          user_id: user.id
        });
        setLikes(prev => [...prev, newLike]);
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleComment = async (entryId) => {
    if (!user || !newComment[entryId]) {
      return;
    }

    try {
      const comment = await Comment.create({
        entry_id: entryId,
        user_id: user.id,
        content: newComment[entryId]
      });

      setComments(prev => ({
        ...prev,
        [entryId]: [...(prev[entryId] || []), comment]
      }));

      setNewComment(prev => ({ ...prev, [entryId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeleteComment = async (entryId, commentId) => {
    try {
      await Comment.delete(commentId);
      setComments(prev => ({
        ...prev,
        [entryId]: (prev[entryId] || []).filter(c => c.id !== commentId)
      }));
    } catch (e) {
      console.error('Delete comment failed:', e);
      alert(e?.message || 'Failed to delete comment');
    }
  };

  const handleEditEntry = async (entry) => {
    try {
      const newTitle = window.prompt('Update title', entry.title || '');
      if (newTitle === null) return;
      const newCaption = window.prompt('Update caption', entry.caption || '');
      if (newCaption === null) return;
      const updated = await Entry.update(entry.id, { title: newTitle, caption: newCaption });
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ...updated } : e));
    } catch (e) {
      console.error('Update entry failed:', e);
      alert(e?.message || 'Failed to update entry');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;
    try {
      await Entry.delete(entryId);
      setEntries(prev => prev.filter(e => e.id !== entryId));
      setComments(prev => {
        const newMap = { ...prev };
        delete newMap[entryId];
        return newMap;
      });
    } catch (e) {
      console.error('Delete entry failed:', e);
      alert(e?.message || 'Failed to delete entry');
    }
  };

  const sortedEntries = () => {
    switch (activeTab) {
      case 'trending':
        return [...entries].sort((a, b) => 
          (b.likes_count || 0) + (b.comments_count || 0) - 
          (a.likes_count || 0) - (a.comments_count || 0)
        );
      case 'images':
        return entries.filter(entry => entry.media_type === 'image');
      case 'videos':
        return entries.filter(entry => entry.media_type === 'video');
      default:
        return entries;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">Loading feed...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Creative Feed</h1>
          <p className="text-xl text-slate-300">Discover amazing creations from our community</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="latest" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Clock className="w-4 h-4 mr-2" />
              Latest
            </TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
              <Camera className="w-4 h-4 mr-2" />
              Images
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300">
              <Play className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
          </TabsList>

          {['latest', 'trending', 'images', 'videos'].map(tab => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-6">
                {sortedEntries().length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">No entries found</h3>
                    <p className="text-slate-400">Be the first to share your creative work!</p>
                  </div>
                ) : sortedEntries().map((entry) => {
                  // Find user by user_id instead of email
                  const entryUser = users.find(u => u.id === entry.user_id);
                  const entryUserName = entryUser?.full_name || entryUser?.email?.split('@')[0] || 'Unknown User';
                  const entryUserInitial = entryUserName?.[0]?.toUpperCase() || 'U';

                  return (
                    <Card key={entry.id} className="glass-effect border-slate-700/50 overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => navigate(`/profile/${entry.user_id}`)} className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center hover:opacity-90">
                            <span className="text-white font-semibold text-sm">
                              {entryUserInitial}
                            </span>
                          </button>
                          <div>
                            <h3 className="font-semibold text-white">{entry.title}</h3>
                            <p className="text-sm text-slate-400">
                              by <button type="button" onClick={() => navigate(`/profile/${entry.user_id}`)} className="font-medium text-slate-200 hover:underline">
                                {entryUserName}
                              </button> in {getContestTitle(entry.contest_id)}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          className={`${entry.media_type === 'video' 
                            ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}
                        >
                          {entry.media_type === 'video' ? <Play className="w-3 h-3 mr-1" /> : <Camera className="w-3 h-3 mr-1" />}
                          {entry.media_type}
                        </Badge>
                      </div>
                    </CardHeader>

                    <div className="relative">
                      {entry.media_type === 'video' ? (
                        <video 
                          controls 
                          className="w-full max-h-96 object-contain bg-black"
                          poster={entry.media_url}
                        >
                          <source src={entry.media_url} type="video/mp4" />
                        </video>
                      ) : (
                        <img 
                          src={entry.media_url || `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=400&fit=crop`}
                          alt={entry.title}
                          className="w-full max-h-96 object-contain bg-slate-800"
                        />
                      )}
                    </div>

                    <CardContent className="p-6">
                      <p className="text-slate-300 mb-4">{entry.caption}</p>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLike(entry.id)}
                            className={`gap-2 ${isLikedByUser(entry.id) ? 'text-red-400' : 'text-slate-400'}`}
                          >
                            <Heart className={`w-5 h-5 ${isLikedByUser(entry.id) ? 'fill-current' : ''}`} />
                            {likes.filter(like => like.entry_id === entry.id).length}
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2 text-slate-400">
                            <MessageCircle className="w-5 h-5" />
                            {comments[entry.id]?.length || 0}
                          </Button>
                          {(user?.id === entry.user_id || isAdmin) && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleEditEntry(entry)} className="text-slate-300 border-slate-600">Edit</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteEntry(entry.id)}>Delete</Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Comments section */}
                      <div className="space-y-3">
                        {comments[entry.id]?.slice(0, 2).map((comment) => {
                          const commentUser = users.find(u => u.id === comment.user_id);
                          const userName = commentUser?.full_name || commentUser?.email?.split('@')[0] || 'Unknown User';
                          const userInitial = userName?.[0]?.toUpperCase() || 'U';
                          const canDeleteComment = user?.id === comment.user_id || isAdmin;

                          return (
                            <div key={comment.id} className="flex items-start gap-2 text-sm">
                              <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">
                                  {userInitial}
                                </span>
                              </div>
                              <div className="flex-1">
                                <button type="button" onClick={() => navigate(`/profile/${comment.user_id}`)} className="text-white font-medium hover:underline">{userName}</button>
                                <span className="text-slate-300 ml-2">{comment.content}</span>
                              </div>
                              {canDeleteComment && (
                                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDeleteComment(entry.id, comment.id)}>Delete</Button>
                              )}
                            </div>
                          )
                        })}

                        {user && (
                          <div className="flex items-center gap-2 mt-4">
                            <Input
                              placeholder="Add a comment..."
                              value={newComment[entry.id] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [entry.id]: e.target.value }))}
                              className="bg-slate-800 border-slate-600 text-white flex-1"
                              onKeyPress={(e) => e.key === 'Enter' && handleComment(entry.id)}
                            />
                            <Button
                              size="icon"
                              onClick={() => handleComment(entry.id)}
                              disabled={!newComment[entry.id]}
                              className="bg-purple-500 hover:bg-purple-600"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {!user && (
          <div className="text-center py-8">
            <p className="text-slate-300 mb-4">Sign in to like and comment on posts</p>
            <Button 
              onClick={() => User.login()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}