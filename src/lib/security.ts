import { generateBase32Secret } from './totp';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'colleague';
  secret: string; // TOTP Base32 secret
  status: 'active' | 'blocked';
  createdAt: string;
  lastLogin?: string;
}

export interface SecurityConfig {
  masterAccessEnabled: boolean; // Master Killswitch: true = app available, false = immediately blocked for all users
  ownerMasterPin: string; // Emergency Master PIN/Password to access Owner Panel or override
  lockoutMessage: string;
  users: AppUser[];
}

const STORAGE_KEY = 'aftrekcheck_security_config_v2';
const SESSION_KEY = 'aftrekcheck_current_session_v2';

export const DEFAULT_OWNER_SECRET = 'JBSWY3DPEHPK3PXP'; // Standard seed
export const DEFAULT_MASTER_PIN = '12122015';

export function getInitialSecurityConfig(): SecurityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure master pin matches desired default if previously set to old default
      if (parsed.ownerMasterPin === '987654') {
        parsed.ownerMasterPin = DEFAULT_MASTER_PIN;
        saveSecurityConfig(parsed);
      }
      return parsed;
    }
  } catch {
    // fallback
  }

  // Default configuration with Owner
  const defaultConfig: SecurityConfig = {
    masterAccessEnabled: true,
    ownerMasterPin: DEFAULT_MASTER_PIN,
    lockoutMessage: 'De toegang tot de Aftrekcheck applicatie is door de beheerder ingetrokken of de licentie is beëindigd.',
    users: [
      {
        id: 'user_owner',
        name: 'Danny Radjkoemar (Eigenaar)',
        email: 'DannyRadjkoemar@gmail.com',
        role: 'owner',
        secret: DEFAULT_OWNER_SECRET,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  saveSecurityConfig(defaultConfig);
  return defaultConfig;
}

export function saveSecurityConfig(config: SecurityConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save security config:', err);
  }
}

export function getActiveSessionUser(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const sessionData = JSON.parse(raw);
    const config = getInitialSecurityConfig();

    // Verify master killswitch
    if (!config.masterAccessEnabled && sessionData.role !== 'owner') {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    // Verify user still active
    const user = config.users.find((u) => u.id === sessionData.id);
    if (!user || user.status !== 'active') {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function setActiveSessionUser(user: AppUser): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to set active session:', err);
  }
}

export function clearActiveSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
