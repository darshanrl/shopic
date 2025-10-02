import React, { useState, useEffect } from "react";
import { Contest } from "@/entities/Contest";
import { Entry } from "@/entities/Entry";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search as SearchIcon, 
  Trophy, 
  Camera, 
  Play, 
  Calendar,
  Heart,
  MessageCircle,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { Link, createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contests, setContests] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [contestsData, entriesData] = await Promise.all([
        Contest.list('-created_date'),
        Entry.list('-created_date', 50)
      ]);
      
      setContests(contestsData);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const filterResults = () => {
    if (!searchQuery.trim()) {
      return { contests, entries };
    }

    const query = searchQuery.toLowerCase();
    
    const filteredContests = contests.filter(contest =>
      contest.title.toLowerCase().includes(query) ||
      contest.description.toLowerCase().includes(query) ||
      contest.category.toLowerCase().includes(query)
    );

    const filteredEntries = entries.filter(entry =>
      entry.title?.toLowerCase().includes(query) ||
      entry.caption?.toLowerCase().includes(query) ||
      (entry.created_by && entry.created_by.toLowerCase().includes(query))
    );

    return { contests: filteredContests, entries: filteredEntries };
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

  const { contests: filteredContests, entries: filteredEntries } = filterResults();

  const openContestDetail = async (contest) => {
    setSelectedContest(contest);
    setDetailOpen(true);
    setParticipantsLoading(true);
    try {
      const contestEntries = await Entry.filter({ contest_id: contest.id });
      setParticipantsCount(contestEntries?.length || 0);
    } catch (e) {
      setParticipantsCount(0);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const joinContestFromDetail = () => {
    if (!selectedContest) return;
    navigate(`/contests?join=${selectedContest.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Search & Discovery</h1>
          <p className="text-xl text-slate-300">Find contests, creators, and amazing content</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for contests, creators, or content..."
            className="pl-12 pr-4 py-6 text-lg bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 focus:border-purple-500"
          />
          <Button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            size="sm"
          >
            Search
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              All Results
            </TabsTrigger>
            <TabsTrigger value="contests" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
              <Trophy className="w-4 h-4 mr-2" />
              Contests ({filteredContests.length})
            </TabsTrigger>
            <TabsTrigger value="entries" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300">
              <Camera className="w-4 h-4 mr-2" />
              Entries ({filteredEntries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-8">
              {/* Quick Contest Results */}
              {filteredContests.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Contests</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContests.slice(0, 6).map((contest) => (
                      <Card key={contest.id} className="glass-effect border-slate-700/50 group hover:border-purple-500/50 transition-all duration-300">
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img 
                            src={contest.banner_image || `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=300&fit=crop`}
                            alt={contest.title}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <Badge className={`absolute top-2 right-2 ${getStatusColor(getContestStatus(contest))}`}>
                            {getContestStatus(contest)}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-bold text-white mb-1">{contest.title}</h3>
                          <p className="text-slate-400 text-sm mb-2 line-clamp-2">{contest.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="border-slate-600 text-slate-300">
                              ₹{contest.entry_fee}
                            </Badge>
                            <span className="text-green-400 font-semibold text-sm">₹{contest.prize_pool}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Entry Results */}
              {filteredEntries.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Creative Entries</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredEntries.slice(0, 8).map((entry) => (
                      <Card key={entry.id} className="glass-effect border-slate-700/50 group hover:border-purple-500/30 transition-all duration-300">
                        <div className="relative overflow-hidden rounded-t-lg">
                          {entry.media_type === 'video' ? (
                            <div className="relative aspect-square bg-slate-800">
                              <video 
                                src={entry.media_url}
                                className="w-full h-full object-cover"
                              />
                              <Play className="absolute inset-0 m-auto w-8 h-8 text-white bg-black/50 rounded-full p-2" />
                            </div>
                          ) : (
                            <img 
                              src={entry.media_url || `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop`}
                              alt={entry.title}
                              className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          <Badge 
                            className={`absolute top-2 right-2 ${entry.media_type === 'video' 
                              ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}
                          >
                            {entry.media_type === 'video' ? <Play className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                          </Badge>
                        </div>
                        <CardContent className="p-3">
                          <h4 className="font-semibold text-white text-sm mb-1 line-clamp-1">{entry.title}</h4>
                          <p className="text-slate-400 text-xs mb-2">{entry.created_by || 'Unknown User'}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {entry.likes_count || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {entry.comments_count || 0}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && filteredContests.length === 0 && filteredEntries.length === 0 && (
                <div className="text-center py-12">
                  <SearchIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No results found</h3>
                  <p className="text-slate-400">Try different keywords or browse all content</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contests">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContests.map((contest) => (
                <Card key={contest.id} className="glass-effect border-slate-700/50 group hover:border-purple-500/50 transition-all duration-300">
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

                    <Button onClick={() => openContestDetail(contest)} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      View Contest
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="entries">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="glass-effect border-slate-700/50 overflow-hidden group">
                  <div className="relative">
                    {entry.media_type === 'video' ? (
                      <div className="relative aspect-video bg-slate-800">
                        <video 
                          src={entry.media_url}
                          className="w-full h-full object-cover"
                        />
                        <Play className="absolute inset-0 m-auto w-12 h-12 text-white bg-black/50 rounded-full p-3" />
                      </div>
                    ) : (
                      <img 
                        src={entry.media_url || `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop`}
                        alt={entry.title}
                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <Badge 
                      className={`absolute top-3 right-3 ${entry.media_type === 'video' 
                        ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'}`}
                    >
                      {entry.media_type === 'video' ? <Play className="w-3 h-3 mr-1" /> : <Camera className="w-3 h-3 mr-1" />}
                      {entry.media_type}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-1">{entry.title}</h3>
                    <p className="text-sm text-slate-400 mb-2">by {entry.created_by || 'Unknown User'}</p>
                    <p className="text-slate-300 text-sm mb-3 line-clamp-2">{entry.caption}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-slate-400">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {entry.likes_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {entry.comments_count || 0}
                        </div>
                      </div>
                      <span className="text-slate-400">
                        {entry.created_date ? format(new Date(entry.created_date), 'MMM d') : 'Recent'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Contest Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedContest?.title}</DialogTitle>
            </DialogHeader>
            {selectedContest && (
              <div className="space-y-4">
                <img
                  src={selectedContest.banner_image || `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&h=300&fit=crop`}
                  alt={selectedContest.title}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <p className="text-slate-300">{selectedContest.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded bg-white/5 border border-white/10">
                    <div className="text-slate-400">Entry Fee</div>
                    <div className="text-white font-semibold">₹{selectedContest.entry_fee}</div>
                  </div>
                  <div className="p-3 rounded bg-white/5 border border-white/10">
                    <div className="text-slate-400">Prize Pool</div>
                    <div className="text-green-400 font-semibold">₹{selectedContest.prize_pool}</div>
                  </div>
                  <div className="p-3 rounded bg-white/5 border border-white/10">
                    <div className="text-slate-400">Participants</div>
                    <div className="text-white font-semibold">{participantsLoading ? '...' : participantsCount}</div>
                  </div>
                  <div className="p-3 rounded bg-white/5 border border-white/10">
                    <div className="text-slate-400">Capacity</div>
                    <div className="text-white font-semibold">{selectedContest.max_participants || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded bg-white/5 border border-white/10">
                    <div className="text-slate-400">Starts</div>
                    <div className="text-white">{format(new Date(selectedContest.start_date), 'PPp')}</div>
                  </div>
                  <div className="p-3 rounded bg-white/5 border border-white/10">
                    <div className="text-slate-400">Ends</div>
                    <div className="text-white">{format(new Date(selectedContest.end_date), 'PPp')}</div>
                  </div>
                </div>
                <Button onClick={joinContestFromDetail} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Join Contest
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {!searchQuery && (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Start exploring</h3>
            <p className="text-slate-400">Search for contests, creators, and creative content</p>
          </div>
        )}
      </div>
    </div>
  );
}