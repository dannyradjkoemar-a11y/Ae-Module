import React, { useState } from 'react';
import {
  Lock,
  Smartphone,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  ArrowRight,
  Info,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import {
  SecurityConfig,
  AppUser,
  DEFAULT_OWNER_SECRET,
  setActiveSessionUser,
} from '../lib/security';
import { verifyTOTP } from '../lib/totp';

interface AuthGateProps {
  config: SecurityConfig;
  onAuthenticated: (user: AppUser) => void;
  onOpenOwnerAdmin: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  config,
  onAuthenticated,
  onOpenOwnerAdmin,
}) => {
  const [selectedUserEmail, setSelectedUserEmail] = useState(
    config.users[0]?.email || 'DannyRadjkoemar@gmail.com'
  );
  const [totpCode, setTotpCode] = useState('');
  const [masterPinInput, setMasterPinInput] = useState('');
  const [useMasterPin, setUseMasterPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Show setup / QR code for the owner if first time
  const [showQrHelper, setShowQrHelper] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Hidden 5-click Easter Egg state for owner secret access on 'MODULE'
  const [moduleClickCount, setModuleClickCount] = useState(0);
  const [secretUnlocked, setSecretUnlocked] = useState(false);

  const selectedUser = config.users.find((u) => u.email === selectedUserEmail) || config.users[0];

  const handleModuleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = moduleClickCount + 1;
    if (next >= 5) {
      setSecretUnlocked(true);
      setUseMasterPin(true);
      setModuleClickCount(0);
    } else {
      setModuleClickCount(next);
      // Reset clicks after 3.5 seconds of inactivity
      setTimeout(() => setModuleClickCount(0), 3500);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Check if Master Killswitch is triggered (and not logging in via owner master pin)
    if (!config.masterAccessEnabled && (!useMasterPin || masterPinInput !== config.ownerMasterPin)) {
      setError(config.lockoutMessage);
      return;
    }

    // 2. Check if user is blocked
    if (!useMasterPin && selectedUser && selectedUser.status === 'blocked') {
      setError('Uw toegang tot de applicatie is geblokkeerd door de beheerder.');
      return;
    }

    setIsVerifying(true);

    try {
      // Option A: Master PIN override
      if (useMasterPin) {
        if (masterPinInput.trim() === config.ownerMasterPin) {
          const ownerUser = config.users.find((u) => u.role === 'owner') || config.users[0];
          setActiveSessionUser(ownerUser);
          onAuthenticated(ownerUser);
          return;
        } else {
          setError('Onjuiste Master PIN code.');
          setIsVerifying(false);
          return;
        }
      }

      // Option B: TOTP Authenticator code check
      if (!selectedUser) {
        setError('Selecteer een geldige gebruiker.');
        setIsVerifying(false);
        return;
      }

      const isValid = await verifyTOTP(totpCode, selectedUser.secret);
      if (isValid) {
        setActiveSessionUser(selectedUser);
        onAuthenticated(selectedUser);
      } else {
        setError('Ongeldige of verlopen 6-cijferige Authenticator-code. Controleer de tijd op uw telefoon.');
      }
    } catch (err) {
      setError('Fout bij verifiëren van code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getOtpAuthUrl = (email: string, secret: string) => {
    const issuer = 'Aftrekcheck';
    const label = encodeURIComponent(`${issuer}:${email}`);
    return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
  };

  const copySecret = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#EEF1F4] flex flex-col justify-center items-center p-4 font-['Inter_Tight',system-ui,sans-serif]">
      {/* Killswitch banner if deactivated */}
      {!config.masterAccessEnabled && (
        <div className="w-full max-w-md mb-4 bg-red-600 text-white p-4 rounded-xl shadow-lg flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="block font-bold text-sm mb-0.5">Applicatie Vergrendeld</strong>
            {config.lockoutMessage}
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Brand header */}
        <div className="bg-[#141B22] p-6 text-white text-center relative select-none">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <span className="font-['Michroma',sans-serif] text-2xl font-bold tracking-widest">AE</span>
            <span className="w-2.5 h-2.5 bg-[#E8831A] rotate-45 inline-block" />
            <span
              onClick={handleModuleClick}
              className="font-['Michroma',sans-serif] text-sm tracking-widest cursor-pointer select-none"
              title=""
            >
              MODULE
            </span>
          </div>
          <h1 className="text-base font-semibold">Beveiligde Toegangspoort</h1>
          <p className="text-xs text-gray-400 mt-1">
            Log in met uw Authenticator-app om de calculaties te openen
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleVerify} className="space-y-5">
            {!useMasterPin ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Selecteer uw account:
                  </label>
                  <select
                    value={selectedUserEmail}
                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#E8831A] focus:outline-hidden"
                  >
                    {config.users.map((u) => (
                      <option key={u.id} value={u.email}>
                        {u.name} ({u.role === 'owner' ? 'Eigenaar' : 'Collega'}) {u.status === 'blocked' ? '❌ [Geblokkeerd]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      6-Cijferige Authenticator Code:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQrHelper(!showQrHelper)}
                      className="text-xs text-[#E8831A] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      {showQrHelper ? 'Verberg QR' : 'Koppel Authenticator'}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      placeholder="000000"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-3.5 text-center font-mono text-2xl tracking-[0.5em] bg-[#FBFCFD] border-2 border-gray-300 rounded-xl focus:border-[#E8831A] focus:outline-hidden font-bold"
                    />
                    <Smartphone className="w-5 h-5 text-gray-400 absolute left-3 top-4" />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5 text-center">
                    Open Google of Microsoft Authenticator op uw telefoon en vul de huidige code in.
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Master PIN (Eigenaar Noodcode):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    required
                    placeholder="Voer de geheime Master PIN in..."
                    value={masterPinInput}
                    onChange={(e) => setMasterPinInput(e.target.value)}
                    className="w-full p-3 text-sm bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-[#E8831A] focus:outline-hidden font-mono"
                  />
                  <KeyRound className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Hiermee heeft de eigenaar altijd direct toegang tot de app en het beheerpaneel.
                </p>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 px-4 bg-[#E8831A] hover:bg-[#d0750f] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                'Verifiëren...'
              ) : (
                <>
                  <span>Ontgrendel Applicatie</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* QR-code helper modal/accordion */}
          {showQrHelper && selectedUser && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Authenticator koppelen: {selectedUser.name}</span>
                <button
                  type="button"
                  onClick={() => setShowQrHelper(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    getOtpAuthUrl(selectedUser.email, selectedUser.secret)
                  )}`}
                  alt="QR Code"
                  className="w-32 h-32 border p-1 bg-white rounded-md shadow-xs mb-2"
                />
                <span className="text-[11px] text-gray-500 text-center">
                  Scan met Google Authenticator of voer onderstaande sleutel handmatig in:
                </span>
                <div className="mt-2 flex items-center gap-1.5 w-full">
                  <code className="p-1.5 bg-white border border-gray-300 rounded font-mono text-[11px] text-[#E8831A] font-bold flex-1 text-center truncate">
                    {selectedUser.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copySecret(selectedUser.secret)}
                    className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 text-[11px] flex items-center gap-1 shrink-0"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom actions: Secretly unlocked only after 10 clicks on the logo */}
          {secretUnlocked ? (
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500 animate-in fade-in">
              <button
                type="button"
                onClick={() => setUseMasterPin(!useMasterPin)}
                className="hover:text-gray-900 underline cursor-pointer text-[#E8831A] font-semibold"
              >
                {useMasterPin ? '← Inloggen met Authenticator' : 'Noodinlog via Master PIN'}
              </button>

              <button
                type="button"
                onClick={onOpenOwnerAdmin}
                className="text-[#141B22] font-semibold hover:text-[#E8831A] flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Eigenaarsbeheer</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 text-center text-[11px] text-gray-400">
              Voer de actuele code in van uw geautoriseerde mobiele app.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        Beveiligd met RFC 6238 Time-based One-Time Passwords (TOTP)
      </div>
    </div>
  );
};
