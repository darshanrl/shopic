import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Entry } from "@/entities/Entry";
import { Certificate } from "@/entities/Certificate";
import { Contest } from "@/entities/Contest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  User as UserIcon, 
  Trophy, 
  Wallet, 
  Download, 
  Edit3,
  Camera,
  Play,
  Award,
  Calendar,
  Heart,
  MessageCircle,
  Settings
} from "lucide-react";
import { format } from "date-fns";

const safeFormatDate = (value, fmt = 'MMM d, yyyy') => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  try { return format(d, fmt); } catch { return '' }
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setEditForm(userData);

      const [entriesData, certificatesData, contestsData] = await Promise.all([
        Entry.filter({ user_id: userData.id }),
        Certificate.list(userData.id),
        Contest.list()
      ]);

      setEntries(entriesData);
      setCertificates(certificatesData);
      setContests(contestsData);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    try {
      await User.updateMyUserData(editForm);
      setUser({ ...user, ...editForm });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getContestTitle = (contestId) => {
    const contest = contests.find(c => c.id === contestId);
    return contest?.title || 'Unknown Contest';
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.reload();
  };

  const downloadCertificate = async (certificateId) => {
    try {
      const url = await Certificate.download(certificateId);
      if (!url) {
        alert('Certificate file is not available yet. Please try again later.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Certificate download error:', e);
      alert(e?.message || 'Failed to download certificate.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect border-slate-700/50 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to ShoPic</h2>
          <p className="text-slate-300 mb-6">Sign in to access your profile and join contests</p>
          <Button 
            onClick={() => User.login()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <Card className="glass-effect border-slate-700/50 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {user.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">{user.full_name}</h1>
                <p className="text-slate-300 mb-1">{user.email}</p>
                {user.college_name && (
                  <p className="text-slate-400">{user.college_name}</p>
                )}
                {user.bio && (
                  <p className="text-slate-300 mt-2">{user.bio}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(true)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">₹{user.account_balance || 0}</div>
                <div className="text-slate-400 text-sm">Balance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{user.contests_won || 0}</div>
                <div className="text-slate-400 text-sm">Contests Won</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{user.contests_joined || 0}</div>
                <div className="text-slate-400 text-sm">Contests Joined</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">₹{user.total_earnings || 0}</div>
                <div className="text-slate-400 text-sm">Total Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="entries" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="entries" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Camera className="w-4 h-4 mr-2" />
              My Entries ({entries.length})
            </TabsTrigger>
            <TabsTrigger value="certificates" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-300">
              <Award className="w-4 h-4 mr-2" />
              Certificates ({certificates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entries">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entries.map((entry) => (
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
                    <p className="text-sm text-slate-400 mb-2">{getContestTitle(entry.contest_id)}</p>
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
                        {(() => {
                          const d = new Date(entry.created_at || entry.created_date || entry.created || Date.now());
                          try { return format(d, 'MMM d'); } catch { return '' }
                        })()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {entries.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No entries yet</h3>
                  <p className="text-slate-400">Join a contest and showcase your creativity!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certificates">
            <div className="grid md:grid-cols-2 gap-6">
              {certificates.map((certificate) => (
                <Card key={certificate.id} className="glass-effect border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-400" />
                        <div>
                          <h3 className="font-semibold text-white">
                            {certificate.position === 1 ? '1st Place' : 
                             certificate.position === 2 ? '2nd Place' : '3rd Place'}
                          </h3>
                          <p className="text-slate-400 text-sm">
                            {getContestTitle(certificate.contest_id)}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        Winner
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Prize Amount</span>
                        <span className="text-green-400 font-semibold">₹{certificate.prize_amount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Date Awarded</span>
                        <span className="text-white">{safeFormatDate(certificate.created_at || certificate.created_date, 'MMM d, yyyy')}</span>
                      </div>
                    </div>

                    <Button onClick={() => downloadCertificate(certificate.id)} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      <Download className="w-4 h-4 mr-2" />
                      Download Certificate
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {certificates.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No certificates yet</h3>
                  <p className="text-slate-400">Win contests to earn certificates!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Profile Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl gradient-text">Edit Profile</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editForm.full_name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="college_name">College/University</Label>
                <Input
                  id="college_name"
                  value={editForm.college_name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, college_name: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={editForm.date_of_birth || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={editForm.phone_number || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                onClick={handleUpdateProfile}
              >
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}