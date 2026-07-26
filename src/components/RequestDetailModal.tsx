import React, { useEffect, useState } from 'react';
import { BloodRequest, InterestedDonation } from '../types';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import {
  calculateDistanceKm,
  formatApproximateLocation,
  formatDeadline,
  formatRelativeTime
} from '../utils/bloodCompatibility';
import {
  X,
  Droplet,
  MapPin,
  Clock,
  Building2,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Heart,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Share2
} from 'lucide-react';

interface RequestDetailModalProps {
  request: BloodRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onExpressInterest: (request: BloodRequest) => Promise<void>;
  onUpdateRequestStatus: (requestId: string, status: BloodRequest['status']) => Promise<void>;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onExpressInterest,
  onUpdateRequestStatus,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [interestedDonors, setInterestedDonors] = useState<InterestedDonation[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const requestId = request?.id || null;

  // Distance for current user
  const userDistance =
    userProfile?.latitude && userProfile?.longitude && request?.latitude && request?.longitude
      ? calculateDistanceKm(
          userProfile.latitude,
          userProfile.longitude,
          request.latitude,
          request.longitude,
          userProfile.address,
          request.address
        )
      : calculateDistanceKm(
          userProfile?.latitude,
          userProfile?.longitude,
          request?.latitude,
          request?.longitude,
          userProfile?.address,
          request?.address
        );

  // Realtime subscription for interested donors
  useEffect(() => {
    if (!requestId || !isOpen) return;
    setLoadingDonors(true);

    const q = query(
      collection(db, 'interestedDonations'),
      where('requestId', '==', requestId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: InterestedDonation[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as InterestedDonation);
        });
        setInterestedDonors(list);
        setLoadingDonors(false);
      },
      (err) => {
        console.error('Error fetching interested donors:', err);
        setLoadingDonors(false);
      }
    );

    return () => unsubscribe();
  }, [requestId, isOpen]);

  if (!isOpen || !request) return null;

  const isRequester = currentUser?.uid === request.userId;
  const userPledge = interestedDonors.find((d) => d.donorId === currentUser?.uid);
  const isDonorConfirmed = request.status === 'Donor Confirmed' || request.status === 'Fulfilled';

  // Handle Accept Donor (Exchanges Phone Numbers securely)
  const handleAcceptDonor = async (donation: InterestedDonation) => {
    setActionLoading(true);
    try {
      // 1. Update pledge status to accepted
      const pledgeRef = doc(db, 'interestedDonations', donation.id);
      await updateDoc(pledgeRef, { status: 'accepted' });

      // 2. Update blood request status to Donor Confirmed and store accepted donor info
      const requestRef = doc(db, 'bloodRequests', request.id);
      await updateDoc(requestRef, {
        status: 'Donor Confirmed',
        acceptedDonorId: donation.donorId,
        acceptedDonorName: donation.donorName,
        acceptedDonorPhone: donation.donorPhone,
      });

      // 3. Create notification for the accepted donor
      await addDoc(collection(db, 'notifications'), {
        userId: donation.donorId,
        title: 'Interest Accepted! 🎉',
        message: `${request.requesterName} accepted your offer to donate ${request.bloodGroup} blood. Emergency Contact: ${request.emergencyContact}`,
        type: 'interest_accepted',
        requestId: request.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to accept donor:', err);
      handleFirestoreError(err, OperationType.UPDATE, `interestedDonations/${donation.id}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Decline Donor
  const handleDeclineDonor = async (donation: InterestedDonation) => {
    setActionLoading(true);
    try {
      const pledgeRef = doc(db, 'interestedDonations', donation.id);
      await updateDoc(pledgeRef, { status: 'declined' });
    } catch (err) {
      console.error('Failed to decline donor:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Share link helper
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `URGENT BLOOD NEEDED: Group ${request.bloodGroup}`,
        text: `Blood group ${request.bloodGroup} urgently needed at ${request.hospital} for ${request.patientName}.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const deadlineInfo = formatDeadline(request.requiredBefore);

  return (
    <div id="request-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-[32px] max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E5E1D8]">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#F1E9E0] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#A63D40] text-white font-serif font-black text-xl flex flex-col items-center justify-center shadow-md">
              {request.bloodGroup}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-serif text-[#3C3836]">{request.patientName}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  request.urgency === 'Critical' ? 'bg-[#A63D40]/10 text-[#A63D40]' : 'bg-[#7D8471]/20 text-[#3C3836]'
                }`}>
                  {request.urgency}
                </span>
              </div>
              <p className="text-xs text-[#7C756E]">
                Posted {formatRelativeTime(request.createdAt)} by {request.requesterName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 text-[#7C756E] hover:text-[#3C3836] rounded-xl hover:bg-[#F9F7F2] transition-colors"
              title="Share Request"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#7C756E] hover:text-[#3C3836] rounded-xl hover:bg-[#F9F7F2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Copy confirmation notification */}
        {copiedLink && (
          <div className="bg-[#3C3836] text-white text-xs py-2 text-center font-bold tracking-widest uppercase">
            Link copied to clipboard!
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* Key Stats Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-[#F9F7F2] rounded-[24px] border border-[#E5E1D8] text-center">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#7C756E] block">Units Needed</span>
              <span className="text-base font-bold font-serif text-[#3C3836]">{request.unitsNeeded} Unit(s)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#7C756E] block">Status</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                request.status === 'Open' ? 'bg-[#7D8471]/20 text-[#3C3836]' : 'bg-[#E5E1D8] text-[#3C3836]'
              }`}>
                {request.status}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#7C756E] block">Deadline</span>
              <span className="text-xs font-bold text-[#A63D40] block mt-0.5">{deadlineInfo.label}</span>
            </div>
          </div>

          {/* Hospital & Location Details */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-[#7C756E] uppercase tracking-widest">Hospital & Location</h3>
            <div className="p-4 bg-[#F9F7F2] rounded-[24px] border border-[#E5E1D8] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-bold font-serif text-[#3C3836] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#A63D40] shrink-0" />
                  {request.hospital}
                </div>
                <div className="text-xs text-[#3C3836]/80 flex items-center gap-1.5 pl-6">
                  <MapPin className="w-3.5 h-3.5 text-[#7C756E] shrink-0" />
                  {request.address}
                </div>
                {userDistance !== null && (
                  <p className="text-xs text-[#7C756E] font-medium pl-6">
                    Approx. <span className="font-bold text-[#3C3836]">{userDistance} km</span> from your location
                  </p>
                )}
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${request.hospital}, ${request.address}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-white hover:bg-[#F9F7F2] text-[#3C3836] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#E5E1D8] flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Map
              </a>
            </div>
          </div>

          {/* Medical Notes if present */}
          {request.description && (
            <div>
              <h3 className="text-[10px] font-bold text-[#7C756E] uppercase tracking-widest mb-2">Medical Notes</h3>
              <div className="p-4 bg-[#F1E9E0] rounded-[24px] border border-[#E5E1D8] text-[#3C3836] text-xs leading-relaxed">
                {request.description}
              </div>
            </div>
          )}

          {/* Contact Details (Gated & Protection Logic) */}
          <div className="p-5 bg-[#3C3836] text-white rounded-[24px] space-y-3 shadow-md border border-[#2A2725]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#A63D40]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#E5E1D8]">
                  Emergency Phone Contact
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-[#7D8471] border border-white/10 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Privacy Safeguard
              </span>
            </div>

            {/* Show contact number if requester, or if user is accepted donor */}
            {isRequester || (userPledge && userPledge.status === 'accepted') || isDonorConfirmed ? (
              <div className="p-3 bg-white/10 rounded-2xl flex items-center justify-between border border-white/10">
                <div>
                  <div className="text-[10px] text-[#E5E1D8] uppercase tracking-widest font-bold">Direct Contact Number:</div>
                  <div className="text-base font-bold font-serif text-white tracking-wide">
                    {request.emergencyContact}
                  </div>
                  {request.acceptedDonorName && (
                    <div className="text-xs text-[#7D8471] font-bold mt-1">
                      Confirmed Donor: {request.acceptedDonorName} ({request.acceptedDonorPhone})
                    </div>
                  )}
                </div>
                <a
                  href={`tel:${request.emergencyContact}`}
                  className="px-4 py-2 bg-[#7D8471] hover:bg-[#6B7260] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Now
                </a>
              </div>
            ) : (
              <p className="text-xs text-[#E5E1D8] leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/5">
                🔒 Emergency phone contact is protected until the requester reviews interested donors and accepts your pledge.
              </p>
            )}
          </div>

          {/* INTERESTED DONORS LIST (For Requester to Accept / Decline) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-[#7C756E] uppercase tracking-widest flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-[#A63D40] fill-current" />
                Interested Donors ({interestedDonors.length})
              </h3>
              {loadingDonors && <span className="text-xs text-[#7C756E]">Loading pledges...</span>}
            </div>

            {interestedDonors.length === 0 ? (
              <div className="text-center py-6 px-4 bg-[#F9F7F2] rounded-[24px] border border-dashed border-[#E5E1D8] text-[#7C756E] text-xs">
                No donors have expressed interest yet. Nearby compatible donors have been alerted!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {interestedDonors.map((donor) => (
                  <div
                    key={donor.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      donor.status === 'accepted'
                        ? 'bg-[#F1E9E0] border-[#7D8471]'
                        : donor.status === 'declined'
                        ? 'bg-[#F9F7F2] border-[#E5E1D8] opacity-60'
                        : 'bg-white border-[#E5E1D8] hover:border-[#A63D40]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#A63D40] text-white font-serif font-black text-xs flex items-center justify-center shrink-0">
                        {donor.donorBloodGroup}
                      </div>
                      <div>
                        <div className="text-xs font-bold font-serif text-[#3C3836] flex items-center gap-2">
                          {donor.donorName}
                          {donor.status === 'accepted' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#7D8471] text-white rounded-full">
                              ACCEPTED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#7C756E] mt-0.5">
                          Pledged {formatRelativeTime(donor.createdAt)}
                          {donor.donorPhone && (donor.status === 'accepted' || isRequester) && (
                            <span className="ml-2 font-bold text-[#3C3836]">• {donor.donorPhone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Requester Actions for Donor */}
                    {isRequester && donor.status === 'pending' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleAcceptDonor(donor)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-[#7D8471] hover:bg-[#6B7260] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineDonor(donor)}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#3C3836] text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-[#E5E1D8]"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REQUEST STATUS UPDATES (For Requester) */}
          {isRequester && (
            <div className="pt-4 border-t border-[#F1E9E0] flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-[#7C756E]">Manage Request Status:</span>
              <div className="flex items-center gap-2">
                {request.status !== 'Fulfilled' && (
                  <button
                    onClick={() => onUpdateRequestStatus(request.id, 'Fulfilled')}
                    className="px-3.5 py-2 bg-[#7D8471] hover:bg-[#6B7260] text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-xs transition-all"
                  >
                    Mark as Fulfilled
                  </button>
                )}
                {request.status !== 'Closed' && (
                  <button
                    onClick={() => onUpdateRequestStatus(request.id, 'Closed')}
                    className="px-3.5 py-2 bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#3C3836] text-xs font-bold uppercase tracking-wider rounded-2xl transition-all border border-[#E5E1D8]"
                  >
                    Close Request
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Donor Pledge Action if not owner */}
          {!isRequester && request.status === 'Open' && (
            <div className="pt-4 border-t border-[#F1E9E0] text-center">
              {userPledge ? (
                <div className="p-3 bg-[#F1E9E0] text-[#3C3836] rounded-2xl text-xs font-bold border border-[#E5E1D8] flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#7D8471]" />
                  You have pledged interest in this request. The requester will review and accept your offer!
                </div>
              ) : (
                <button
                  onClick={() => onExpressInterest(request)}
                  className="w-full py-3 bg-[#A63D40] hover:bg-[#8E3235] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Heart className="w-5 h-5 fill-current" />
                  I'm Available to Donate (Pledge Interest)
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
