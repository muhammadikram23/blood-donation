import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BloodGroup, BloodRequest, InterestedDonation } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  User,
  Droplet,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  Edit2,
  CheckCircle2,
  Clock,
  Heart,
  Activity,
  Award,
  Key,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ChevronRight,
  LogOut,
  Info,
  Check,
  X,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  formatRelativeTime,
  formatDeadline,
  DONOR_COMPATIBILITY_MAP,
  RECIPIENT_COMPATIBILITY_MAP
} from '../utils/bloodCompatibility';

interface UserProfileModalProps {
  onSelectRequest: (request: BloodRequest) => void;
}

export const UserProfileView: React.FC<UserProfileModalProps> = ({ onSelectRequest }) => {
  const { currentUser, userProfile, updateUserProfile, updateUserPassword, signOutUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(userProfile?.bloodGroup || 'O+');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [isAvailableDonor, setIsAvailableDonor] = useState(userProfile?.isAvailableDonor ?? true);

  // Password setting state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [myPledges, setMyPledges] = useState<InterestedDonation[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'pledges'>('requests');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setBloodGroup(userProfile.bloodGroup);
      setPhone(userProfile.phone || '');
      setAddress(userProfile.address);
      setIsAvailableDonor(userProfile.isAvailableDonor);
    }
  }, [userProfile]);

  // Realtime subscriber for user's posted requests
  useEffect(() => {
    if (!currentUser) return;

    const qReq = query(
      collection(db, 'bloodRequests'),
      where('userId', '==', currentUser.uid)
    );

    const unsubReq = onSnapshot(qReq, (snap) => {
      const list: BloodRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as BloodRequest));
      setMyRequests(list);
    });

    const qPledge = query(
      collection(db, 'interestedDonations'),
      where('donorId', '==', currentUser.uid)
    );

    const unsubPledge = onSnapshot(qPledge, (snap) => {
      const list: InterestedDonation[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as InterestedDonation));
      setMyPledges(list);
    });

    return () => {
      unsubReq();
      unsubPledge();
    };
  }, [currentUser]);

  const handleToggleAvailability = async () => {
    const nextVal = !isAvailableDonor;
    setIsAvailableDonor(nextVal);
    await updateUserProfile({ isAvailableDonor: nextVal });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        name,
        bloodGroup,
        phone,
        address,
        isAvailableDonor,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!newPassword) {
      setPasswordErrorMsg('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Passwords do not match. Please verify and try again.');
      return;
    }

    setPasswordSaving(true);
    try {
      await updateUserPassword(newPassword);
      setPasswordSuccessMsg('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccessMsg(null);
        setIsChangingPassword(false);
      }, 2500);
    } catch (err: any) {
      console.error('Password update error:', err);
      setPasswordErrorMsg(err?.message || 'Failed to update password. Please try logging in again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!currentUser) return null;

  const currentBg = userProfile?.bloodGroup || 'O+';
  const canDonateTo = DONOR_COMPATIBILITY_MAP[currentBg] || [];
  const canReceiveFrom = RECIPIENT_COMPATIBILITY_MAP[currentBg] || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-2 sm:px-4 lg:px-6">
      
      {/* Top Banner / Header Card */}
      <div className="bg-white rounded-[32px] border border-[#E5E1D8] shadow-xs relative overflow-hidden transition-all hover:shadow-md">
        {/* Decorative Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-[#A63D40] via-[#7D8471] to-[#3C3836]" />

        <div className="p-6 sm:p-8 lg:p-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          
          {/* User Identity Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#F9F7F2] border-2 border-[#E5E1D8] overflow-hidden shadow-xs">
                <img
                  src={userProfile?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.email || 'user')}`}
                  alt={userProfile?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 px-3.5 py-1 rounded-full bg-[#A63D40] text-white font-serif font-black text-sm shadow-md border-2 border-white">
                {currentBg}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center flex-wrap gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#3C3836]">
                  {userProfile?.name || 'Registered Donor'}
                </h1>
                <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#F9F7F2] text-[#7D8471] rounded-full border border-[#7D8471]/30 flex items-center gap-1.5 shadow-2xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7D8471]" /> Lifesaver Member
                </span>
                {currentBg === 'O-' && (
                  <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#A63D40]/10 text-[#A63D40] rounded-full border border-[#A63D40]/20 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#A63D40]" /> Universal Donor
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-[#7C756E] font-medium pt-1">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#A63D40] shrink-0" />
                  {userProfile?.email}
                </span>
                {userProfile?.phone && (
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#7D8471] shrink-0" />
                    {userProfile.phone}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#A63D40] shrink-0" />
                  {userProfile?.address || 'Location Not Specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Control Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto pt-6 xl:pt-0 border-t xl:border-t-0 border-[#F1E9E0]">
            
            <button
              onClick={handleToggleAvailability}
              className={`px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-2xs ${
                isAvailableDonor
                  ? 'bg-[#F1E9E0] text-[#3C3836] border border-[#7D8471] hover:bg-[#E5E1D8]'
                  : 'bg-[#F9F7F2] text-[#7C756E] border border-[#E5E1D8] hover:bg-[#E5E1D8]'
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${isAvailableDonor ? 'bg-[#7D8471] animate-pulse' : 'bg-[#E5E1D8]'}`}></span>
              {isAvailableDonor ? 'Available to Donate' : 'Unavailable Currently'}
            </button>

            <button
              onClick={() => {
                setIsEditing(!isEditing);
                if (!isEditing) setIsChangingPassword(false);
              }}
              className="px-4 py-3 bg-[#3C3836] hover:bg-[#2A2725] text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>

            <button
              onClick={() => {
                setIsChangingPassword(!isChangingPassword);
                if (!isChangingPassword) setIsEditing(false);
              }}
              className="px-4 py-3 bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#3C3836] border border-[#E5E1D8] font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <Key className="w-4 h-4 text-[#A63D40]" />
              {isChangingPassword ? 'Cancel' : 'Set Password'}
            </button>

            <button
              onClick={() => signOutUser()}
              className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="xl:hidden">Sign Out</span>
            </button>

          </div>

        </div>
      </div>

      {/* Main 2-Column Responsive Layout Grid (Desktop 12 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (4 cols on Desktop): Blood Compatibility, Contact Details, Availability Info */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Blood Compatibility Info Box */}
          <div className="bg-white rounded-[28px] border border-[#E5E1D8] p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#F1E9E0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#A63D40]/10 text-[#A63D40] flex items-center justify-center">
                  <Droplet className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#3C3836]">Blood Compatibility</h3>
                  <p className="text-[10px] text-[#7C756E] uppercase font-bold tracking-wider">Group {currentBg}</p>
                </div>
              </div>
              <span className="text-2xl font-black font-serif text-[#A63D40]">{currentBg}</span>
            </div>

            {/* Can Donate To */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#3C3836] uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#A63D40]" /> Can Donate Blood To:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {canDonateTo.map((bg) => (
                  <span
                    key={bg}
                    className={`px-2.5 py-1 text-xs font-bold font-serif rounded-xl border ${
                      bg === currentBg
                        ? 'bg-[#A63D40] text-white border-[#A63D40]'
                        : 'bg-[#F9F7F2] text-[#3C3836] border-[#E5E1D8]'
                    }`}
                  >
                    {bg}
                  </span>
                ))}
              </div>
            </div>

            {/* Can Receive From */}
            <div className="space-y-2 pt-2 border-t border-[#F1E9E0]">
              <label className="text-[10px] font-bold text-[#3C3836] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7D8471]" /> Can Receive Blood From:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {canReceiveFrom.map((bg) => (
                  <span
                    key={bg}
                    className="px-2.5 py-1 text-xs font-bold font-serif bg-[#F9F7F2] text-[#3C3836] border border-[#E5E1D8] rounded-xl"
                  >
                    {bg}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Location & Primary Details Card */}
          <div className="bg-white rounded-[28px] border border-[#E5E1D8] p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#F1E9E0] pb-3">
              <MapPin className="w-5 h-5 text-[#A63D40]" />
              <h3 className="text-sm font-bold font-serif text-[#3C3836]">Registered Location</h3>
            </div>

            <div className="space-y-3 text-xs text-[#3C3836]">
              <div>
                <span className="text-[10px] font-bold text-[#7C756E] uppercase tracking-wider block">Primary Address / Area</span>
                <p className="font-semibold text-[#3C3836] mt-0.5">{userProfile?.address || 'Not Provided'}</p>
              </div>

              {userProfile?.phone && (
                <div>
                  <span className="text-[10px] font-bold text-[#7C756E] uppercase tracking-wider block">Emergency Contact Phone</span>
                  <p className="font-semibold text-[#3C3836] mt-0.5">{userProfile.phone}</p>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-[#7C756E] uppercase tracking-wider block">Donor Visibility</span>
                <p className="text-[11px] text-[#7D8471] font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Searchable by emergency requesters
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (8 cols on Desktop): Drawers (Forms), Stats Cards, Activity Tabs & Requests List */}
        <div className="lg:col-span-8 space-y-6">

          {/* Set Password Form Drawer */}
          {isChangingPassword && (
            <form onSubmit={handleSavePassword} className="bg-white rounded-[32px] border-2 border-[#A63D40]/30 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#F1E9E0] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#A63D40]/10 text-[#A63D40] flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-serif text-[#3C3836]">Set or Change Account Password</h3>
                    <p className="text-[11px] text-[#7C756E]">Manage login password credentials for email authentication</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="p-1.5 text-[#7C756E] hover:text-[#3C3836] rounded-xl hover:bg-[#F9F7F2]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {passwordErrorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              {passwordSuccessMsg && (
                <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-2xl flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                      className="w-full pl-3.5 pr-10 py-3 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-medium text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C756E] hover:text-[#3C3836]"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-3.5 pr-10 py-3 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-medium text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C756E] hover:text-[#3C3836]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#F1E9E0]">
                <span className="text-[11px] text-[#7C756E] flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#7D8471]" /> Passwords are saved securely to your account
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="px-4 py-2.5 bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#3C3836] font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="px-5 py-2.5 bg-[#A63D40] hover:bg-[#8E3235] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-2 transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {passwordSaving ? 'Saving...' : 'Save New Password'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Edit Profile Form Drawer */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="bg-white rounded-[32px] border-2 border-[#7D8471]/30 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#F1E9E0] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#7D8471]/10 text-[#7D8471] flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-serif text-[#3C3836]">Update Profile Information</h3>
                    <p className="text-[11px] text-[#7C756E]">Keep your blood group and emergency contact info up to date</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-[#7C756E] hover:text-[#3C3836] rounded-xl hover:bg-[#F9F7F2]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#7C756E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-medium text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1.5">Blood Group</label>
                  <div className="relative">
                    <Droplet className="w-4 h-4 text-[#A63D40] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                      className="w-full pl-10 pr-3.5 py-3 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-bold text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                    >
                      {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((bg) => (
                        <option key={bg} value={bg}>
                          Group {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#7C756E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-3.5 py-3 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-medium text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1.5">Primary Address / Area</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#7C756E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-medium text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#F1E9E0]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#3C3836] font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#A63D40] hover:bg-[#8E3235] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Activity Statistics Cards (3 Grid Column on Tablet/Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-[24px] border border-[#E5E1D8] shadow-xs flex items-center gap-4 transition-all hover:border-[#A63D40]/40">
              <div className="w-12 h-12 rounded-2xl bg-[#F9F7F2] text-[#A63D40] border border-[#E5E1D8] flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold font-serif text-[#3C3836] block">{myRequests.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C756E]">Requests Posted</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-[24px] border border-[#E5E1D8] shadow-xs flex items-center gap-4 transition-all hover:border-[#7D8471]/40">
              <div className="w-12 h-12 rounded-2xl bg-[#F9F7F2] text-[#7D8471] border border-[#E5E1D8] flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <span className="text-2xl font-bold font-serif text-[#3C3836] block">{myPledges.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C756E]">Pledges Offered</span>
              </div>
            </div>

            <div className="p-5 bg-white rounded-[24px] border border-[#E5E1D8] shadow-xs flex items-center gap-4 transition-all hover:border-[#A63D40]/40">
              <div className="w-12 h-12 rounded-2xl bg-[#F9F7F2] text-[#A63D40] border border-[#E5E1D8] flex items-center justify-center shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-bold font-serif text-[#3C3836] block">
                  {myPledges.filter((p) => p.status === 'accepted').length}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C756E]">Donations Confirmed</span>
              </div>
            </div>
          </div>

          {/* Activity Section: My Posted Requests & My Pledges */}
          <div className="bg-white rounded-[32px] border border-[#E5E1D8] p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Tab Controls */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#F1E9E0] pb-4">
              <button
                onClick={() => setActiveSubTab('requests')}
                className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeSubTab === 'requests'
                    ? 'bg-[#A63D40] text-white shadow-xs'
                    : 'text-[#3C3836]/70 hover:bg-[#F9F7F2]'
                }`}
              >
                <Activity className="w-4 h-4" />
                My Posted Requests ({myRequests.length})
              </button>
              
              <button
                onClick={() => setActiveSubTab('pledges')}
                className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeSubTab === 'pledges'
                    ? 'bg-[#A63D40] text-white shadow-xs'
                    : 'text-[#3C3836]/70 hover:bg-[#F9F7F2]'
                }`}
              >
                <Heart className="w-4 h-4" />
                My Pledges to Donate ({myPledges.length})
              </button>
            </div>

            {/* Tab Contents */}
            {activeSubTab === 'requests' ? (
              myRequests.length === 0 ? (
                <div className="text-center py-14 px-4 bg-[#F9F7F2] rounded-3xl border border-dashed border-[#E5E1D8]">
                  <Droplet className="w-10 h-10 text-[#A63D40]/30 mx-auto mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest text-[#3C3836]">
                    No emergency blood requests created yet.
                  </p>
                  <p className="text-[11px] text-[#7C756E] mt-1 max-w-sm mx-auto">
                    When you or someone close needs blood, click "Request Blood Emergency" from the top bar to create a public broadcast.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {myRequests.map((req) => {
                    const deadlineInfo = formatDeadline(req.requiredBefore);
                    return (
                      <div
                        key={req.id}
                        onClick={() => onSelectRequest(req)}
                        className="p-5 rounded-[24px] bg-[#F9F7F2] border border-[#E5E1D8] hover:border-[#A63D40] hover:bg-white transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group shadow-2xs"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#A63D40] text-white font-serif font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {req.bloodGroup}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <h4 className="text-sm font-bold font-serif text-[#3C3836] group-hover:text-[#A63D40] transition-colors">
                                {req.patientName} • {req.hospital}
                              </h4>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  req.urgency === 'Critical'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-[#F1E9E0] text-[#3C3836] border border-[#E5E1D8]'
                                }`}
                              >
                                {req.urgency}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#7C756E]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#7C756E]" />
                                Posted {formatRelativeTime(req.createdAt)}
                              </span>
                              <span>•</span>
                              <span>
                                Needed: <strong className="text-[#3C3836] font-bold">{req.unitsNeeded} Units</strong>
                              </span>
                              <span>•</span>
                              <span className={deadlineInfo.isUrgent ? 'text-red-700 font-bold' : ''}>
                                {deadlineInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E5E1D8]">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              req.status === 'Open'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {req.status}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#A63D40] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Details <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : myPledges.length === 0 ? (
              <div className="text-center py-14 px-4 bg-[#F9F7F2] rounded-3xl border border-dashed border-[#E5E1D8]">
                <Heart className="w-10 h-10 text-[#7D8471]/30 mx-auto mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest text-[#3C3836]">
                  You haven't pledged to donate on any active requests yet.
                </p>
                <p className="text-[11px] text-[#7C756E] mt-1 max-w-sm mx-auto">
                  Browse urgent requests in the main feed and click "I Can Donate" to offer your life-saving blood unit.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {myPledges.map((pledge) => (
                  <div
                    key={pledge.id}
                    className="p-5 rounded-[24px] bg-[#F9F7F2] border border-[#E5E1D8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#7D8471] text-white font-serif font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {pledge.donorBloodGroup}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold font-serif text-[#3C3836]">
                          Pledged Group {pledge.donorBloodGroup} Blood Unit
                        </h4>
                        <p className="text-[11px] text-[#7C756E]">
                          Pledged {formatRelativeTime(pledge.createdAt)} • Status:{' '}
                          <span className={`font-bold uppercase ${
                            pledge.status === 'accepted' ? 'text-[#7D8471]' : 'text-[#3C3836]'
                          }`}>
                            {pledge.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    {pledge.status === 'accepted' ? (
                      <span className="px-4 py-2 bg-white text-[#3C3836] font-bold text-[11px] uppercase tracking-wider rounded-2xl border border-[#7D8471] flex items-center gap-2 shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-[#7D8471]" />
                        Contact Unlocked
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 bg-[#E5E1D8]/50 text-[#7C756E] font-bold text-[10px] uppercase tracking-wider rounded-full">
                        Pending Confirmation
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

