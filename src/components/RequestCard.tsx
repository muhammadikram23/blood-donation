import React, { useState } from 'react';
import { BloodRequest, BloodGroup } from '../types';
import {
  calculateDistanceKm,
  canDonateBlood,
  formatApproximateLocation,
  formatDeadline,
  formatRelativeTime,
} from '../utils/bloodCompatibility';
import {
  Droplet,
  MapPin,
  Clock,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Heart,
  ChevronRight,
  ShieldCheck,
  User,
  PhoneCall
} from 'lucide-react';

interface RequestCardProps {
  request: BloodRequest;
  userBloodGroup?: BloodGroup;
  userLat?: number;
  userLng?: number;
  currentUserId?: string;
  hasUserResponded?: boolean;
  onExpressInterest: (request: BloodRequest) => Promise<void>;
  onSelectRequest: (request: BloodRequest) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  userBloodGroup,
  userLat,
  userLng,
  currentUserId,
  hasUserResponded = false,
  onExpressInterest,
  onSelectRequest,
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Calculate distance if coordinates are present
  const distanceKm =
    userLat && userLng && request.latitude && request.longitude
      ? calculateDistanceKm(userLat, userLng, request.latitude, request.longitude, 'User', request.address)
      : calculateDistanceKm(userLat, userLng, request.latitude, request.longitude, 'User', request.address);

  // Check blood compatibility
  const isCompatible = userBloodGroup
    ? canDonateBlood(userBloodGroup, request.bloodGroup)
    : false;

  const deadlineInfo = formatDeadline(request.requiredBefore);
  const approxLocation = formatApproximateLocation(request.address, request.city);

  const isOwner = currentUserId === request.userId;

  const handleInterestClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (submitting || hasUserResponded || isOwner) return;
    setSubmitting(true);
    try {
      await onExpressInterest(request);
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyBadge = () => {
    switch (request.urgency) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#A63D40] text-white shadow-xs animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F1E9E0] text-[#A63D40] border border-[#E5E1D8]">
            <Clock className="w-3 h-3 text-[#A63D40]" />
            URGENT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F9F7F2] text-[#7C756E] border border-[#E5E1D8]">
            Normal
          </span>
        );
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'Donor Confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#7D8471] text-white">
            Donor Confirmed
          </span>
        );
      case 'Fulfilled':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#7D8471]/20 text-[#7D8471] border border-[#7D8471]/30">
            Fulfilled
          </span>
        );
      case 'Closed':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#E5E1D8] text-[#7C756E]">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id={`request-card-${request.id}`}
      onClick={() => onSelectRequest(request)}
      className="bg-white rounded-[24px] border border-[#E5E1D8] hover:border-[#A63D40] shadow-xs hover:shadow-md transition-all duration-200 p-5 cursor-pointer relative overflow-hidden group flex flex-col justify-between"
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Blood Group Badge */}
            <div className="w-14 h-14 rounded-2xl bg-[#F9F7F2] border border-[#E5E1D8] flex flex-col items-center justify-center shrink-0 shadow-xs group-hover:bg-[#A63D40] group-hover:text-white transition-colors">
              <span className="text-xl font-black tracking-tight leading-none group-hover:text-white text-[#A63D40] font-serif">
                {request.bloodGroup}
              </span>
              <span className="text-[9px] font-bold tracking-widest uppercase opacity-70 mt-0.5">
                Needed
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#3C3836] font-serif group-hover:text-[#A63D40] transition-colors">
                  {request.patientName}
                </h3>
                {getUrgencyBadge()}
                {getStatusBadge()}
              </div>

              <p className="text-xs text-[#7C756E] mt-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#7C756E]" />
                <span className="font-semibold text-[#3C3836]">{request.hospital}</span>
              </p>
            </div>
          </div>

          {/* Compatibility Pill */}
          {userBloodGroup && isCompatible && request.status === 'Open' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#7D8471]/15 text-[#7D8471] border border-[#7D8471]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7D8471]" />
              Compatible
            </span>
          )}
        </div>

        {/* Units Needed & Location details */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-[#F9F7F2] rounded-2xl border border-[#F1E9E0] text-xs">
          <div>
            <span className="text-[#7C756E] text-[10px] font-bold uppercase tracking-wider block">Quantity Required:</span>
            <span className="font-bold text-[#3C3836]">
              {request.unitsNeeded || 1} Unit{(request.unitsNeeded || 1) > 1 ? 's' : ''}
            </span>
          </div>
          <div>
            <span className="text-[#7C756E] text-[10px] font-bold uppercase tracking-wider block">Location:</span>
            <span className="font-semibold text-[#3C3836] flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#A63D40] shrink-0" />
              {distanceKm !== null ? `${distanceKm} km away (${approxLocation})` : approxLocation}
            </span>
          </div>
        </div>

        {/* Description Snippet if present */}
        {request.description && (
          <p className="text-xs text-[#3C3836]/80 line-clamp-2 mb-3 italic bg-[#F9F7F2]/60 p-2.5 rounded-xl border border-[#E5E1D8]">
            "{request.description}"
          </p>
        )}
      </div>

      {/* Footer Info & Action */}
      <div className="mt-2 pt-3 border-t border-[#F1E9E0] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-[#7C756E]">
          <span className="flex items-center gap-1 text-[11px] font-medium" title="Posted time">
            <Clock className="w-3.5 h-3.5" />
            {formatRelativeTime(request.createdAt)}
          </span>
          <span
            className={`font-semibold text-[11px] ${
              deadlineInfo.isUrgent ? 'text-[#A63D40] font-bold' : 'text-[#7C756E]'
            }`}
          >
            {deadlineInfo.label}
          </span>
        </div>

        {/* Action Button */}
        {request.status === 'Open' && (
          <div>
            {isOwner ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#E5E1D8] text-[#3C3836]">
                Your Request
              </span>
            ) : hasUserResponded ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#7D8471]/15 text-[#7D8471] border border-[#7D8471]/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#7D8471]" />
                Interest Sent
              </span>
            ) : (
              <button
                id={`express-interest-btn-${request.id}`}
                onClick={handleInterestClick}
                disabled={submitting}
                className="px-4 py-2 bg-[#A63D40] hover:bg-[#8E3235] text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                {submitting ? 'Sending...' : "I'm Interested"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
