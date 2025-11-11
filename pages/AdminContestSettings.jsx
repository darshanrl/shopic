import React, { useState, useEffect } from 'react';
import { Contest } from '@/entities/Contest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AdminRoute from '@/src/components/AdminRoute';
import { Camera, Image as ImageIcon } from 'lucide-react';

export default function AdminContestSettings() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedContestId, setSelectedContestId] = useState(null);
  const [contestSettings, setContestSettings] = useState({
    max_photos_per_entry: 1,
    allow_camera_uploads: true,
    allow_gallery_uploads: true
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      const data = await Contest.list();
      setContests(data);
      if (data.length > 0) {
        const contest = data[0];
        setSelectedContestId(contest.id);
        setContestSettings({
          max_photos_per_entry: contest.max_photos_per_entry || 1,
          allow_camera_uploads: contest.allow_camera_uploads !== false, // default to true if not set
          allow_gallery_uploads: contest.allow_gallery_uploads !== false // default to true if not set
        });
      }
    } catch (error) {
      console.error('Error loading contests:', error);
      toast.error('Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  const handleContestChange = (e) => {
    const contestId = e.target.value;
    const selectedContest = contests.find(c => c.id === contestId);
    setSelectedContestId(contestId);
    setContestSettings({
      max_photos_per_entry: selectedContest?.max_photos_per_entry || 1,
      allow_camera_uploads: selectedContest?.allow_camera_uploads !== false,
      allow_gallery_uploads: selectedContest?.allow_gallery_uploads !== false
    });
  };

  const handleSettingChange = async (e) => {
    const { name, value } = e.target;
    if (!selectedContestId) return;
    
    setSaving(true);
    try {
      await Contest.update(selectedContestId, {
        max_photos_per_entry: contestSettings.max_photos_per_entry,
        allow_camera_uploads: contestSettings.allow_camera_uploads,
        allow_gallery_uploads: contestSettings.allow_gallery_uploads,
        updated_at: new Date().toISOString()
      });
      toast.success('Settings saved successfully');
      loadContests(); // Refresh the list to show updated values
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading contests...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Contest Settings</h1>
              <p className="text-slate-400">Manage contest configurations and rules</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Back to Dashboard
            </Button>
          </div>

          <Card className="border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Contest Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure settings for each contest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="contest" className="text-slate-300">
                    Select Contest
                  </Label>
                  <select
                    id="contest"
                    value={selectedContestId || ''}
                    onChange={handleContestChange}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {contests.map((contest) => (
                      <option key={contest.id} value={contest.id}>
                        {contest.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedContestId && (
                  <div className="space-y-4 pt-4 border-t border-slate-700">
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="maxPhotos">Maximum Photos Per Entry</Label>
                        <Input
                          id="maxPhotos"
                          type="number"
                          min="1"
                          max="10"
                          value={contestSettings.max_photos_per_entry}
                          onChange={(e) => setContestSettings({
                            ...contestSettings,
                            max_photos_per_entry: parseInt(e.target.value) || 1
                          })}
                          className="mt-1"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Maximum number of photos a user can upload per entry
                        </p>
                      </div>

                      <div>
                        <Label>Allowed Photo Sources</Label>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="allowCamera"
                              checked={contestSettings.allow_camera_uploads}
                              onChange={(e) => setContestSettings({
                                ...contestSettings,
                                allow_camera_uploads: e.target.checked
                              })}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <Label htmlFor="allowCamera" className="flex items-center">
                              <Camera className="h-4 w-4 mr-2" />
                              Allow Camera Uploads
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="allowGallery"
                              checked={contestSettings.allow_gallery_uploads}
                              onChange={(e) => setContestSettings({
                                ...contestSettings,
                                allow_gallery_uploads: e.target.checked
                              })}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <Label htmlFor="allowGallery" className="flex items-center">
                              <ImageIcon className="h-4 w-4 mr-2" />
                              Allow Gallery Uploads
                            </Label>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Select which photo sources are allowed for this contest
                        </p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {saving ? 'Saving...' : 'Save Settings'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminRoute>
  );
}
