import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User } from "@/entities/User";
import { Entry } from "@/entities/Entry";
import { Certificate } from "@/entities/Certificate";
import { useAuth } from "@/src/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  Trophy, 
  Camera, 
  Calendar,
  Mail,
  Phone,
  School,
  ArrowLeft,
  Crown,
  Medal,
  Award,
  Download
} from "lucide-react";
import { format } from "date-fns";

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [userEntries, setUserEntries] = useState([]);
  const [userCertificates, setUserCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      // Try to fetch user profile; if not found, fallback to list()
      let userData = null;
      try {
        userData = await User.getById(userId);
      } catch (e) {
        if (e?.code === 'PGRST116') {
          const allUsers = await User.list();
          userData = allUsers.find(u => u.id === userId) || null;
        } else {
          // For any other error, still attempt fallback to list
          const allUsers = await User.list();
          userData = allUsers.find(u => u.id === userId) || null;
        }
      }

      // Load entries via existing filter API
      const entriesData = await Entry.filter({ user_id: userId });
      const certificatesData = await Certificate.list();

      setUser(userData);
      setUserEntries(entriesData || []);

      const userCerts = certificatesData.filter(cert => cert.user_id === userId);
      setUserCertificates(userCerts);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
    setLoading(false);
  };

  // Calculate unique contests joined
  const getUniqueContestsJoined = () => {
    const uniqueContestIds = new Set(userEntries.map(entry => entry.contest_id));
    return uniqueContestIds.size;
  };

  // Calculate contests won
  const getContestsWon = () => {
    return userCertificates.length;
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <Trophy className="w-5 h-5 text-purple-400" />;
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

  const handleDownloadCertificate = async (certificate) => {
    if (!certificate.certificate_url) {
      alert('Certificate not available for download yet.');
      return;
    }

    try {
      // Fetch the file as blob to force download
      const response = await fetch(certificate.certificate_url);
      const blob = await response.blob();
      
      // Create blob URL and download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `certificate_${certificate.position}_place_${user?.full_name || 'winner'}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error downloading certificate. Please try again.');
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
          <Button onClick={() => navigate('/winners')} className="bg-purple-500 hover:bg-purple-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Winners
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            onClick={() => navigate('/winners')} 
            variant="ghost" 
            className="text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Winners
          </Button>
        </div>

        {/* User Profile Header */}
        <Card className="glass-effect border-slate-700/50 mb-6">
          <CardContent className="p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                {user.profile_picture ? (
                  <img 
                    src={user.profile_picture} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-3xl">
                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user.full_name || user.email?.split('@')[0] || 'Unknown User'}
                </h1>
                <p className="text-slate-300 mb-4">{user.bio || 'No bio available'}</p>

                {/* Communicate buttons */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <Button
                    size="sm"
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                    asChild
                    disabled={!user?.email}
                  >
                    <a href={user?.email ? `mailto:${user.email}` : undefined}>
                      <Mail className="w-4 h-4 mr-2" /> Message
                    </a>
                  </Button>
                  {user?.phone_number && (
                    <Button size="sm" variant="outline" asChild className="border-green-600 text-green-400 hover:bg-green-700/20">
                      <a href={`https://wa.me/${String(user.phone_number).replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer">
                        <Phone className="w-4 h-4 mr-2" /> WhatsApp
                      </a>
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  {user?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user?.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone_number}</span>
                    </div>
                  )}
                  {user?.college_name && (
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4" />
                      <span>{user.college_name}</span>
                    </div>
                  )}
                  {user?.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {format(new Date(user.created_at), 'MMM yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{getContestsWon()}</div>
                <div className="text-sm text-slate-400">Contests Won</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{getUniqueContestsJoined()}</div>
                <div className="text-sm text-slate-400">Contests Joined</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{userEntries.length}</div>
                <div className="text-sm text-slate-400">Total Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  ₹{userCertificates.reduce((sum, cert) => sum + (cert.prize_amount || 0), 0)}
                </div>
                <div className="text-sm text-slate-400">Total Winnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  ₹{user.account_balance || 0}
                </div>
                <div className="text-sm text-slate-400">Balance</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        {userCertificates.length > 0 && (
          <Card className="glass-effect border-slate-700/50 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {userCertificates.map((certificate) => (
                  <Card key={certificate.id} className="bg-slate-800/50 border-slate-600/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        {getPositionIcon(certificate.position)}
                        <div className="flex-1">
                          <Badge className={`bg-gradient-to-r ${getPositionColor(certificate.position)} text-white border-0 mb-1`}>
                            {getPositionText(certificate.position)}
                          </Badge>
                          <p className="text-sm text-slate-400">
                            {format(new Date(certificate.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-semibold mb-1">₹{certificate.prize_amount}</div>
                          {isOwnProfile && certificate.certificate_url ? (
                            <Button
                              size="sm"
                              onClick={() => handleDownloadCertificate(certificate)}
                              className="bg-purple-500 hover:bg-purple-600 text-white text-xs"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          ) : isOwnProfile && !certificate.certificate_url ? (
                            <p className="text-xs text-slate-500">Certificate pending</p>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Entries */}
        {userEntries.length > 0 && (
          <Card className="glass-effect border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Camera className="w-6 h-6 text-purple-400" />
                Recent Entries ({userEntries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userEntries.slice(0, 6).map((entry) => (
                  <Card key={entry.id} className="bg-slate-800/50 border-slate-600/50 overflow-hidden">
                    <div className="aspect-video bg-slate-700/50 flex items-center justify-center">
                      {entry.media_url ? (
                        entry.media_type === 'video' ? (
                          <video 
                            src={entry.media_url} 
                            className="w-full h-full object-cover"
                            controls={false}
                          />
                        ) : (
                          <img 
                            src={entry.media_url} 
                            alt={entry.title}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <Camera className="w-8 h-8 text-slate-500" />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-white text-sm mb-1 truncate">{entry.title}</h3>
                      <p className="text-xs text-slate-400 truncate">{entry.caption}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(entry.created_at), 'MMM d, yyyy')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {userEntries.length === 0 && userCertificates.length === 0 && (
          <Card className="glass-effect border-slate-700/50">
            <CardContent className="p-8 text-center">
              <UserIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No Activity Yet</h3>
              <p className="text-slate-400">This user hasn't participated in any contests yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
