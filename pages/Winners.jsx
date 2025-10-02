import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Entry } from "@/entities/Entry";
import { Contest } from "@/entities/Contest";
import { Certificate } from "@/entities/Certificate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  Star,
  Calendar,
  DollarSign,
  User as UserIcon,
  ExternalLink,
  Settings,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Upload,
  Download,
  X
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAdmin } from "@/src/hooks/useAdmin";

export default function Winners() {
  const [certificates, setCertificates] = useState([]);
  const [contests, setContests] = useState([]);
  const [users, setUsers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showManagement, setShowManagement] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertificateUpload, setShowCertificateUpload] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    loadWinnersData();
  }, []);

  const loadWinnersData = async () => {
    try {
      const [certificatesData, contestsData, usersData, entriesData] = await Promise.all([
        Certificate.list(),
        Contest.list(),
        User.list(),
        Entry.list()
      ]);
      
      setCertificates(certificatesData);
      setContests(contestsData);
      setUsers(usersData);
      setEntries(entriesData);
    } catch (error) {
      console.error('Error loading winners data:', error);
    }
    setLoading(false);
  };

  const getContestTitle = (contestId) => {
    const contest = contests.find(c => c.id === contestId);
    return contest?.title || 'Unknown Contest';
  };

  const getUserInfo = (userId) => {
    return users.find(u => u.id === userId);
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <Trophy className="w-6 h-6 text-purple-400" />;
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1: return 'from-yellow-500 to-amber-500';
      case 2: return 'from-gray-400 to-slate-500';
      case 3: return 'from-amber-600 to-orange-600';
      default: return 'from-purple-500 to-pink-500';
    }
  };

  const getPositionText = (position) => {
    switch (position) {
      case 1: return '1st Place';
      case 2: return '2nd Place';
      case 3: return '3rd Place';
      default: return `${position}th Place`;
    }
  };

  const groupedCertificates = certificates.reduce((acc, cert) => {
    const contestId = cert.contest_id;
    if (!acc[contestId]) {
      acc[contestId] = [];
    }
    acc[contestId].push(cert);
    return acc;
  }, {});

  // Sort certificates by position within each contest
  Object.keys(groupedCertificates).forEach(contestId => {
    groupedCertificates[contestId].sort((a, b) => a.position - b.position);
  });

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleDeleteWinner = async (certificateId) => {
    if (!confirm('Are you sure you want to remove this winner? This action cannot be undone.')) {
      return;
    }

    try {
      await Certificate.delete(certificateId);
      await loadWinnersData();
      alert('Winner removed successfully!');
    } catch (error) {
      console.error('Error deleting winner:', error);
      alert('Error removing winner. Please try again.');
    }
  };

  const handleCertificateUpload = async (file) => {
    if (!selectedCertificate || !file) return;

    setUploadingCertificate(true);
    try {
      // Upload certificate file
      const { UploadFile } = await import('@/integrations/Core.js');
      const { file_url } = await UploadFile({ file, category: 'certificates' });

      // Update certificate with URL
      await Certificate.update(selectedCertificate.id, {
        certificate_url: file_url
      });

      await loadWinnersData();
      setShowCertificateUpload(false);
      setSelectedCertificate(null);
      alert('Certificate uploaded successfully!');
    } catch (error) {
      console.error('Error uploading certificate:', error);
      alert('Error uploading certificate. Please try again.');
    }
    setUploadingCertificate(false);
  };

  const handleCreateWinner = async (contestId, entryId, position, prizeAmount) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) {
        alert('Entry not found');
        return;
      }

      const certificateData = {
        user_id: entry.user_id,
        contest_id: contestId,
        entry_id: entryId,
        position: position,
        prize_amount: prizeAmount
      };

      await Certificate.create(certificateData);
      
      // Update user's total earnings
      await User.updateTotalEarnings(entry.user_id);
      
      // Reload data to show new winner
      await loadWinnersData();
      
      alert(`Winner created successfully! Position: ${position}, Prize: ₹${prizeAmount}`);
    } catch (error) {
      console.error('Error creating winner:', error);
      alert('Error creating winner. Please try again.');
    }
  };

  const getContestEntries = (contestId) => {
    return entries.filter(entry => entry.contest_id === contestId);
  };

  const getContestsWithoutWinners = () => {
    const contestsWithWinners = [...new Set(certificates.map(cert => cert.contest_id))];
    return contests.filter(contest => !contestsWithWinners.includes(contest.id));
  };

  const getContestWinners = (contestId) => {
    return certificates.filter(cert => cert.contest_id === contestId);
  };

  const isEntryAlreadyWinner = (contestId, entryId) => {
    const contestWinners = getContestWinners(contestId);
    return contestWinners.some(winner => winner.entry_id === entryId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">Loading winners...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
                <Trophy className="w-10 h-10 text-yellow-400" />
                Contest Winners
              </h1>
              <p className="text-xl text-slate-300">Celebrating our creative champions and their achievements</p>
            </div>
            {isAdmin && (
              <Button 
                onClick={() => setShowManagement(!showManagement)}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                {showManagement ? 'Hide Management' : 'Manage Winners'}
              </Button>
            )}
          </div>
        </div>

        {showManagement && isAdmin && (
          <Card className="glass-effect border-slate-700/50 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Settings className="w-6 h-6 text-purple-400" />
                Winner Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Contest Winner Management</h3>
                  {contests.filter(contest => {
                    const contestWinners = getContestWinners(contest.id);
                    return contestWinners.length < 3; // Show contests with less than 3 winners
                  }).length === 0 ? (
                    <p className="text-slate-400">All contests have full winner sets assigned.</p>
                  ) : (
                    <div className="grid gap-4">
                      {contests.filter(contest => {
                        const contestWinners = getContestWinners(contest.id);
                        return contestWinners.length < 3; // Show contests with less than 3 winners
                      }).map((contest) => {
                        const contestEntries = getContestEntries(contest.id);
                        const contestWinners = getContestWinners(contest.id);
                        const existingPositions = contestWinners.map(w => w.position);
                        
                        return (
                          <Card key={contest.id} className="bg-slate-800/50 border-slate-600/50">
                            <CardContent className="p-4">
                              <h4 className="font-semibold text-white mb-2">{contest.title}</h4>
                              <p className="text-slate-400 text-sm mb-3">
                                {contestEntries.length} entries • Prize Pool: ₹{contest.prize_pool || 0}
                                {contestWinners.length > 0 && (
                                  <span className="ml-2 text-green-400">• {contestWinners.length} winner(s) selected</span>
                                )}
                              </p>
                              {contestEntries.length > 0 ? (
                                <div className="space-y-2">
                                  <p className="text-sm text-slate-300">Select winners:</p>
                                  <div className="grid gap-2">
                                    {[1, 2, 3].map((position) => {
                                      const isPositionTaken = existingPositions.includes(position);
                                      const availableEntries = contestEntries.filter(entry => 
                                        !isEntryAlreadyWinner(contest.id, entry.id)
                                      );
                                      
                                      return (
                                        <div key={position} className="flex items-center gap-2">
                                          <Badge className={`bg-gradient-to-r ${getPositionColor(position)} text-white border-0`}>
                                            {getPositionText(position)}
                                          </Badge>
                                          {isPositionTaken ? (
                                            <div className="flex-1 bg-green-800/30 text-green-300 px-2 py-1 rounded text-sm">
                                              ✓ Winner selected
                                            </div>
                                          ) : (
                                            <select 
                                              className="bg-slate-700 text-white rounded px-2 py-1 text-sm flex-1"
                                              onChange={(e) => {
                                                if (e.target.value) {
                                                  const prizeAmount = position === 1 ? contest.prize_pool * 0.5 : 
                                                                     position === 2 ? contest.prize_pool * 0.3 : 
                                                                     contest.prize_pool * 0.2;
                                                  handleCreateWinner(contest.id, e.target.value, position, Math.floor(prizeAmount));
                                                  e.target.value = ""; // Reset dropdown
                                                }
                                              }}
                                            >
                                              <option value="">Select entry...</option>
                                              {availableEntries.map((entry) => {
                                                const user = getUserInfo(entry.user_id);
                                                return (
                                                  <option key={entry.id} value={entry.id}>
                                                    {entry.title} - {user?.full_name || user?.email || 'Unknown User'}
                                                  </option>
                                                );
                                              })}
                                            </select>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-slate-500 text-sm">No entries for this contest</p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Trophy className="w-4 h-4 mr-2" />
              All Winners
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-300">
              <Star className="w-4 h-4 mr-2" />
              Recent Winners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-8">
              {Object.keys(groupedCertificates).length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No winners yet</h3>
                  <p className="text-slate-400">Contest winners will appear here once contests are completed</p>
                </div>
              ) : (
                Object.keys(groupedCertificates).map((contestId) => {
                  const contestCertificates = groupedCertificates[contestId];
                  const contestTitle = getContestTitle(contestId);
                  
                  return (
                    <Card key={contestId} className="glass-effect border-slate-700/50">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <Award className="w-6 h-6 text-purple-400" />
                          {contestTitle}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                          {contestCertificates.map((certificate) => {
                            const user = getUserInfo(certificate.user_id);
                            const userInitial = user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
                            
                            return (
                              <Card 
                                key={certificate.id} 
                                className={`relative overflow-hidden border-2 border-transparent bg-gradient-to-br ${getPositionColor(certificate.position)}/10 hover:border-${certificate.position === 1 ? 'yellow' : certificate.position === 2 ? 'gray' : 'amber'}-500/50 transition-all duration-300 cursor-pointer group`}
                                onClick={() => handleViewProfile(certificate.user_id)}
                              >
                                <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${getPositionColor(certificate.position)} transform rotate-45 translate-x-6 -translate-y-6`}></div>
                                <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                                  {getPositionIcon(certificate.position)}
                                </div>
                                {isAdmin && (
                                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="w-6 h-6 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCertificate(certificate);
                                        setShowCertificateUpload(true);
                                      }}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="w-6 h-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteWinner(certificate.id);
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                                
                                <CardContent className="p-6 text-center">
                                  <div className="mb-4">
                                    <div className={`w-20 h-20 bg-gradient-to-r ${getPositionColor(certificate.position)} rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                      <span className="text-white font-bold text-2xl">
                                        {userInitial}
                                      </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">
                                      {user?.full_name || user?.email?.split('@')[0] || 'Unknown User'}
                                    </h3>
                                    <Badge className={`bg-gradient-to-r ${getPositionColor(certificate.position)} text-white border-0`}>
                                      {getPositionText(certificate.position)}
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-center gap-2 text-green-400">
                                      <DollarSign className="w-4 h-4" />
                                      <span className="font-semibold">₹{certificate.prize_amount}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-slate-400">
                                      <Calendar className="w-4 h-4" />
                                      <span>{format(new Date(certificate.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="mt-4 text-white hover:bg-white/10 group-hover:bg-white/20 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewProfile(certificate.user_id);
                                    }}
                                  >
                                    <UserIcon className="w-4 h-4 mr-2" />
                                    View Profile
                                    <ExternalLink className="w-3 h-3 ml-2" />
                                  </Button>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 9)
                .map((certificate) => {
                  const user = getUserInfo(certificate.user_id);
                  const userInitial = user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
                  const contestTitle = getContestTitle(certificate.contest_id);
                  
                  return (
                    <Card 
                      key={certificate.id} 
                      className="glass-effect border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
                      onClick={() => handleViewProfile(certificate.user_id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${getPositionColor(certificate.position)} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <span className="text-white font-bold">
                              {userInitial}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">
                              {user?.full_name || user?.email?.split('@')[0] || 'Unknown User'}
                            </h3>
                            <p className="text-slate-400 text-sm">{contestTitle}</p>
                          </div>
                          {getPositionIcon(certificate.position)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge className={`bg-gradient-to-r ${getPositionColor(certificate.position)} text-white border-0`}>
                            {getPositionText(certificate.position)}
                          </Badge>
                          <div className="text-right">
                            <div className="text-green-400 font-semibold">₹{certificate.prize_amount}</div>
                            <div className="text-slate-400 text-xs">
                              {format(new Date(certificate.created_at), 'MMM d')}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Certificate Upload Modal */}
        {showCertificateUpload && selectedCertificate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="glass-effect border-slate-700/50 w-full max-w-md mx-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-3">
                    <Upload className="w-6 h-6 text-purple-400" />
                    Upload Certificate
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCertificateUpload(false);
                      setSelectedCertificate(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-300 mb-2">
                      Upload certificate for {getUserInfo(selectedCertificate.user_id)?.full_name || 'Winner'}
                    </p>
                    <p className="text-sm text-slate-400 mb-4">
                      Position: {getPositionText(selectedCertificate.position)} • 
                      Contest: {getContestTitle(selectedCertificate.contest_id)}
                    </p>
                  </div>
                  
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleCertificateUpload(file);
                        }
                      }}
                      className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                      disabled={uploadingCertificate}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Supported formats: PDF, JPG, PNG (Max 10MB)
                    </p>
                  </div>

                  {selectedCertificate.certificate_url && (
                    <div className="bg-green-800/20 border border-green-700/50 rounded-lg p-3">
                      <p className="text-green-300 text-sm flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Certificate already uploaded
                      </p>
                    </div>
                  )}

                  {uploadingCertificate && (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 text-purple-400">
                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        Uploading certificate...
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
