import React, { useEffect, useState } from 'react';
import { BloodRequest, BloodGroup, UrgencyLevel, RequestStatus } from '../types';
import { db } from '../firebase';
import { collection, query, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { RequestCard } from './RequestCard';
import {
  calculateDistanceKm,
  canDonateBlood,
  RECIPIENT_COMPATIBILITY_MAP,
  DONOR_COMPATIBILITY_MAP
} from '../utils/bloodCompatibility';
import {
  Search,
  Filter,
  PlusCircle,
  Activity,
  Heart,
  ShieldCheck,
  MapPin,
  Clock,
  Droplet,
  Info,
  SlidersHorizontal,
  Sparkles,
  Stethoscope
} from 'lucide-react';

interface HomeFeedProps {
  onOpenCreateModal: () => void;
  onOpenAuthModal: () => void;
  onOpenAdvisorModal?: () => void;
  onSelectRequest: (request: BloodRequest) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  onOpenCreateModal,
  onOpenAuthModal,
  onOpenAdvisorModal,
  onSelectRequest,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [userPledges, setUserPledges] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'ALL'>('ALL');
  const [compatibleOnly, setCompatibleOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(0); // 0 = any
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('Open');
  const [feedTab, setFeedTab] = useState<'all' | 'compatible' | 'mine'>('all');

  // Fetch Blood Requests Realtime
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'bloodRequests'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: BloodRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as BloodRequest);
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to blood requests:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch User's expressed pledges realtime
  useEffect(() => {
    if (!currentUser) {
      setUserPledges({});
      return;
    }

    const q = query(collection(db, 'interestedDonations'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const map: Record<string, boolean> = {};
        snap.forEach((d) => {
          const data = d.data();
          if (data.donorId === currentUser.uid) {
            map[data.requestId] = true;
          }
        });
        setUserPledges(map);
      },
      (err) => {
        console.warn('Interested donations listener warning:', err.message);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // Handle Expressing Interest (Module 5 & 6)
  const handleExpressInterest = async (request: BloodRequest) => {
    if (!currentUser) {
      onOpenAuthModal();
      return;
    }

    try {
      // 1. Add record to interestedDonations collection
      await addDoc(collection(db, 'interestedDonations'), {
        requestId: request.id,
        donorId: currentUser.uid,
        donorName: userProfile?.name || currentUser.displayName || 'Anonymous Donor',
        donorBloodGroup: userProfile?.bloodGroup || 'O+',
        donorPhone: userProfile?.phone || '',
        donorAddress: userProfile?.address || '',
        donorLatitude: userProfile?.latitude || 0,
        donorLongitude: userProfile?.longitude || 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      // 2. Send in-app notification to requester
      await addDoc(collection(db, 'notifications'), {
        userId: request.userId,
        title: 'New Interested Donor! ❤️',
        message: `${userProfile?.name || 'A volunteer'} (Group ${userProfile?.bloodGroup || 'O+'}) is available to donate blood for ${request.patientName}.`,
        type: 'interest_received',
        requestId: request.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // 3. Update local state
      setUserPledges((prev) => ({ ...prev, [request.id]: true }));
    } catch (err) {
      console.error('Failed to express interest:', err);
    }
  };

  // Filter Logic
  const filteredRequests = requests.filter((req) => {
    // Tab filter
    if (feedTab === 'mine' && req.userId !== currentUser?.uid) return false;
    if (feedTab === 'compatible') {
      if (!userProfile?.bloodGroup) return false;
      if (!canDonateBlood(userProfile.bloodGroup, req.bloodGroup)) return false;
    }

    // Status Filter
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

    // Blood Group Filter
    if (selectedGroup !== 'ALL' && req.bloodGroup !== selectedGroup) return false;

    // Compatible Only Toggle
    if (compatibleOnly && userProfile?.bloodGroup) {
      if (!canDonateBlood(userProfile.bloodGroup, req.bloodGroup)) return false;
    }

    // Urgency Filter
    if (urgencyFilter !== 'ALL' && req.urgency !== urgencyFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPatient = req.patientName.toLowerCase().includes(q);
      const matchHospital = req.hospital.toLowerCase().includes(q);
      const matchCity = req.address.toLowerCase().includes(q);
      const matchGroup = req.bloodGroup.toLowerCase().includes(q);
      if (!matchPatient && !matchHospital && !matchCity && !matchGroup) return false;
    }

    // Distance Radius
    if (
      maxDistance > 0 &&
      userProfile?.latitude &&
      userProfile?.longitude &&
      req.latitude &&
      req.longitude
    ) {
      const dist = calculateDistanceKm(
        userProfile.latitude,
        userProfile.longitude,
        req.latitude,
        req.longitude,
        userProfile.address,
        req.address
      );
      if (dist > maxDistance) return false;
    }

    return true;
  });

  return (
    <div id="home-feed-view" className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Hero Announcement Banner */}
      <div className="bg-[#3C3836] text-white rounded-[32px] p-6 sm:p-8 relative overflow-hidden shadow-md border border-[#2A2725]">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A63D40] text-white text-[10px] font-bold uppercase tracking-widest border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            Live Emergency Network
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold font-serif tracking-tight leading-tight">
            Connect Instantly with Voluntary Blood Donors Nearby
          </h1>
          <p className="text-xs sm:text-sm text-[#E5E1D8] leading-relaxed opacity-90">
            Every second counts in medical emergencies. When a request is published, compatible registered donors within 20 km automatically receive instant emergency in-app alerts!
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={currentUser ? onOpenCreateModal : onOpenAuthModal}
              className="px-5 py-2.5 bg-[#A63D40] hover:bg-[#8E3235] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Post Emergency Request
            </button>
            {onOpenAdvisorModal && (
              <button
                onClick={onOpenAdvisorModal}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#3C3836] font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md flex items-center gap-2 transition-all active:scale-95"
              >
                <Stethoscope className="w-4 h-4" />
                AI Health Advisor
              </button>
            )}
            {userProfile && (
              <div className="text-xs text-[#E5E1D8] font-semibold px-3 py-2 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7D8471]" />
                Your Blood Group: <span className="font-bold text-white bg-[#A63D40] px-2 py-0.5 rounded-md">{userProfile.bloodGroup}</span>
              </div>
            )}
          </div>
        </div>

        {/* Decorative Watermark */}
        <Droplet className="w-72 h-72 text-white/5 absolute -right-12 -bottom-16 fill-current pointer-events-none hidden md:block" />
      </div>

      {/* Filter & Control Toolbar */}
      <div className="bg-white p-4 sm:p-6 rounded-[32px] border border-[#E5E1D8] shadow-xs space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#F1E9E0] pb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFeedTab('all')}
              className={`px-4 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                feedTab === 'all'
                  ? 'bg-[#A63D40] text-white shadow-xs'
                  : 'text-[#3C3836]/70 hover:bg-[#F9F7F2]'
              }`}
            >
              All Live Requests
            </button>

            {userProfile && (
              <button
                onClick={() => setFeedTab('compatible')}
                className={`px-4 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  feedTab === 'compatible'
                    ? 'bg-[#A63D40] text-white shadow-xs'
                    : 'text-[#3C3836]/70 hover:bg-[#F9F7F2]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#7D8471]" />
                Compatible For Me ({userProfile.bloodGroup})
              </button>
            )}

            {currentUser && (
              <button
                onClick={() => setFeedTab('mine')}
                className={`px-4 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                  feedTab === 'mine'
                    ? 'bg-[#A63D40] text-white shadow-xs'
                    : 'text-[#3C3836]/70 hover:bg-[#F9F7F2]'
                }`}
              >
                My Requests
              </button>
            )}
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-[#7C756E]">
            Showing {filteredRequests.length} Request(s)
          </span>
        </div>

        {/* Search & Select Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search patient, hospital, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-medium text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
            />
          </div>

          {/* Blood Group Filter */}
          <div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-bold text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
            >
              <option value="ALL">All Blood Groups</option>
              {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((bg) => (
                <option key={bg} value={bg}>
                  Blood Group {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Distance Radius Filter */}
          <div>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-bold text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
            >
              <option value={0}>Any Radius</option>
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={15}>Within 15 km</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-bold text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
            >
              <option value="ALL">All Urgencies</option>
              <option value="Critical">🔴 Critical</option>
              <option value="Urgent">🟠 Urgent</option>
              <option value="Normal">🔵 Normal</option>
            </select>
          </div>

        </div>

        {/* Toggles Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F1E9E0] text-xs flex-wrap gap-2">
          <div className="flex items-center gap-4">
            {userProfile && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={compatibleOnly}
                  onChange={(e) => setCompatibleOnly(e.target.checked)}
                  className="w-4 h-4 text-[#A63D40] rounded border-[#E5E1D8] focus:ring-[#A63D40]"
                />
                <span className="font-semibold text-[#3C3836]">
                  Only show requests I can donate to ({userProfile.bloodGroup})
                </span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-2 text-[#7C756E] font-medium text-xs">
            <span>Show Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 bg-[#F9F7F2] border border-[#E5E1D8] rounded-lg text-xs font-bold text-[#3C3836]"
            >
              <option value="Open">Open Only</option>
              <option value="Donor Confirmed">Donor Confirmed</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>
        </div>

      </div>

      {/* Main Request Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs font-bold uppercase tracking-widest text-[#7C756E]">Syncing live requests...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[32px] border border-dashed border-[#E5E1D8] space-y-3">
          <Droplet className="w-12 h-12 text-[#E5E1D8] mx-auto" />
          <h3 className="text-base font-bold font-serif text-[#3C3836]">No Active Blood Requests Found</h3>
          <p className="text-xs text-[#7C756E] max-w-md mx-auto">
            No blood requests match your selected filters. Try broadening your distance radius or selecting "All Blood Groups".
          </p>
          <button
            onClick={currentUser ? onOpenCreateModal : onOpenAuthModal}
            className="px-5 py-2.5 bg-[#A63D40] hover:bg-[#8E3235] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-sm inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Create Request for Someone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              userBloodGroup={userProfile?.bloodGroup}
              userLat={userProfile?.latitude}
              userLng={userProfile?.longitude}
              currentUserId={currentUser?.uid}
              hasUserResponded={!!userPledges[req.id]}
              onExpressInterest={handleExpressInterest}
              onSelectRequest={onSelectRequest}
            />
          ))}
        </div>
      )}

      {/* Blood Compatibility Guide Box */}
      <div className="p-6 bg-[#F1E9E0] rounded-[32px] border border-[#E5E1D8] space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-[#A63D40]" />
          <h3 className="text-sm font-bold font-serif text-[#3C3836]">Medical Compatibility Guide</h3>
        </div>
        <p className="text-xs text-[#3C3836]/80 leading-relaxed">
          <strong className="text-[#A63D40]">Group O-</strong> is the universal red blood cell donor and can donate to all blood groups. <strong className="text-[#A63D40]">Group AB+</strong> is the universal recipient and can receive blood from any group. Our system automatically alerts only compatible voluntary donors nearby!
        </p>
      </div>

    </div>
  );
};
