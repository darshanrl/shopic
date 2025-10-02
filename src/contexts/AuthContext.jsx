import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setIsAdmin(currentUser.is_admin === true);
      console.log('User loaded:', { email: currentUser.email, is_admin: currentUser.is_admin });
    } catch (error) {
      console.log("User not authenticated:", error.message);
      setUser(null);
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const user = await User.login(email, password);
      setUser(user);
      setIsAdmin(user.is_admin === true);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    isAdmin,
    login,
    logout,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};