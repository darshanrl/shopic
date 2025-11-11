import React, { useState } from 'react';
import LoginForm from '@/src/components/auth/LoginForm';
import SignUpForm from '@/src/components/auth/SignUpForm';
import DatabaseStatus from '@/src/components/DatabaseStatus';
import { Camera } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">ShoPic</h1>
          </div>
          <p className="text-slate-400 text-lg">Creative Contest Platform</p>
        </div>

        <DatabaseStatus />

        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <SignUpForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}
