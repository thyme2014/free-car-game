import { DriverProfile } from './types';

const STORAGE_KEY = 'apex_driver_profile_active';
const ACCOUNTS_KEY = 'apex_driver_accounts_db';

export const DEFAULT_GUEST_PROFILE: DriverProfile = {
  id: 'guest_driver_01',
  callsign: 'Rookie_Hornet',
  email: 'guest@apexhorizon.com',
  avatar: 'hornet',
  level: 1,
  xp: 150,
  nextLevelXp: 500,
  cash: 5000,
  licenseClass: 'Class C (Rookie)',
  stats: {
    totalDistanceKm: 4.2,
    topSpeedKmh: 184,
    highestDriftScore: 3200,
    missionsCompleted: 1,
    tasksCompleted: 0,
    goldMedals: 0,
    favoriteCar: 'hudson_hornet',
  },
  isGuest: true,
  createdAt: new Date().toISOString(),
};

export function getStoredDriverProfile(): DriverProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.callsign) {
        if (parsed.cash === undefined) parsed.cash = 5000;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read stored driver profile:', e);
  }
  return DEFAULT_GUEST_PROFILE;
}

export function saveDriverProfile(profile: DriverProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    // Also save to accounts DB if not guest
    if (!profile.isGuest && profile.email) {
      const accounts = getStoredAccounts();
      accounts[profile.email.toLowerCase()] = profile;
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  } catch (e) {
    console.warn('Could not save driver profile:', e);
  }
}

export function getStoredAccounts(): Record<string, DriverProfile> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read accounts DB:', e);
  }
  return {};
}

export function computeLicenseClass(level: number): DriverProfile['licenseClass'] {
  if (level >= 15) return 'Class S (Apex Legend)';
  if (level >= 10) return 'Class A (Pro)';
  if (level >= 5) return 'Class B (Street)';
  return 'Class C (Rookie)';
}

export function awardDriverXp(profile: DriverProfile, earnedXp: number): DriverProfile {
  let xp = profile.xp + earnedXp;
  let level = profile.level;
  let nextLevelXp = profile.nextLevelXp;

  while (xp >= nextLevelXp) {
    xp -= nextLevelXp;
    level += 1;
    nextLevelXp = Math.round(nextLevelXp * 1.35);
  }

  const updated: DriverProfile = {
    ...profile,
    xp,
    level,
    nextLevelXp,
    licenseClass: computeLicenseClass(level),
  };

  saveDriverProfile(updated);
  return updated;
}

export function awardDriverCash(profile: DriverProfile, amount: number): DriverProfile {
  const updated: DriverProfile = {
    ...profile,
    cash: Math.max(0, (profile.cash || 0) + amount),
  };
  saveDriverProfile(updated);
  return updated;
}

export function deductDriverCash(profile: DriverProfile, amount: number): { success: boolean; profile: DriverProfile } {
  const currentCash = profile.cash || 0;
  if (currentCash < amount) {
    return { success: false, profile };
  }
  const updated: DriverProfile = {
    ...profile,
    cash: currentCash - amount,
  };
  saveDriverProfile(updated);
  return { success: true, profile: updated };
}

