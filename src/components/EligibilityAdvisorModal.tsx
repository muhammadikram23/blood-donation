import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Stethoscope, AlertCircle, CheckCircle2, Clock, HelpCircle, Send, RefreshCw, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BloodGroup } from '../types';

interface EligibilityAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBloodGroup?: BloodGroup;
}

const PRESET_QUESTIONS = [
  { label: '💉 Got a tattoo 3 months ago', query: 'I got a new tattoo 3 months ago at a professional parlor. Can I safely donate blood now?' },
  { label: '💊 Took antibiotics yesterday', query: 'I finished taking antibiotics yesterday for a mild sinus infection. Am I eligible to donate today?' },
  { label: '🩸 Donated blood 2 months ago', query: 'I donated whole blood 8 weeks ago. When am I eligible to donate whole blood again?' },
  { label: '✈️ Traveled internationally', query: 'I traveled to a malaria-endemic region 2 months ago. What is the standard deferral time before donating?' },
  { label: '🤒 Had fever & flu last week', query: 'I had a fever and flu last week but feel fully recovered today. Can I donate blood?' },
  { label: '🦷 Dental extraction', query: 'I had a tooth extraction 5 days ago with minor surgery. How long should I wait before donating?' }
];

export const EligibilityAdvisorModal: React.FC<EligibilityAdvisorModalProps> = ({
  isOpen,
  onClose,
  userBloodGroup = 'O+'
}) => {
  const [question, setQuestion] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>(userBloodGroup);
  const [age, setAge] = useState<string>('25');
  const [weightKg, setWeightKg] = useState<string>('65');
  const [loading, setLoading] = useState(false);
  const [advisorResponse, setAdvisorResponse] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset state on modal open or when logged-in user changes to protect user privacy
  useEffect(() => {
    if (isOpen) {
      setQuestion('');
      setAge('');
      setWeightKg('');
      setAdvisorResponse(null);
      setErrorMsg(null);
      setLoading(false);
      setSelectedBloodGroup(userBloodGroup || 'O+');
    }
  }, [isOpen, userBloodGroup]);

  if (!isOpen) return null;

  const handleAsk = async (queryText?: string) => {
    const activeQuery = (queryText || question).trim();
    if (!activeQuery) return;

    setLoading(true);
    setErrorMsg(null);
    setAdvisorResponse(null);

    try {
      const res = await fetch('/api/eligibility-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: activeQuery,
          bloodGroup: selectedBloodGroup,
          age,
          weightKg
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect to AI Advisor');
      }

      setAdvisorResponse(data.answer);
    } catch (err: any) {
      console.error('Advisor Error:', err);
      setErrorMsg(err.message || 'Something went wrong while consulting the AI Advisor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (presetQuery: string) => {
    setQuestion(presetQuery);
    handleAsk(presetQuery);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#991B1B] via-[#7F1D1D] to-[#450A0A] p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20">
                <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-400/20 text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300/30">
                  Powered by Gemini AI
                </span>
                <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                  Blood Donor Eligibility & Health Advisor
                </h2>
              </div>
            </div>
            <p className="text-xs text-red-100/90 leading-relaxed max-w-xl">
              Ask any medical or eligibility question (medications, tattoos, travel, fever) to instantly check official donation guidelines.
            </p>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Quick Context Inputs */}
            <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Blood Group
                </label>
                <select
                  value={selectedBloodGroup}
                  onChange={(e) => setSelectedBloodGroup(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#991B1B]"
                >
                  {['A+', 'O+', 'B+', 'AB+', 'A-', 'O-', 'B-', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#991B1B]"
                  placeholder="e.g. 25"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#991B1B]"
                  placeholder="e.g. 65"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-[#991B1B]" />
                Common Eligibility Scenarios (Click to test)
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_QUESTIONS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(preset.query)}
                    className="text-xs bg-red-50/80 hover:bg-red-100/80 text-[#991B1B] font-medium px-3 py-1.5 rounded-xl border border-red-200/60 transition-colors text-left"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Question Area */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                Ask Specific Question
              </label>
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. 'I got a tattoo 3 months ago, can I donate O+ blood?' or 'I had tooth extraction 4 days ago...'"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-2xl p-3.5 pr-12 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#991B1B] min-h-[90px] resize-none"
                />
                <button
                  onClick={() => handleAsk()}
                  disabled={loading || !question.trim()}
                  className="absolute right-3 bottom-3 p-2 bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-40 text-white rounded-xl transition-all flex items-center justify-center shadow-md"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Response Area */}
            {loading && (
              <div className="p-6 bg-gradient-to-br from-red-50/50 to-amber-50/50 border border-red-100 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
                <div className="relative">
                  <div className="w-10 h-10 border-4 border-red-200 border-t-[#991B1B] rounded-full animate-spin" />
                  <Stethoscope className="w-4 h-4 text-[#991B1B] absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-800">Analyzing Medical Eligibility Guidelines...</p>
                  <p className="text-[11px] text-gray-500">Checking WHO & Red Cross blood donation safety standards</p>
                </div>
              </div>
            )}

            {advisorResponse && !loading && (
              <div className="bg-gradient-to-br from-gray-50 via-white to-red-50/20 border border-gray-200 rounded-2xl p-5 space-y-3 relative shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/80">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#991B1B]" />
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      AI Health Assessment
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">
                    Verified Guidelines
                  </span>
                </div>

                <div className="prose prose-xs max-w-none text-xs text-gray-800 leading-relaxed space-y-2">
                  <ReactMarkdown>{advisorResponse}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Always consult the medical staff at your local donor clinic for final eligibility.</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
