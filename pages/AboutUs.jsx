import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  Mail,
  Phone,
  Heart,
  MessageSquare,
  Star,
  Send,
  Pencil,
  Check,
  X
} from "lucide-react";
import { User } from "@/entities/User";
import { SiteSetting } from "@/entities/SiteSetting";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import parse from "html-react-parser";
import { Input } from "@/components/ui/input";

export default function AboutUs() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    about_us_text: '',
    contact_name_primary: 'Darshan R L',
    contact_phone_primary: '8431469059',
    contact_email_primary: 'darshanrl016@gmail.com',
    contact_name_secondary: 'Manjappa Gowda G R',
    contact_email_secondary: 'manjappagowda16@gmail.com'
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: ''
  });
  const [hoveredStar, setHoveredStar] = useState(0);

  // Editing States
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [editAboutText, setEditAboutText] = useState("");
  const [isEditingContacts, setIsEditingContacts] = useState(false);
  const [editContacts, setEditContacts] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        User.me(),
        SiteSetting.getAll()
      ]);

      if (results[0].status === 'fulfilled') {
        setCurrentUser(results[0].value);
      }
      if (results[1].status === 'fulfilled' && results[1].value) {
        setSettings(prev => ({ ...prev, ...results[1].value }));
      }
    } catch (error) {
      console.error("Error loading About Us data:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = currentUser?.is_admin === true;

  const handleEditAbout = () => {
    setEditAboutText(settings.about_us_text || "");
    setIsEditingAbout(true);
  };

  const handleSaveAbout = async () => {
    setIsSaving(true);
    try {
      await SiteSetting.set('about_us_text', editAboutText);
      setSettings(prev => ({ ...prev, about_us_text: editAboutText }));
      setIsEditingAbout(false);
    } catch (e) {
      alert("Failed to save. Ensure site_settings table exists.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditContacts = () => {
    setEditContacts({
      contact_name_primary: settings.contact_name_primary ?? "",
      contact_phone_primary: settings.contact_phone_primary ?? "",
      contact_email_primary: settings.contact_email_primary ?? "",
      contact_name_secondary: settings.contact_name_secondary ?? "",
      contact_email_secondary: settings.contact_email_secondary ?? ""
    });
    setIsEditingContacts(true);
  };

  const handleSaveContacts = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        SiteSetting.set('contact_name_primary', editContacts.contact_name_primary),
        SiteSetting.set('contact_phone_primary', editContacts.contact_phone_primary),
        SiteSetting.set('contact_email_primary', editContacts.contact_email_primary),
        SiteSetting.set('contact_name_secondary', editContacts.contact_name_secondary),
        SiteSetting.set('contact_email_secondary', editContacts.contact_email_secondary)
      ]);
      setSettings(prev => ({ ...prev, ...editContacts }));
      setIsEditingContacts(false);
    } catch (e) {
      alert("Failed to save contacts. Ensure site_settings table exists.");
    } finally {
      setIsSaving(false);
    }
  };
  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Create mailto link with form data
    const subject = `Contact from ${contactForm.name}`;
    const body = `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`;
    const mailtoLink = `mailto:${settings.contact_email_primary || 'darshanrl016@gmail.com'}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);

    // Reset form
    setContactForm({ name: '', email: '', message: '' });
    alert('Email client opened! Please send the email to complete your message.');
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    // Create mailto link with feedback data
    const subject = `ShoPic Feedback - ${feedback.rating} Stars`;
    const body = `Rating: ${feedback.rating}/5 stars\n\nFeedback:\n${feedback.comment}`;
    const mailtoLink = `mailto:darshanrl016@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);

    // Reset form
    setFeedback({ rating: 0, comment: '' });
    alert('Thank you for your feedback! Email client opened to send your review.');
  };

  const renderStars = (rating, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starIndex = index + 1;
      const isActive = interactive ?
        (hoveredStar >= starIndex || (hoveredStar === 0 && feedback.rating >= starIndex)) :
        rating >= starIndex;

      return (
        <Star
          key={index}
          className={`w-6 h-6 cursor-pointer transition-colors ${isActive ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'
            }`}
          onClick={() => interactive && setFeedback(prev => ({ ...prev, rating: starIndex }))}
          onMouseEnter={() => interactive && setHoveredStar(starIndex)}
          onMouseLeave={() => interactive && setHoveredStar(0)}
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 space-y-8 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-white">About ShoPic</h1>
            {isAdmin && !isEditingAbout && (
              <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10" onClick={handleEditAbout}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          
          <div className="max-w-3xl mx-auto mb-8">
            {isEditingAbout ? (
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
                <div className="bg-white text-black rounded-lg overflow-hidden [&_.ql-toolbar]:bg-slate-100 [&_.ql-container]:min-h-[150px] [&_.ql-editor]:text-base mb-4 text-left">
                    <ReactQuill 
                        value={editAboutText}
                        onChange={setEditAboutText}
                        theme="snow"
                        modules={{
                            toolbar: [
                                ['bold', 'italic', 'underline'],
                                [{ 'color': [] }],
                                [{ 'align': [] }],
                                ['clean']
                            ]
                        }}
                    />
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setIsEditingAbout(false)} disabled={isSaving}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={handleSaveAbout} disabled={isSaving}>
                    <Check className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xl text-slate-300 ql-snow">
                <div className="ql-editor p-0 text-center">
                  {settings.about_us_text ? parse(settings.about_us_text) : 'ShoPic is a creative contest platform where photographers and artists showcase their talent...'}
                </div>
              </div>
            )}
          </div>
          <div className="bg-slate-800/30 rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">What We Offer</h2>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-2">Creative Contests</h3>
                <p className="text-slate-300 text-sm">
                  Participate in diverse photography and art contests with exciting themes and challenges.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">Win Prizes</h3>
                <p className="text-slate-300 text-sm">
                  Compete for cash prizes and recognition. Winners receive certificates and monetary rewards.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Community</h3>
                <p className="text-slate-300 text-sm">
                  Connect with fellow artists, share your work, and get inspired by creative submissions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <Card className="glass-effect border-slate-700/50 mb-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-2xl flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-400" />
              Our Team
            </CardTitle>
            {isAdmin && !isEditingContacts && (
              <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10" onClick={handleEditContacts}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Contacts
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditingContacts ? (
              <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700/50 space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">Primary Contact</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                      <Input 
                        value={editContacts.contact_name_primary} 
                        onChange={(e) => setEditContacts(prev => ({...prev, contact_name_primary: e.target.value}))}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                      <Input 
                        value={editContacts.contact_phone_primary} 
                        onChange={(e) => setEditContacts(prev => ({...prev, contact_phone_primary: e.target.value}))}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                      <Input 
                        value={editContacts.contact_email_primary} 
                        onChange={(e) => setEditContacts(prev => ({...prev, contact_email_primary: e.target.value}))}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">Secondary Contact</h3>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                      <Input 
                        value={editContacts.contact_name_secondary} 
                        onChange={(e) => setEditContacts(prev => ({...prev, contact_name_secondary: e.target.value}))}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                      <Input 
                        value={editContacts.contact_email_secondary} 
                        onChange={(e) => setEditContacts(prev => ({...prev, contact_email_secondary: e.target.value}))}
                        className="bg-slate-900 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setIsEditingContacts(false)} disabled={isSaving}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={handleSaveContacts} disabled={isSaving}>
                    <Check className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Contacts"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8 mt-4">
                {/* Primary Contact */}
                {(settings.contact_name_primary || settings.contact_email_primary || settings.contact_phone_primary) && (
                  <Card className="bg-slate-800/50 border-slate-600/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <UserIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{settings.contact_name_primary}</h3>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {settings.contact_phone_primary && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Phone className="w-4 h-4" />
                            <span>{settings.contact_phone_primary}</span>
                          </div>
                        )}
                        {settings.contact_email_primary && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="w-4 h-4" />
                            <span>{settings.contact_email_primary}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Secondary Contact */}
                {(settings.contact_name_secondary || settings.contact_email_secondary) && (
                  <Card className="bg-slate-800/50 border-slate-600/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                          <UserIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{settings.contact_name_secondary}</h3>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {settings.contact_email_secondary && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="w-4 h-4" />
                            <span>{settings.contact_email_secondary}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="glass-effect border-slate-700/50 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              Contact Us
            </CardTitle>
            <p className="text-slate-400">
              Have questions or suggestions? We'd love to hear from you!
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Tell us what's on your mind..."
                />
              </div>
              <Button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card className="glass-effect border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-400" />
              Share Your Feedback
            </CardTitle>
            <p className="text-slate-400">
              Rate your experience and help us improve ShoPic!
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Rate Your Experience
                </label>
                <div className="flex items-center gap-1">
                  {renderStars(feedback.rating, true)}
                  {feedback.rating > 0 && (
                    <span className="ml-3 text-slate-300">
                      {feedback.rating}/5 stars
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Feedback (Optional)
                </label>
                <textarea
                  rows={3}
                  value={feedback.comment}
                  onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Tell us about your experience (optional)"
                />
              </div>
              <Button
                type="submit"
                disabled={feedback.rating === 0}
                className="bg-yellow-500 hover:bg-yellow-600 text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Star className="w-4 h-4 mr-2" />
                Submit Feedback
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
