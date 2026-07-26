import React, { useEffect, useState } from 'react';
import { BloodGroup, UserProfile } from '../types';
import { db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { calculateDistanceKm, formatApproximateLocation } from '../utils/bloodCompatibility';
import { Search, MapPin, Droplet, Filter, Phone, CheckCircle2, User, ShieldCheck } from 'lucide-react';

export const DonorSearch: React.FC = () => {
  const { userProfile } = useAuth();
  const [donors, setDonors] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState<number>(0); // 0 = any distance
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        });
        setDonors(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching donors:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter donors based on user criteria
  const filteredDonors = donors.filter((donor) => {
    // 1. Group filter
    if (selectedGroup !== 'ALL' && donor.bloodGroup !== selectedGroup) return false;

    // 2. Availability filter
    if (onlyAvailable && !donor.isAvailableDonor) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = donor.name.toLowerCase().includes(q);
      const matchAddress = donor.address?.toLowerCase().includes(q);
      if (!matchName && !matchAddress) return false;
    }

    // 4. Distance filter
    if (maxDistance > 0 && userProfile?.latitude && userProfile?.longitude && donor.latitude && donor.longitude) {
      const dist = calculateDistanceKm(
        userProfile.latitude,
        userProfile.longitude,
        donor.latitude,
        donor.longitude,
        userProfile.address,
        donor.address
      );
      if (dist > maxDistance) return false;
    }

    return true;
  });

  return (
    <div id="donor-directory-page" className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-[#7D8471] text-white rounded-[32px] p-6 sm:p-8 shadow-md border border-[#6B7260]">
        <div className="max-w-2xl">
          <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/20 inline-block mb-3">
            Searchable Voluntary Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
            Registered Blood Donor Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#F1E9E0] mt-2 leading-relaxed opacity-90">
            Find registered donors nearby filtered by blood compatibility, location radius, and real-time availability.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-[32px] border border-[#E5E1D8] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search donor name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-medium text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
            />
          </div>

          {/* Blood Group Selector */}
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

          {/* Max Distance Filter */}
          <div>
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs font-bold text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
            >
              <option value={0}>Any Radius</option>
              <option value={5}>Within 5 km radius</option>
              <option value={10}>Within 10 km radius</option>
              <option value={15}>Within 15 km radius</option>
              <option value={25}>Within 25 km radius</option>
            </select>
          </div>

        </div>

        {/* Toggle Availability */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F1E9E0] text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 text-[#A63D40] rounded border-[#E5E1D8] focus:ring-[#A63D40]"
            />
            <span className="font-semibold text-[#3C3836]">Show Available Donors Only</span>
          </label>

          <span className="text-[#7C756E] text-[10px] font-bold uppercase tracking-widest">
            Found {filteredDonors.length} Donor(s)
          </span>
        </div>
      </div>

      {/* Donors Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs font-bold uppercase tracking-widest text-[#7C756E]">Loading donor directory...</div>
      ) : filteredDonors.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[32px] border border-dashed border-[#E5E1D8] space-y-2">
          <Droplet className="w-10 h-10 text-[#E5E1D8] mx-auto" />
          <h3 className="text-sm font-bold font-serif text-[#3C3836]">No Donors Match Criteria</h3>
          <p className="text-xs text-[#7C756E] max-w-sm mx-auto">
            Try expanding your distance radius or selecting "All Blood Groups" to view more registered voluntary donors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonors.map((donor) => {
            const dist =
              userProfile?.latitude && userProfile?.longitude && donor.latitude && donor.longitude
                ? calculateDistanceKm(userProfile.latitude, userProfile.longitude, donor.latitude, donor.longitude, userProfile.address, donor.address)
                : calculateDistanceKm(userProfile?.latitude, userProfile?.longitude, donor.latitude, donor.longitude, userProfile?.address, donor.address);

            return (
              <div
                key={donor.id}
                className="bg-white rounded-[24px] border border-[#E5E1D8] p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#E5E1D8] border border-[#D6D2C9] overflow-hidden shrink-0">
                        <img
                          src={donor.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${donor.name}`}
                          alt={donor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold font-serif text-[#3C3836]">{donor.name}</h3>
                        <p className="text-[11px] text-[#7C756E] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#A63D40] shrink-0" />
                          {formatApproximateLocation(donor.address)}
                        </p>
                      </div>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-[#A63D40] text-white font-serif font-black text-sm flex flex-col items-center justify-center shrink-0 shadow-xs">
                      {donor.bloodGroup}
                    </div>
                  </div>

                  {dist !== null && (
                    <div className="p-2.5 bg-[#F9F7F2] rounded-xl border border-[#F1E9E0] text-xs font-semibold text-[#3C3836] mb-3 flex items-center justify-between">
                      <span className="text-[#7C756E] text-[10px] font-bold uppercase tracking-wider">Distance:</span>
                      <span>~{dist} km away</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F1E9E0] flex items-center justify-between text-xs">
                  <span
                    className={`font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                      donor.isAvailableDonor ? 'text-[#7D8471]' : 'text-[#7C756E]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        donor.isAvailableDonor ? 'bg-[#7D8471]' : 'bg-[#E5E1D8]'
                      }`}
                    ></span>
                    {donor.isAvailableDonor ? 'Available to Donate' : 'Unavailable'}
                  </span>

                  <span className="text-[10px] text-[#7C756E] font-bold uppercase tracking-widest">Verified Member</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
