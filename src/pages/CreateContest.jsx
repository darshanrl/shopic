import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contest } from '@/entities/Contest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Video, 
  DollarSign, 
  Calendar, 
  Users, 
  Award,
  Upload,
  X
} from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

export default function CreateContest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'photography',
    entry_fee: 0,
    prize_pool: 0,
    max_participants: 100,
    max_photos_per_entry: 1, // Default to 1 photo per entry
    allow_camera_uploads: true,
    allow_gallery_uploads: true,
    start_date: '',
    end_date: '',
    voting_end_date: '',
    rules: '',
    tags: [],
    media_type: 'both', // Allow both photos and videos
    banner_image: ''
  });
  const [newTag, setNewTag] = useState('');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerPreview, setBannerPreview] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleBannerSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBannerUploading(true);
      // Optimistic local preview
      setBannerPreview(URL.createObjectURL(file));
      const { file_url } = await UploadFile({ file, category: 'contest_banners' });
      setFormData(prev => ({ ...prev, banner_image: file_url }));
    } catch (err) {
      console.error('Failed to upload banner image:', err);
      alert(`Failed to upload cover image: ${err?.message || 'Unknown error'}`);
      setBannerPreview('');
    } finally {
      setBannerUploading(false);
    }
  };

  const clearBanner = () => {
    setFormData(prev => ({ ...prev, banner_image: '' }));
    setBannerPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.start_date || !formData.end_date) {
        alert('Please fill in all required fields');
        return;
      }

      // Validate dates
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const now = new Date();

      if (startDate <= now) {
        alert('Start date must be in the future');
        return;
      }

      if (endDate <= startDate) {
        alert('End date must be after start date');
        return;
      }

      // Prepare contest data
      const contestData = {
        ...formData,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        voting_end_date: formData.voting_end_date ? new Date(formData.voting_end_date).toISOString() : null,
        status: 'upcoming',
        created_at: new Date().toISOString()
      };

      console.log('Submitting contest data:', contestData);
      const createdContest = await Contest.create(contestData);
      console.log('Contest created successfully:', createdContest);
      
      // Show success message
      alert('Contest created successfully! Redirecting to contests page...');
      navigate('/contests');
    } catch (error) {
      console.error('Error creating contest:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      
      // Show more specific error message
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Failed to create contest: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Contest</h1>
          <p className="text-slate-300">Set up a new creative contest for the community</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="h-5 w-5" />
              Contest Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="rules">Rules & Prizes</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-white">Contest Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter contest title"
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-white">Category</Label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                      >
                        <option value="photography">Photography</option>
                        <option value="videography">Videography</option>
                        <option value="mixed">Mixed Media</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="max_photos_per_entry" className="text-white">Max Photos per Entry</Label>
                      <select
                        id="max_photos_per_entry"
                        name="max_photos_per_entry"
                        value={formData.max_photos_per_entry}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? 'Photo' : 'Photos'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your contest..."
                      rows={4}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Cover Image</Label>
                    <div className="mt-2 flex items-start gap-4">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerSelect}
                          className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                        />
                        <p className="text-xs text-slate-400 mt-2">Recommended size: 1200x400 or wider. JPG/PNG.</p>
                      </div>
                      {(bannerPreview || formData.banner_image) && (
                        <div className="relative w-48 h-24 rounded overflow-hidden border border-white/20">
                          <img
                            src={bannerPreview || formData.banner_image}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={clearBanner}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    {bannerUploading && (
                      <p className="text-sm text-slate-300 mt-2">Uploading cover image...</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="media_type" className="text-white">Media Type</Label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="media_type"
                          value="image"
                          checked={formData.media_type === 'image'}
                          onChange={handleInputChange}
                          className="text-purple-500"
                        />
                        <Camera className="h-4 w-4 text-white" />
                        <span className="text-white">Images Only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="media_type"
                          value="video"
                          checked={formData.media_type === 'video'}
                          onChange={handleInputChange}
                          className="text-purple-500"
                        />
                        <Video className="h-4 w-4 text-white" />
                        <span className="text-white">Videos Only</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="media_type"
                          value="both"
                          checked={formData.media_type === 'both'}
                          onChange={handleInputChange}
                          className="text-purple-500"
                        />
                        <div className="flex gap-1">
                          <Camera className="h-4 w-4 text-white" />
                          <Video className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-white">Both Photos & Videos</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags" className="text-white">Tags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} className="bg-purple-500 hover:bg-purple-600">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-purple-500/20 text-purple-200">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rules" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block">Allowed Upload Sources</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="allow_camera_uploads"
                            name="allow_camera_uploads"
                            checked={formData.allow_camera_uploads}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              allow_camera_uploads: e.target.checked
                            }))}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <Label htmlFor="allow_camera_uploads" className="text-white">
                            Allow Camera Uploads
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="allow_gallery_uploads"
                            name="allow_gallery_uploads"
                            checked={formData.allow_gallery_uploads}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              allow_gallery_uploads: e.target.checked
                            }))}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <Label htmlFor="allow_gallery_uploads" className="text-white">
                            Allow Gallery Uploads
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="entry_fee" className="text-white">Entry Fee ($)</Label>
                      <Input
                        id="entry_fee"
                        name="entry_fee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.entry_fee}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prize_pool" className="text-white">Prize Pool ($)</Label>
                      <Input
                        id="prize_pool"
                        name="prize_pool"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.prize_pool}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max_participants" className="text-white">Max Participants</Label>
                      <Input
                        id="max_participants"
                        name="max_participants"
                        type="number"
                        min="1"
                        value={formData.max_participants}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="start_date" className="text-white">Start Date & Time</Label>
                      <Input
                        id="start_date"
                        name="start_date"
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        required
                        className="bg-white/10 border-white/20 text-white"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      <p className="text-xs text-slate-400 mt-1">When the contest begins</p>
                    </div>
                    <div>
                      <Label htmlFor="end_date" className="text-white">End Date & Time</Label>
                      <Input
                        id="end_date"
                        name="end_date"
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        required
                        className="bg-white/10 border-white/20 text-white"
                        min={formData.start_date || new Date().toISOString().slice(0, 16)}
                      />
                      <p className="text-xs text-slate-400 mt-1">When submissions close</p>
                    </div>
                    <div>
                      <Label htmlFor="voting_end_date" className="text-white">Voting End Date & Time</Label>
                      <Input
                        id="voting_end_date"
                        name="voting_end_date"
                        type="datetime-local"
                        value={formData.voting_end_date}
                        onChange={handleInputChange}
                        className="bg-white/10 border-white/20 text-white"
                        min={formData.end_date || new Date().toISOString().slice(0, 16)}
                      />
                      <p className="text-xs text-slate-400 mt-1">When voting closes (optional)</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="text-blue-300 font-medium mb-2">📅 Contest Timeline</h4>
                    <div className="space-y-2 text-sm text-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Contest starts: {formData.start_date ? new Date(formData.start_date).toLocaleString() : 'Not set'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Submissions close: {formData.end_date ? new Date(formData.end_date).toLocaleString() : 'Not set'}</span>
                      </div>
                      {formData.voting_end_date && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <span>Voting closes: {new Date(formData.voting_end_date).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4 pt-6 border-t border-white/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/contests')}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {loading ? 'Creating...' : 'Create Contest'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}