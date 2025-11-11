import { useState, useEffect } from 'react';
import { Contest } from '@/entities/Contest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ContestSettings({ contestId }) {
  const [maxPhotos, setMaxPhotos] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContestSettings();
  }, [contestId]);

  const loadContestSettings = async () => {
    try {
      const contest = await Contest.getById(contestId);
      setMaxPhotos(contest.max_photos_per_entry || 1);
    } catch (error) {
      console.error('Error loading contest settings:', error);
      toast.error('Failed to load contest settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (maxPhotos < 1) {
      toast.error('Minimum 1 photo per entry is required');
      return;
    }

    setSaving(true);
    try {
      await Contest.update(contestId, {
        max_photos_per_entry: maxPhotos
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading contest settings...</div>;
  }

  return (
    <Card className="border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white">Contest Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxPhotos" className="text-slate-300">
              Maximum Photos Per Entry
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="maxPhotos"
                type="number"
                min="1"
                max="10"
                value={maxPhotos}
                onChange={(e) => setMaxPhotos(parseInt(e.target.value) || 1)}
                className="w-24 bg-slate-800 border-slate-700 text-white"
              />
              <span className="text-slate-400">photos</span>
            </div>
            <p className="text-sm text-slate-400">
              Set the maximum number of photos a user can submit per entry
            </p>
          </div>

          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
