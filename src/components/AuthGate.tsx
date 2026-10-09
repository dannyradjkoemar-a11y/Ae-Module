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
  const [emailInput, setEmailInput] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [masterPinInput, setMasterPinInput] = useState('');
  const [useMasterPin, setUseMasterPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Show setup / QR code for the user if requested
  const [showQrHelper, setShowQrHelper] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Hidden 5-click Easter Egg state for owner secret access on 'MODULE'
  const [moduleClickCount, setModuleClickCount] = useState(0);
  const [secretUnlocked, setSecretUnlocked] = useState(false);

  // Find user by entered email
  const matchedUser = config.users.find(
    (u) => u.email.trim().toLowerCase() === emailInput.trim().toLowerCase()
  );

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

    // Option A: Master PIN override
    if (useMasterPin) {
      if (masterPinInput.trim() === config.ownerMasterPin) {
        const ownerUser = config.users.find((u) => u.role === 'owner') || config.users[0];
        setActiveSessionUser(ownerUser);
        onAuthenticated(ownerUser);
        return;
      } else {
        setError('Onjuiste Master PIN code.');
        return;
      }
    }

    // 1. Verify email entered
    if (!emailInput.trim()) {
      setError('Vul uw e-mailadres in.');
      return;
    }

    if (!matchedUser) {
      setError('Er is geen account gevonden met dit e-mailadres. Neem contact op met de beheerder.');
      return;
    }

    // 2. Check if Master Killswitch is triggered (and user is not owner)
    if (!config.masterAccessEnabled && matchedUser.role !== 'owner') {
      setError(config.lockoutMessage);
      return;
    }

    // 3. Check if user is blocked
    if (matchedUser.status === 'blocked') {
      setError('Uw account is geblokkeerd door de beheerder.');
      return;
    }

    // 4. Verify 6-digit TOTP code
    if (!totpCode.trim() || totpCode.trim().length !== 6) {
      setError('Vul de 6-cijferige code uit uw Authenticator-app in.');
      return;
    }

    setIsVerifying(true);

    try {
      const isValid = await verifyTOTP(totpCode, matchedUser.secret);
      if (isValid) {
        setActiveSessionUser(matchedUser);
        onAuthenticated(matchedUser);
      } else {
        setError('Onjuiste of verlopen Authenticator-code. Controleer de tijd op uw telefoon.');
      }
    } catch {
      setError('Fout bij verifiëren van code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getOtpAuthUrl = (email: string, secret: string) => {
    const issuer = 'AE MODULE';
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
                    Uw e-mailadres:
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="naam@bedrijf.nl"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#E8831A] focus:outline-hidden"
                  />
                  {matchedUser && (
                    <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Account herkend: {matchedUser.name}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      6-Cijferige Authenticator Code:
                    </label>
                    {matchedUser && (
                      <button
                        type="button"
                        onClick={() => setShowQrHelper(!showQrHelper)}
                        className="text-xs text-[#E8831A] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        {showQrHelper ? 'Verberg QR' : 'Koppel Authenticator'}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-3.5 text-center font-mono text-2xl tracking-[0.5em] bg-[#FBFCFD] border-2 border-gray-300 rounded-xl focus:border-[#E8831A] focus:outline-hidden font-bold"
                    />
                    <Smartphone className="w-5 h-5 text-gray-400 absolute left-3 top-4" />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5 text-center">
                    Open Google of Microsoft Authenticator op uw telefoon en vul de 6 cijfers in.
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
          {showQrHelper && matchedUser && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-3 animate-in fade-in">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Authenticator koppelen: {matchedUser.name}</span>
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
                    getOtpAuthUrl(matchedUser.email, matchedUser.secret)
                  )}`}
                  alt="QR Code"
                  className="w-32 h-32 border p-1 bg-white rounded-md shadow-xs mb-2"
                />
                <span className="text-[11px] text-gray-500 text-center">
                  Scan met Google of Microsoft Authenticator of voer onderstaande sleutel handmatig in:
                </span>
                <div className="mt-2 flex items-center gap-1.5 w-full">
                  <code className="p-1.5 bg-white border border-gray-300 rounded font-mono text-[11px] text-[#E8831A] font-bold flex-1 text-center truncate">
                    {matchedUser.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copySecret(matchedUser.secret)}
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
