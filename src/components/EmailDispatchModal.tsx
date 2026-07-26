import React from 'react';
import { EmailLog } from '../types';
import { Mail, CheckCircle2, MapPin, Droplet, Clock, X, ShieldCheck, ExternalLink } from 'lucide-react';

interface EmailDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: EmailLog[];
  requestDetails?: {
    patientName: string;
    hospital: string;
    bloodGroup: string;
  };
}

export const EmailDispatchModal: React.FC<EmailDispatchModalProps> = ({
  isOpen,
  onClose,
  logs,
  requestDetails,
}) => {
  if (!isOpen) return null;

  return (
    <div id="email-dispatch-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-[32px] max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-[#E5E1D8] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#F1E9E0] bg-[#7D8471] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-white/20 text-[10px] font-bold uppercase tracking-wider rounded-md">
                  Automated Radius Alert
                </span>
                <span className="text-xs text-white/80 font-medium">Within 5 km Radius</span>
              </div>
              <h2 className="text-lg font-bold font-serif tracking-tight">
                Emergency Email Dispatches ({logs.length})
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Summary Callout */}
          <div className="p-4 bg-[#F9F7F2] rounded-2xl border border-[#E5E1D8] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3C3836]">
              <CheckCircle2 className="w-4 h-4 text-[#7D8471] shrink-0" />
              <span>Matching Registered Donors Auto-Notified</span>
            </div>
            <p className="text-xs text-[#7C756E] leading-relaxed">
              Every registered voluntary donor located <strong>within 5 km</strong> of the request with a <strong>compatible blood group</strong> received an immediate emergency email dispatch.
            </p>
          </div>

          {logs.length === 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-[#E5E1D8] rounded-2xl p-6">
              <Mail className="w-8 h-8 text-[#E5E1D8] mx-auto" />
              <p className="text-sm font-bold font-serif text-[#3C3836]">No Registered Donors Found Within 5 km</p>
              <p className="text-xs text-[#7C756E] max-w-sm mx-auto">
                No active registered donors with compatible blood groups were located within the 5 km radius. The request is live on the public feed for all members.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-serif text-[#3C3836] uppercase tracking-wider">
                Sent Email Logs ({logs.length} Donor{logs.length > 1 ? 's' : ''})
              </h3>

              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-white rounded-2xl border border-[#E5E1D8] shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#3C3836]">{log.recipientName}</span>
                        <span className="text-xs text-[#7C756E] font-mono">({log.recipientEmail})</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#7C756E]">
                        <span className="flex items-center gap-1 font-semibold text-[#A63D40]">
                          <MapPin className="w-3.5 h-3.5" />
                          {log.distanceKm} km away (&lt; 5 km)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-[#3C3836]">
                          <Droplet className="w-3.5 h-3.5 text-[#A63D40]" />
                          Group {log.recipientBloodGroup} (Compatible)
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-[#7D8471]/15 text-[#7D8471] border border-[#7D8471]/30 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Email Delivered
                    </span>
                  </div>

                  {/* Email Body Preview */}
                  <div className="p-3 bg-[#F9F7F2] rounded-xl border border-[#F1E9E0] text-xs space-y-1.5 font-mono text-[#3C3836]">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#7C756E] font-sans">
                      Subject: {log.subject}
                    </div>
                    <div className="text-[11px] leading-relaxed whitespace-pre-line text-[#3C3836]/90 font-sans border-t border-[#E5E1D8] pt-1.5">
                      {log.body}
                    </div>
                  </div>

                  <div className="text-[10px] text-[#7C756E] flex items-center justify-between">
                    <span>Dispatched: {new Date(log.sentAt).toLocaleString()}</span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#7D8471]" />
                      Verified Registration Match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#F1E9E0] bg-[#F9F7F2] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#3C3836] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all"
          >
            Close Summary
          </button>
        </div>

      </div>
    </div>
  );
};
