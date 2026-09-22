/**
 * Monster Realms - Auth & Cloud Save Modal
 * Supports Google One-Tap/Popup, Email/Password sign up & login,
 * and Cloud Progress saving & loading.
 */

import React, { useState } from 'react';
import {
  X,
  Cloud,
  CloudUpload,
  CloudDownload,
  ShieldCheck,
  User,
  Mail,
  Lock,
  LogOut,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithGoogle,
  registerWithEmail,
  signInWithEmail,
  signOutUser,
  generateFriendCode,
  firebaseConfig,
} from '../../services/firebase';
import { PlayerProfile } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  profile: PlayerProfile | null;
  onSaveToCloud: () => Promise<void>;
  onLoadFromCloud: () => Promise<void>;
  isSaving: boolean;
  lastSavedAt: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  profile,
  onSaveToCloud,
  onLoadFromCloud,
  isSaving,
  lastSavedAt,
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(profile?.username || '');
  const [keepLocalData, setKeepLocalData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isUnauthorizedDomain = Boolean(
    error && (error.includes('unauthorized-domain') || error.includes('auth/unauthorized-domain'))
  );

  const friendCode = currentUser ? generateFriendCode(currentUser.uid) : 'GUEST-LOCAL';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyDomain = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      if (keepLocalData) {
        await onSaveToCloud();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setError(
          `Firebase: Error (auth/unauthorized-domain). The domain "${currentHostname || 'your site'}" is not yet listed under Authorized Domains in your Firebase project.`
        );
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (authMode === 'REGISTER') {
        await registerWithEmail(email, password, displayName || 'Adventurer');
        if (keepLocalData) {
          await onSaveToCloud();
        }
      } else {
        await signInWithEmail(email, password);
        await onLoadFromCloud();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password, or this email is not registered yet. If you are new or just created a project, click "Create Account" first!');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Switch to Sign In.');
      } else {
        setError(err.message || 'Authentication error. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FFFDF9] border-2 border-[#D8C7A5] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] border-b border-[#E8DCBE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-black text-[#5B3912] leading-tight">
                Account & Cloud Save
              </h2>
              <p className="text-[11px] font-medium text-[#854D0E]">
                {currentUser ? 'Connected Account' : 'Save your progress anywhere'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#854D0E] hover:bg-amber-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="space-y-2">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>

              {/* Specific Help Card for auth/unauthorized-domain */}
              {isUnauthorizedDomain && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-[#78350F] space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      How to Authorize This Domain in Firebase
                    </span>
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 underline decoration-amber-500"
                    >
                      <span>Open Firebase Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Google OAuth requires you to whitelist your hosting domain. In your Firebase Console, add{' '}
                    <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono font-bold">
                      {currentHostname || 'your host domain'}
                    </code>{' '}
                    to Authorized Domains:
                  </p>

                  <div className="p-2 bg-white/90 border border-amber-200 rounded-lg flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-slate-800 truncate font-semibold">
                      {currentHostname || 'monster-realm--deanvantessel.replit.app'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-[#78350F] text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedDomain ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Domain</span>
                        </>
                      )}
                    </button>
                  </div>

                  <ol className="list-decimal list-inside text-[11px] text-amber-900 space-y-1 pl-0.5">
                    <li>
                      Go to{' '}
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline text-amber-800 hover:text-amber-950"
                      >
                        Firebase Console &gt; Authentication &gt; Settings
                      </a>
                    </li>
                    <li>Scroll down to <strong>Authorized domains</strong> and click <strong>Add domain</strong></li>
                    <li>Paste the copied domain and click <strong>Save</strong></li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* LOGGED IN VIEW */}
          {currentUser ? (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2E7] border border-[#D5C29E] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#4A3822]">
                        {currentUser.displayName || profile?.username || 'Adventurer'}
                      </div>
                      <div className="text-[11px] text-[#8C765C] truncate max-w-[200px]">
                        {currentUser.email || 'Google Account'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Active
                  </span>
                </div>

                {/* Friend Code Strip */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-[#E8DCBE] rounded-lg">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C765C]">
                      Your Friend Code
                    </span>
                    <div className="font-mono font-black text-sm text-[#B45309] tracking-wider">
                      {friendCode}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[#78350F] text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Cloud Save Sync Status */}
                <div className="flex items-center justify-between text-xs text-[#78350F]">
                  <span className="font-medium">Cloud Save Status:</span>
                  <span className="font-mono text-[11px] text-[#8C765C]">
                    {lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Not synced yet'}
                  </span>
                </div>
              </div>

              {/* Cloud Sync Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onSaveToCloud}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5" />
                  )}
                  <span>Save Progress</span>
                </button>

                <button
                  onClick={onLoadFromCloud}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FCD34D] text-[#92400E] font-bold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>Load Cloud Save</span>
                </button>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer mt-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            /* NOT LOGGED IN / GUEST VIEW */
            <div className="space-y-4">
              {/* Guest Warning Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-[#78350F]">
                  <span className="font-bold block">Playing as Guest</span>
                  Log in or create an account to save your monsters, gold, and campaign stages across devices!
                </div>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#E8DCBE] w-full" />
                <span className="bg-[#FFFDF9] px-3 text-[11px] font-bold text-[#8C765C] uppercase tracking-wider">
                  or email
                </span>
                <div className="border-t border-[#E8DCBE] w-full" />
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-[#F4EBD7] p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthMode('LOGIN')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    authMode === 'LOGIN'
                      ? 'bg-white text-[#78350F] shadow-xs'
                      : 'text-[#8C765C] hover:text-[#5B3912]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('REGISTER')}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    authMode === 'REGISTER'
                      ? 'bg-white text-[#78350F] shadow-xs'
                      : 'text-[#8C765C] hover:text-[#5B3912]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmitEmailAuth} className="space-y-3">
                {authMode === 'REGISTER' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B3912] mb-1">
                      Player Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#8C765C] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. DragonKnight"
                        maxLength={25}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-[#D5C29E] rounded-xl text-xs text-[#4A3822] focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[#5B3912] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8C765C] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@realm.com"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#D5C29E] rounded-xl text-xs text-[#4A3822] focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5B3912] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8C765C] absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#D5C29E] rounded-xl text-xs text-[#4A3822] focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {authMode === 'REGISTER' && (
                  <label className="flex items-center gap-2 text-[11px] text-[#78350F] cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={keepLocalData}
                      onChange={(e) => setKeepLocalData(e.target.checked)}
                      className="rounded border-[#D5C29E] text-amber-600 focus:ring-amber-500"
                    />
                    <span>Upload my current monsters and progress to my new account</span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>{authMode === 'REGISTER' ? 'Register & Save Cloud Data' : 'Sign In'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
