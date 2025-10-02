import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/src/contexts/AuthContext";
import { useAdmin } from "@/src/hooks/useAdmin";
import { 
  Home, 
  Trophy, 
  Camera, 
  Search, 
  User as UserIcon, 
  Bell,
  Menu,
  X,
  Wallet,
  Crown,
  Info
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: Home,
    description: "Overview & trending contests"
  },
  {
    title: "Contests",
    url: createPageUrl("Contests"),
    icon: Trophy,
    description: "Browse all contests"
  },
  {
    title: "Create Contest",
    url: "/create-contest",
    icon: Trophy,
    description: "Add new contest (Admin)"
  },
  {
    title: "Feed",
    url: createPageUrl("Feed"),
    icon: Camera,
    description: "Creative submissions"
  },
  {
    title: "Search",
    url: createPageUrl("Search"),
    icon: Search,
    description: "Find contests & creators"
  },
  {
    title: "Winners",
    url: createPageUrl("Winners"),
    icon: Crown,
    description: "Contest winners & champions"
  },
  {
    title: "Profile",
    url: createPageUrl("Profile"),
    icon: UserIcon,
    description: "Your account & certificates"
  },
  {
    title: "About",
    url: createPageUrl("About"),
    icon: Info,
    description: "About us & contact"
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { user, logout, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const [userProfile, setUserProfile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      // For now, create a default profile structure
      // This will be populated from the database once connected
      setUserProfile({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url,
        account_balance: 1000, // Default starting balance
        total_earnings: 0,
        contests_joined: 0,
        contests_won: 0
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-white font-medium">Loading ShoPic...</span>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-slate-100 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Mobile Sidebar Toggle Button */}
        <button 
          className="fixed bottom-4 right-4 z-20 p-3 rounded-full bg-purple-600 text-white shadow-lg md:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar */}
        <Sidebar className={`fixed md:static z-30 h-screen transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
          <SidebarHeader className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                S
              </div>
              <span className="font-bold text-lg">ShoPic</span>
            </div>
            <button 
              className="md:hidden p-1 rounded-full hover:bg-slate-200"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    // Hide admin-only items for non-admin users
                    if (item.url === '/create-contest' && !isAdmin) {
                      return null;
                    }
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`
                            hover:bg-purple-500/10 hover:text-purple-300 transition-all duration-200 rounded-xl mb-1 group
                            ${location.pathname === item.url ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-300'}
                          `}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className={`w-5 h-5 transition-all duration-200 ${
                              location.pathname === item.url ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400'
                            }`} />
                            <div className="flex-1">
                              <span className="font-medium">{item.title}</span>
                              <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-700/50 p-4">
            {userProfile ? (
              <div className="glass-effect rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    {userProfile.avatar_url ? (
                      <img 
                        src={userProfile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {userProfile.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{userProfile.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{userProfile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm mb-3">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <span className="text-slate-300">Balance:</span>
                  <span className="font-semibold text-green-400">₹{userProfile.account_balance || 0}</span>
                </div>
                <Button 
                  onClick={logout}
                  variant="outline"
                  className="w-full text-xs bg-slate-800/50 hover:bg-slate-700/50 border-slate-600/50 text-slate-300 hover:text-white"
                >
                  Sign Out
                </Button>
              </div>
            ) : null}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}