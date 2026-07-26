import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HeartHandshake,
  PlusCircle,
  Bell,
  User,
  Search,
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
  Activity,
  Droplet,
  Sparkles,
  Stethoscope
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'feed' | 'donors' | 'notifications' | 'profile';
  setActiveTab: (tab: 'feed' | 'donors' | 'notifications' | 'profile') => void;
  onOpenCreateModal: () => void;
  onOpenAuthModal: () => void;
  onOpenAdvisorModal: () => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  onOpenAuthModal,
  onOpenAdvisorModal,
  unreadCount,
}) => {
  const { currentUser, userProfile, signOutUser } = useAuth();

  return (
    <>
      {/* Top Header */}
      <header id="main-header" className="sticky top-0 z-40 bg-[#F9F7F2]/95 backdrop-blur-md border-b border-[#E5E1D8] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <div
              id="brand-logo"
              onClick={() => setActiveTab('feed')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#A63D40] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Droplet className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-2xl font-bold tracking-tight text-[#3C3836] font-serif flex items-center gap-1 leading-none">
                  Life<span className="text-[#A63D40]">Flow</span>
                </span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7C756E] opacity-70 mt-0.5 hidden sm:block">
                  Secure Blood Sync Network
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav id="desktop-nav" className="hidden md:flex items-center gap-2 lg:gap-6 text-[10px] lg:text-[11px] font-bold uppercase tracking-wider shrink-0">
              <button
                id="nav-feed-btn"
                onClick={() => setActiveTab('feed')}
                className={`py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'feed'
                    ? 'text-[#A63D40] border-b-2 border-[#A63D40]'
                    : 'text-[#3C3836]/70 hover:text-[#3C3836]'
                }`}
              >
                <Activity className="w-4 h-4" />
                Live Requests
              </button>

              <button
                id="nav-advisor-btn"
                onClick={onOpenAdvisorModal}
                className="py-1.5 transition-all flex items-center gap-1 text-[#991B1B] hover:text-[#7F1D1D] bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full border border-red-200/60 font-semibold whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                AI Advisor
              </button>

              <button
                id="nav-donors-btn"
                onClick={() => setActiveTab('donors')}
                className={`py-1.5 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'donors'
                    ? 'text-[#A63D40] border-b-2 border-[#A63D40]'
                    : 'text-[#3C3836]/70 hover:text-[#3C3836]'
                }`}
              >
                <Search className="w-4 h-4" />
                Donors
              </button>

              {currentUser && (
                <button
                  id="nav-notifications-btn"
                  onClick={() => setActiveTab('notifications')}
                  className={`py-1.5 transition-all flex items-center gap-1.5 relative whitespace-nowrap ${
                    activeTab === 'notifications'
                      ? 'text-[#A63D40] border-b-2 border-[#A63D40]'
                      : 'text-[#3C3836]/70 hover:text-[#3C3836]'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  Alerts
                  {unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-[#A63D40] text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
            </nav>

            {/* Action Buttons & Profile */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  <button
                    id="create-request-btn"
                    onClick={onOpenCreateModal}
                    className="px-4 py-2 bg-[#A63D40] hover:bg-[#8E3235] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Post Request</span>
                    <span className="sm:hidden">Request</span>
                  </button>

                  <div id="user-profile-menu" className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-[#E5E1D8] shadow-xs">
                    <button
                      id="profile-avatar-btn"
                      onClick={() => setActiveTab('profile')}
                      className={`flex items-center gap-2 transition-colors ${
                        activeTab === 'profile' ? 'text-[#A63D40]' : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#E5E1D8] border border-[#D6D2C9] overflow-hidden">
                        <img
                          src={userProfile?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`}
                          alt={userProfile?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left hidden lg:block pr-1">
                        <div className="text-xs font-semibold text-[#3C3836] truncate max-w-[110px]">
                          {userProfile?.name}
                        </div>
                        <div className="text-[10px] font-bold text-[#7D8471] uppercase tracking-wider flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7D8471]"></span>
                          Group {userProfile?.bloodGroup || 'O+'}
                        </div>
                      </div>
                    </button>

                    <button
                      id="logout-btn"
                      onClick={signOutUser}
                      title="Log Out"
                      className="p-1 text-[#7C756E] hover:text-[#A63D40] transition-colors hidden sm:block"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  id="login-register-btn"
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 bg-[#3C3836] hover:bg-[#2A2725] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-sm flex items-center gap-2 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (PRD Section 8.4) */}
      <div id="mobile-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-lg px-1 py-1">
        <div className="grid grid-cols-5 gap-0.5 text-center">
          <button
            id="mobile-nav-home"
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium ${
              activeTab === 'feed' ? 'text-red-700 bg-red-50' : 'text-stone-500'
            }`}
          >
            <Activity className="w-4 h-4 mb-0.5" />
            Home
          </button>

          <button
            id="mobile-nav-advisor"
            onClick={onOpenAdvisorModal}
            className="flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-semibold text-amber-700 bg-amber-50/80"
          >
            <Sparkles className="w-4 h-4 mb-0.5 text-amber-600" />
            Advisor
          </button>

          <button
            id="mobile-nav-create"
            onClick={currentUser ? onOpenCreateModal : onOpenAuthModal}
            className="flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-semibold text-red-700"
          >
            <PlusCircle className="w-5 h-5 mb-0.5 text-red-700 fill-red-100" />
            Request
          </button>

          <button
            id="mobile-nav-alerts"
            onClick={() => (currentUser ? setActiveTab('notifications') : onOpenAuthModal())}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium relative ${
              activeTab === 'notifications' ? 'text-red-700 bg-red-50' : 'text-stone-500'
            }`}
          >
            <div className="relative">
              <Bell className="w-4 h-4 mb-0.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 text-[8px] font-bold bg-red-600 text-white rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            Alerts
          </button>

          <button
            id="mobile-nav-profile"
            onClick={() => (currentUser ? setActiveTab('profile') : onOpenAuthModal())}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium ${
              activeTab === 'profile' ? 'text-red-700 bg-red-50' : 'text-stone-500'
            }`}
          >
            <User className="w-4 h-4 mb-0.5" />
            Profile
          </button>
        </div>
      </div>
    </>
  );
};
