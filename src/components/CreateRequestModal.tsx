import React, { useState } from 'react';
import { BloodGroup, UrgencyLevel, BloodRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Droplet,
  MapPin,
  Calendar,
  Phone,
  AlertTriangle,
  Building2,
  FileText,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest: (requestData: Omit<BloodRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmitRequest,
}) => {
  const { userProfile, currentUser } = useAuth();

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(userProfile?.bloodGroup || 'O+');
  const [unitsNeeded, setUnitsNeeded] = useState<number>(1);
  const [hospital, setHospital] = useState('');
  const [address, setAddress] = useState(userProfile?.address || 'Central City Hospital');
  const [latitude, setLatitude] = useState<number>(userProfile?.latitude || 37.7749);
  const [longitude, setLongitude] = useState<number>(userProfile?.longitude || -122.4194);
  const [urgency, setUrgency] = useState<UrgencyLevel>('Urgent');
  const [requiredBeforeDate, setRequiredBeforeDate] = useState('');
  const [emergencyContact, setEmergencyContact] = useState(userProfile?.phone || '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const baseLat = userProfile?.latitude || latitude || 37.7749;
  const baseLng = userProfile?.longitude || longitude || -122.4194;

  // Preset location options relative to user's location
  const locationPresets = [
    { label: 'City General Hospital (Central)', address: '100 Medical Plaza, Central City', lat: baseLat, lng: baseLng },
    { label: 'Memorial Hospital (East Wing)', address: '450 East Parkway, East District', lat: baseLat + 0.012, lng: baseLng + 0.008 },
    { label: 'St. Jude Emergency Center', address: '820 Saint Jude Ave, Northside', lat: baseLat - 0.008, lng: baseLng - 0.015 },
    { label: 'University Trauma Care', address: '500 University Heights, West District', lat: baseLat - 0.018, lng: baseLng + 0.010 },
  ];

  const handlePresetSelect = (preset: typeof locationPresets[0]) => {
    setHospital(preset.label);
    setAddress(preset.address);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setAddress(`Current Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        (err) => {
          setErrorMsg('Could not detect current location. Please select or type hospital address.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!patientName.trim() || !hospital.trim() || !emergencyContact.trim()) {
      setErrorMsg('Please fill in all required fields (Patient Name, Hospital, and Emergency Contact).');
      return;
    }

    const defaultDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const finalRequiredBefore = requiredBeforeDate
      ? new Date(requiredBeforeDate).toISOString()
      : defaultDeadline;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSubmitRequest({
        userId: currentUser.uid,
        requesterName: userProfile?.name || currentUser.displayName || 'Requester',
        patientName,
        bloodGroup,
        unitsNeeded,
        hospital,
        address,
        city: address.split(',').pop()?.trim() || 'Central',
        latitude,
        longitude,
        urgency,
        description,
        requiredBefore: finalRequiredBefore,
        emergencyContact,
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to create blood request:', err);
      setErrorMsg(err.message || 'Failed to publish request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="create-request-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5E1D8]">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#F1E9E0] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F1E9E0] flex items-center justify-center text-[#A63D40]">
              <Droplet className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-[#3C3836]">Create Urgent Blood Request</h2>
              <p className="text-xs text-[#7C756E]">Notify compatible donors nearby immediately</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7C756E] hover:text-[#3C3836] rounded-xl hover:bg-[#F9F7F2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-[#F1E9E0] text-[#A63D40] text-xs font-medium rounded-2xl border border-[#E5E1D8] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Blood Group & Units Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-widest mb-1.5">
                Blood Group Needed *
              </label>
              <select
                id="blood-group-select"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                className="w-full px-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] font-bold focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
              >
                {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((bg) => (
                  <option key={bg} value={bg}>
                    Blood Group {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-widest mb-1.5">
                Units Required *
              </label>
              <input
                id="units-input"
                type="number"
                min={1}
                max={20}
                value={unitsNeeded}
                onChange={(e) => setUnitsNeeded(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] font-medium focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-widest mb-1.5">
                Urgency Level *
              </label>
              <select
                id="urgency-select"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full px-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] font-bold focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
              >
                <option value="Critical">🔴 Critical (Immediate)</option>
                <option value="Urgent">🟠 Urgent (Within 24h)</option>
                <option value="Normal">🔵 Normal (Planned)</option>
              </select>
            </div>
          </div>

          {/* Patient Name & Emergency Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-widest mb-1.5">
                Patient Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
                <input
                  id="patient-name-input"
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-sm focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-widest mb-1.5">
                Emergency Contact Phone *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
                <input
                  id="emergency-contact-input"
                  type="tel"
                  placeholder="+1 (555) 019-2834"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-sm focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-[#7C756E] mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7D8471] shrink-0" />
                Protected: Phone revealed only when donor is confirmed.
              </p>
            </div>
          </div>

          {/* Hospital & Address */}
          <div>
            <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-widest mb-1.5">
              Hospital Name *
            </label>
            <div className="relative mb-2">
              <Building2 className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
              <input
                id="hospital-name-input"
                type="text"
                placeholder="e.g. City General Hospital Emergency Center"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-sm focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-[11px] font-bold text-[#7C756E]">Quick Presets:</span>
              {locationPresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handlePresetSelect(preset)}
                  className="text-xs px-2.5 py-1 bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#3C3836] rounded-xl transition-colors border border-[#E5E1D8]"
                >
                  {preset.label.split('(')[0]}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                id="address-input"
                type="text"
                placeholder="Address / Area"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-xs text-[#3C3836] focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="px-3 py-2 bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#3C3836] font-bold text-xs rounded-xl flex items-center gap-1.5 border border-[#E5E1D8] shrink-0"
              >
                <MapPin className="w-3.5 h-3.5 text-[#A63D40]" />
                Detect GPS
              </button>
            </div>
          </div>

          {/* Needed Before Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-widest mb-1.5">
                Required Before (Date/Time)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
                <input
                  id="required-before-input"
                  type="datetime-local"
                  value={requiredBeforeDate}
                  onChange={(e) => setRequiredBeforeDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-sm focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-[#7C756E] mt-1">Leave empty for 24-hour default deadline</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-widest mb-1.5">
                Medical Notes / Context (Optional)
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
                <input
                  id="description-input"
                  type="text"
                  placeholder="e.g. Scheduled surgery tomorrow 9 AM, Room 304"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-sm focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-3 border-t border-[#F1E9E0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#F9F7F2] hover:bg-[#E5E1D8] text-[#3C3836] font-bold text-xs uppercase tracking-wider rounded-2xl transition-colors border border-[#E5E1D8]"
            >
              Cancel
            </button>
            <button
              id="submit-request-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#A63D40] hover:bg-[#8E3235] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Droplet className="w-4 h-4 fill-current" />
              {isSubmitting ? 'Publishing Request...' : 'Publish Request Now'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
