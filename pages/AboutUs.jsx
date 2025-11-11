import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Heart, 
  Code, 
  Palette,
  MessageSquare,
  Star,
  Send
} from "lucide-react";

export default function AboutUs() {
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

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Create mailto link with form data
    const subject = `Contact from ${contactForm.name}`;
    const body = `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`;
    const mailtoLink = `mailto:darshanrl016@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
          className={`w-6 h-6 cursor-pointer transition-colors ${
            isActive ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'
          }`}
          onClick={() => interactive && setFeedback(prev => ({ ...prev, rating: starIndex }))}
          onMouseEnter={() => interactive && setHoveredStar(starIndex)}
          onMouseLeave={() => interactive && setHoveredStar(0)}
        />
      );
    });
  };

  return (
    <div className="min-h-screen p-6 space-y-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">About ShoPic</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-6">
            ShoPic is a creative contest platform where photographers and artists showcase their talent, 
            compete in exciting challenges, and win amazing prizes. Join our community of creative minds 
            and turn your passion into rewards.
          </p>
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
          <CardHeader>
            <CardTitle className="text-white text-2xl flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-400" />
              Our Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Darshan R L */}
              <Card className="bg-slate-800/50 border-slate-600/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Darshan R L</h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-4 h-4" />
                      <span>8431469059</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span>darshanrl016@gmail.com</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Manjappa Gowda G R */}
              <Card className="bg-slate-800/50 border-slate-600/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Manjappa Gowda G R</h3>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span>manjappagowda16@gmail.com</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
