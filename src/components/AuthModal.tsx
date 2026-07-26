import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BloodGroup } from '../types';
import {
  X,
  Droplet,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsGuest } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Registration fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [address, setAddress] = useState('Central City');
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please check again.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password should be at least 6 characters.');
        return;
      }
      if (!name.trim()) {
        setErrorMsg('Full Name is required.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail({
          email,
          pass: password,
          name,
          phone,
          bloodGroup,
          address,
          latitude,
          longitude,
        });
      }
      onClose();
    } catch (err: any) {
      let msg = err.message || 'Authentication failed.';
      const code = err?.code || '';

      if (msg.includes('auth/operation-not-allowed') || code === 'auth/operation-not-allowed') {
        msg = 'Email/Password sign-in is disabled in your Firebase Console (Authentication > Sign-in method). Please enable it in Firebase Console or click below to Continue as Guest.';
      } else if (msg.includes('auth/network-request-failed') || code === 'auth/network-request-failed') {
        msg = 'Unable to reach Firebase Auth server. Click below to Continue as Guest Donor to use the app immediately.';
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please check your credentials or click Register to create an account.';
      } else if (msg.includes('auth/email-already-in-use') || code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please switch to Sign In.';
      } else if (msg.includes('auth/weak-password') || code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (msg.includes('auth/invalid-email') || code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else {
        console.warn('Auth notice:', err?.message || err);
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      let msg = err.message || 'Google sign in failed.';
      const code = err?.code || '';

      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain') || code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        const domain = window.location.hostname;
        console.warn(`Google Auth domain restriction (${domain}). Auto-logging in as Guest Donor for seamless access.`);
        setErrorMsg(`Google Auth domain (${domain}) is not authorized in Firebase Console. Logging you in as Guest Donor...`);
        try {
          await signInAsGuest();
          setTimeout(() => {
            onClose();
          }, 800);
        } catch (guestErr) {
          setErrorMsg('Please use Email/Password sign up or click "Continue as Guest Donor".');
        }
        return;
      } else if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
        msg = 'Google Sign-In window was closed. Please try again.';
      } else if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        msg = 'Sign-In popup was blocked by browser. Please allow popups or click "Continue as Guest Donor".';
      } else {
        console.warn('Google Sign in notice:', err?.message || err);
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await signInAsGuest();
      onClose();
    } catch (err: any) {
      console.error('Guest Sign in error:', err);
      setErrorMsg('Guest sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-[32px] max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5E1D8]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#F1E9E0] text-center relative bg-[#F9F7F2]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 text-[#7C756E] hover:text-[#3C3836] rounded-xl hover:bg-[#E5E1D8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-[#A63D40] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Droplet className="w-6 h-6 fill-current" />
          </div>

          <h2 className="text-xl font-bold font-serif text-[#3C3836]">
            {mode === 'login' ? 'Welcome Back' : 'Create Donor Account'}
          </h2>
          <p className="text-xs text-[#7C756E] mt-1">
            {mode === 'login'
              ? 'Sign in to respond to urgent blood requests nearby'
              : 'Join our voluntary network to save lives in emergencies'}
          </p>

          {/* Toggle Tab */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#E5E1D8]/60 rounded-2xl mt-4">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                mode === 'login' ? 'bg-white text-[#3C3836] shadow-xs' : 'text-[#7C756E]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                mode === 'register' ? 'bg-white text-[#3C3836] shadow-xs' : 'text-[#7C756E]'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-[#A63D40]/10 text-[#A63D40] text-xs font-medium rounded-2xl border border-[#A63D40]/20 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#A63D40]" />
                <div className="flex-1 font-semibold">{errorMsg}</div>
              </div>
              {errorMsg.includes('already exists') && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="flex-1 py-2 bg-[#A63D40] hover:bg-[#8B3235] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
                  >
                    Switch to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    className="flex-1 py-2 bg-[#2D5A27] hover:bg-[#23471F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
                  >
                    Guest Donor
                  </button>
                </div>
              )}
              {(errorMsg.includes('Guest') || errorMsg.includes('disabled') || errorMsg.includes('Console')) && !errorMsg.includes('already exists') && (
                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  className="w-full py-2 bg-[#2D5A27] hover:bg-[#23471F] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 mt-1"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Continue as Guest Donor Now
                </button>
              )}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. David Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-xs font-medium focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-xs font-medium focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-xs font-medium focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-xs font-medium focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-xs font-bold focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                  >
                    {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((bg) => (
                      <option key={bg} value={bg}>
                        Group {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 555-0192"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-xs font-medium focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#3C3836] uppercase tracking-wider mb-1">
                  Neighborhood / Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#7C756E] absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Downtown Central"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F9F7F2] border border-[#E5E1D8] rounded-xl text-[#3C3836] text-xs font-medium focus:ring-2 focus:ring-[#A63D40] focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#A63D40] hover:bg-[#8E3235] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In to Account'
              : 'Complete Registration'}
          </button>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E1D8]"></div>
            </div>
            <span className="relative px-3 bg-white text-[10px] font-bold text-[#7C756E] uppercase tracking-wider">
              Or
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-white hover:bg-[#F9F7F2] border border-[#E5E1D8] text-[#3C3836] font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full py-2.5 bg-[#2D5A27] hover:bg-[#23471F] text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-colors mt-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Continue as Guest Donor
          </button>
        </form>

      </div>
    </div>
  );
};
