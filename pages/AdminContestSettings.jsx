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

export default function AdminContestSettings() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedContestId, setSelectedContestId] = useState(null);
  const [contestSettings, setContestSettings] = useState({
    max_photos_per_entry: 1
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
        setSelectedContestId(data[0].id);
        setContestSettings({
          max_photos_per_entry: data[0].max_photos_per_entry || 1
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
      max_photos_per_entry: selectedContest?.max_photos_per_entry || 1
    });
  };

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setContestSettings(prev => ({
      ...prev,
      [name]: parseInt(value) || 1
    }));
  };

  const handleSave = async () => {
    if (!selectedContestId) return;
    
    setSaving(true);
    try {
      await Contest.update(selectedContestId, {
        max_photos_per_entry: contestSettings.max_photos_per_entry
      });
      toast.success('Contest settings updated successfully');
      loadContests(); // Refresh the list to show updated values
    } catch (error) {
      console.error('Error saving contest settings:', error);
      toast.error('Failed to update contest settings');
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
                      <Label htmlFor="maxPhotos" className="text-slate-300">
                        Maximum Photos Per Entry
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="maxPhotos"
                          name="max_photos_per_entry"
                          type="number"
                          min="1"
                          max="10"
                          value={contestSettings.max_photos_per_entry}
                          onChange={handleSettingChange}
                          className="w-24 bg-slate-800 border-slate-700 text-white"
                        />
                        <span className="text-slate-400">photos</span>
                      </div>
                      <p className="text-sm text-slate-400">
                        Set the maximum number of photos a user can submit per entry
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={handleSave}
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
