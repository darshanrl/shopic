import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const REQUIRE_VERIFY = String(import.meta.env.VITE_REQUIRE_EMAIL_VERIFY || 'true').toLowerCase() === 'true';
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [resending, setResending] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.full_name },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) throw authError;

      // If email confirmations are enabled, authData.session will be null
      const hasSession = Boolean(authData.session);

      if ((hasSession && authData.user) || !REQUIRE_VERIFY) {
        // We have a session (email confirmation disabled) -> create profile then login
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user?.id,
              email: formData.email,
              full_name: formData.full_name,
              is_admin: formData.email === 'darshanrl016@gmail.com'
            });
          if (profileError) {
            // Log but do not block user flow
            console.warn('Profile creation error:', profileError);
          }
        } catch (profileErr) {
          console.warn('Profile creation exception:', profileErr);
        }

        // Login (or skip if already logged in); keep as-is to populate context
        await login(formData.email, formData.password);
        navigate('/dashboard');
        return;
      }

      // No session -> user must verify email before logging in
      setInfo('Account created. Please check your email inbox for a verification link. After verifying, return here and use Sign In.');
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      if (!formData.email) {
        setError('Enter your email above, then click Resend.');
        return;
      }
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: { emailRedirectTo: `${window.location.origin}/login` }
      });
      if (error) throw error;
      setInfo('Verification email sent. Please check your inbox and spam folder.');
    } catch (e) {
      setError(e.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (error) {
      setError(error.message || 'Google sign up failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ShoPic</h1>
          <p className="text-slate-300">Join the creative community</p>
        </div>

        {/* Register Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {info && (
                <Alert>
                  <AlertDescription>{info}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a password"
                    required
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                    className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resendVerification}
                disabled={resending}
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                {resending ? 'Resending...' : 'Resend verification email'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-400">Or</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                {loading ? 'Signing up...' : 'Continue with Google'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
            <span className="text-sm">Join creative contests</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
            <span className="text-sm">Share your art with the community</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-sm">Win prizes and recognition</span>
          </div>
        </div>
      </div>
    </div>
  );
}
