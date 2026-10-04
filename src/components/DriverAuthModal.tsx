import React, { useState } from 'react';
import { DriverProfile } from '../game/types';
import { awardDriverXp, computeLicenseClass, getStoredAccounts, saveDriverProfile } from '../game/driverProfile';
import {
  Award,
  Check,
  Compass,
  Crown,
  Flame,
  Gauge,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  Shield,
  Sparkles,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';

interface DriverAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverProfile: DriverProfile;
  onUpdateProfile: (profile: DriverProfile) => void;
}

type AuthTab = 'profile' | 'signin' | 'register';

export const DriverAuthModal: React.FC<DriverAuthModalProps> = ({
  isOpen,
  onClose,
  driverProfile,
  onUpdateProfile,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>(driverProfile.isGuest ? 'signin' : 'profile');

  // Sign in form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');

  // Register form state
  const [regCallsign, setRegCallsign] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAvatar, setRegAvatar] = useState<DriverProfile['avatar']>('hornet');
  const [regError, setRegError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const avatarOptions: { id: DriverProfile['avatar']; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'hornet', label: 'Hudson Hornet', icon: <Crown className="w-5 h-5 text-amber-400" />, color: 'from-amber-600/30 to-amber-950/50' },
    { id: 'helmet', label: 'Pro Pilot', icon: <Shield className="w-5 h-5 text-cyan-400" />, color: 'from-cyan-600/30 to-cyan-950/50' },
    { id: 'legend', label: 'Apex Legend', icon: <Trophy className="w-5 h-5 text-purple-400" />, color: 'from-purple-600/30 to-purple-950/50' },
    { id: 'turbo', label: 'Twin Turbo', icon: <Zap className="w-5 h-5 text-emerald-400" />, color: 'from-emerald-600/30 to-emerald-950/50' },
    { id: 'viper', label: 'Drift King', icon: <Flame className="w-5 h-5 text-rose-400" />, color: 'from-rose-600/30 to-rose-950/50' },
    { id: 'rebel', label: 'Midnight Rebel', icon: <Sparkles className="w-5 h-5 text-sky-400" />, color: 'from-sky-600/30 to-sky-950/50' },
  ];

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');

    if (!signInEmail.trim() || !signInPassword.trim()) {
      setSignInError('Please enter both your email/callsign and password.');
      return;
    }

    const accounts = getStoredAccounts();
    const key = signInEmail.trim().toLowerCase();
    const existing = accounts[key] || Object.values(accounts).find(a => a.callsign.toLowerCase() === key);

    if (existing) {
      const loggedInProfile: DriverProfile = {
        ...existing,
        isGuest: false,
      };
      saveDriverProfile(loggedInProfile);
      onUpdateProfile(loggedInProfile);
      setSuccessMsg(`Welcome back, Driver ${loggedInProfile.callsign}!`);
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('profile');
      }, 1000);
    } else {
      // Auto-create/demo login if new
      const newProfile: DriverProfile = {
        id: 'driver_' + Date.now(),
        callsign: signInEmail.split('@')[0] || 'Driver',
        email: signInEmail.includes('@') ? signInEmail : `${signInEmail}@apex.io`,
        avatar: 'hornet',
        level: 2,
        xp: 320,
        nextLevelXp: 750,
        cash: 15000,
        licenseClass: 'Class C (Rookie)',
        stats: {
          totalDistanceKm: 12.4,
          topSpeedKmh: 245,
          highestDriftScore: 5600,
          missionsCompleted: 2,
          goldMedals: 1,
          favoriteCar: 'hudson_hornet',
        },
        isGuest: false,
        createdAt: new Date().toISOString(),
      };
      saveDriverProfile(newProfile);
      onUpdateProfile(newProfile);
      setSuccessMsg(`Welcome to the circuit, Driver ${newProfile.callsign}!`);
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('profile');
      }, 1000);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regCallsign.trim()) {
      setRegError('Please choose a driver callsign.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please provide a valid racing email address.');
      return;
    }
    if (regPassword.length < 4) {
      setRegError('Password should be at least 4 characters.');
      return;
    }

    const newProfile: DriverProfile = {
      id: 'driver_' + Date.now(),
      callsign: regCallsign.trim(),
      email: regEmail.trim(),
      avatar: regAvatar,
      level: 1,
      xp: 0,
      nextLevelXp: 400,
      cash: 12000,
      licenseClass: 'Class C (Rookie)',
      stats: {
        totalDistanceKm: 0,
        topSpeedKmh: 0,
        highestDriftScore: 0,
        missionsCompleted: 0,
        goldMedals: 0,
        favoriteCar: 'hudson_hornet',
      },
      isGuest: false,
      createdAt: new Date().toISOString(),
    };

    saveDriverProfile(newProfile);
    onUpdateProfile(newProfile);
    setSuccessMsg(`Racing License issued for ${newProfile.callsign}!`);
    setTimeout(() => {
      setSuccessMsg('');
      setActiveTab('profile');
    }, 1200);
  };

  const handlePlayAsGuest = () => {
    const guestProfile: DriverProfile = {
      id: 'guest_' + Date.now(),
      callsign: `Racer_${Math.floor(100 + Math.random() * 900)}`,
      email: 'guest@apexhorizon.com',
      avatar: 'hornet',
      level: 1,
      xp: 100,
      nextLevelXp: 500,
      cash: 10000,
      licenseClass: 'Class C (Rookie)',
      stats: {
        totalDistanceKm: 0,
        topSpeedKmh: 0,
        highestDriftScore: 0,
        missionsCompleted: 0,
        goldMedals: 0,
        favoriteCar: 'hudson_hornet',
      },
      isGuest: true,
      createdAt: new Date().toISOString(),
    };
    saveDriverProfile(guestProfile);
    onUpdateProfile(guestProfile);
    onClose();
  };

  const handleSignOut = () => {
    const guestProfile: DriverProfile = {
      id: 'guest_' + Date.now(),
      callsign: 'Guest Driver',
      email: 'guest@apexhorizon.com',
      avatar: 'helmet',
      level: 1,
      xp: 0,
      nextLevelXp: 500,
      cash: 10000,
      licenseClass: 'Class C (Rookie)',
      stats: {
        totalDistanceKm: 0,
        topSpeedKmh: 0,
        highestDriftScore: 0,
        missionsCompleted: 0,
        goldMedals: 0,
        favoriteCar: 'apex_gt',
      },
      isGuest: true,
      createdAt: new Date().toISOString(),
    };
    saveDriverProfile(guestProfile);
    onUpdateProfile(guestProfile);
    setActiveTab('signin');
  };

  const xpPercentage = Math.min(100, Math.round((driverProfile.xp / Math.max(1, driverProfile.nextLevelXp)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header with Title & Close Button */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">Driver License & Sign-In</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {driverProfile.isGuest ? 'Guest Mode' : 'Verified Racer'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Manage telemetry records, license progression, and save credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 mt-4 p-1 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Driver License</span>
          </button>
          <button
            onClick={() => setActiveTab('signin')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
          </button>
        </div>

        {/* Success / Notification Banner */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 custom-scrollbar">
          {/* TAB 1: DRIVER PROFILE & RACING LICENSE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Holographic Driver License Card */}
              <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-700/80 shadow-2xl">
                {/* Background circuit lines accent */}
                <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                  <Crown className="w-48 h-48 text-amber-400" />
                </div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-900/40 border border-amber-500/50 flex items-center justify-center shadow-lg">
                      <Crown className="w-9 h-9 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-white tracking-wide">{driverProfile.callsign}</h3>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-zinc-950">
                          LVL {driverProfile.level}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-zinc-400">{driverProfile.email || 'guest@apexhorizon.com'}</p>
                      <span className="inline-block mt-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {driverProfile.licenseClass}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">License ID</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">APX-{driverProfile.id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>

                {/* Level Progress Bar */}
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-400">License XP Progress</span>
                    <span className="text-amber-400 font-mono">
                      {driverProfile.xp} / {driverProfile.nextLevelXp} XP ({xpPercentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/60">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 rounded-full"
                      style={{ width: `${xpPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Career Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase mb-1">
                      <Gauge className="w-3 h-3 text-cyan-400" />
                      <span>Top Speed</span>
                    </div>
                    <span className="text-sm font-black text-white font-mono">{driverProfile.stats.topSpeedKmh} km/h</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase mb-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      <span>Best Drift</span>
                    </div>
                    <span className="text-sm font-black text-white font-mono">{driverProfile.stats.highestDriftScore.toLocaleString()}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase mb-1">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span>Gold Medals</span>
                    </div>
                    <span className="text-sm font-black text-white font-mono">{driverProfile.stats.goldMedals}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase mb-1">
                      <Compass className="w-3 h-3 text-emerald-400" />
                      <span>Odometer</span>
                    </div>
                    <span className="text-sm font-black text-white font-mono">{driverProfile.stats.totalDistanceKm.toFixed(1)} km</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                {driverProfile.isGuest ? (
                  <button
                    onClick={() => setActiveTab('register')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition cursor-pointer shadow-lg"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Full Driver Account</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-rose-400 border border-rose-500/20 text-xs font-bold transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out / Switch Driver</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Close License
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN IN */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              {signInError && (
                <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                  {signInError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Email or Driver Callsign</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DocHornet or driver@apex.io"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm transition shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In To Circuit</span>
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-zinc-800" />
                  <span className="flex-shrink mx-3 text-zinc-600 text-[11px] font-bold uppercase">or instant access</span>
                  <div className="flex-grow border-t border-zinc-800" />
                </div>

                <button
                  type="button"
                  onClick={handlePlayAsGuest}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-bold text-xs transition cursor-pointer"
                >
                  Instant Guest Play (No Login Required)
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REGISTER NEW DRIVER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {regError && (
                <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                  {regError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Driver Callsign (Display Name)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DocHornet, ApexKing"
                  value={regCallsign}
                  onChange={(e) => setRegCallsign(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Racer Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="racer@circuit.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Avatar Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">Choose Racing Emblem / Avatar</label>
                <div className="grid grid-cols-3 gap-2">
                  {avatarOptions.map((opt) => {
                    const isSelected = regAvatar === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRegAvatar(opt.id)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        {opt.icon}
                        <span className="text-[10px] font-bold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm transition shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>Issue Racing License & Sign In</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
