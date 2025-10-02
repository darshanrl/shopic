import React, { useState, useEffect } from "react";
import { Contest } from "@/entities/Contest";
import { Entry } from "@/entities/Entry";
import { User } from "@/entities/User";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Users, 
  Award,
  Camera,
  Play,
  Heart,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Dashboard() {
  const [contests, setContests] = useState([]);
  const [entries, setEntries] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [contestsData, entriesData, userData] = await Promise.all([
        Contest.list('-created_date', 6),
        Entry.list('-created_date', 8),
        User.me()
      ]);
      
      setContests(contestsData);
      setEntries(entriesData);
      setUser(userData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Welcome to <span className="gradient-text">ShoPic</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl">
              Showcase your creativity, join exciting contests, and win amazing prizes
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {user && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card card-hover gradient-border">
              <div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Balance</p>
                      <p className="text-2xl font-bold text-green-400">₹{user.account_balance || 0}</p>
                    </div>
                    <Trophy className="w-8 h-8 text-green-400 opacity-70 floating-animation" />
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card className="glass-card card-hover gradient-border">
              <div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Contests Won</p>
                      <p className="text-2xl font-bold text-purple-400">{user.contests_won || 0}</p>
                    </div>
                    <Award className="w-8 h-8 text-purple-400 opacity-70 floating-animation" />
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card className="glass-card card-hover gradient-border">
              <div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Contests Joined</p>
                      <p className="text-2xl font-bold text-blue-400">{user.contests_joined || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-400 opacity-70 floating-animation" />
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card className="glass-card card-hover gradient-border">
              <div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Earnings</p>
                      <p className="text-2xl font-bold text-pink-400">₹{user.total_earnings || 0}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-pink-400 opacity-70 floating-animation" />
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Featured Contests */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Featured Contests</h2>
              <Link to={createPageUrl("Contests")}>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700/50">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6">
              {contests.slice(0, 3).map((contest) => (
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
                    <p className="text-slate-400 mb-4 line-clamp-2">{contest.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(contest.end_date), 'MMM d')}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-green-400">
                          <Trophy className="w-4 h-4" />
                          ₹{contest.prize_pool}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        ₹{contest.entry_fee}
                      </Badge>
                    </div>

                     <Link to={createPageUrl("Contests")}>
                       <Button className="w-full btn-primary">
                         Join Contest
                       </Button>
                     </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Submissions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Trending Posts</h2>
              <Link to={createPageUrl("Feed")}>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700/50">
                  View Feed <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {entries.slice(0, 6).map((entry) => (
                <Card key={entry.id} className="glass-effect border-slate-700/50 group hover:border-purple-500/30 transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="relative">
                        <img 
                          src={entry.media_url || `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&h=100&fit=crop`}
                          alt={entry.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        {entry.media_type === 'video' && (
                          <Play className="w-4 h-4 text-white absolute inset-0 m-auto bg-black/50 rounded-full p-0.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm mb-1">{entry.title}</h4>
                        <p className="text-slate-400 text-xs mb-2 line-clamp-2">{entry.caption}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {entry.likes_count || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {entry.comments_count || 0}
                          </div>
                          <Badge size="sm" className={`${entry.media_type === 'video' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                            {entry.media_type === 'video' ? <Play className="w-3 h-3 mr-1" /> : <Camera className="w-3 h-3 mr-1" />}
                            {entry.media_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}