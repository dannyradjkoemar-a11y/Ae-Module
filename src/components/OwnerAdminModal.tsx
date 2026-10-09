import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  UserPlus,
  Trash2,
  KeyRound,
  QrCode,
  Power,
  X,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Mail,
  Share2,
  Download,
  BookOpen
} from 'lucide-react';
import {
  SecurityConfig,
  AppUser,
  saveSecurityConfig,
  DEFAULT_MASTER_PIN,
} from '../lib/security';
import { generateBase32Secret } from '../lib/totp';

interface OwnerAdminModalProps {
  config: SecurityConfig;
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: (newConfig: SecurityConfig) => void;
}

export const OwnerAdminModal: React.FC<OwnerAdminModalProps> = ({
  config,
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'killswitch' | 'users' | 'adduser' | 'settings'>('killswitch');

  // Form states for adding user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [generatedSecret, setGeneratedSecret] = useState(() => generateBase32Secret(16));
  const [copiedKey, setCopiedKey] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Invitation modal state
  const [invitationModalUser, setInvitationModalUser] = useState<AppUser | null>(null);
  const [copiedInviteText, setCopiedInviteText] = useState(false);

  // Form states for master pin
  const [newMasterPin, setNewMasterPin] = useState(config.ownerMasterPin);
  const [customLockoutMsg, setCustomLockoutMsg] = useState(config.lockoutMessage);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const toggleMasterKillswitch = () => {
    const updated: SecurityConfig = {
      ...config,
      masterAccessEnabled: !config.masterAccessEnabled,
    };
    onConfigUpdated(updated);
    saveSecurityConfig(updated);
    showFeedback(
      updated.masterAccessEnabled
        ? 'Hoofdtoegang ingeschakeld: geautoriseerde gebruikers kunnen weer inloggen.'
        : 'KILLSWITCH GEACTIVEERD: Toegang voor alle collega\'s is per direct geblokkeerd!'
    );
  };

  const handleToggleUserStatus = (userId: string) => {
    const updatedUsers = config.users.map((u) => {
      if (u.id === userId && u.role !== 'owner') {
        const nextStatus: 'active' | 'blocked' = u.status === 'active' ? 'blocked' : 'active';
        return { ...u, status: nextStatus };
      }
      return u;
    });

    const updatedConfig: SecurityConfig = { ...config, users: updatedUsers };
    onConfigUpdated(updatedConfig);
    saveSecurityConfig(updatedConfig);
    showFeedback('Gebruikersstatus succesvol gewijzigd.');
  };

  const handleDeleteUser = (userId: string) => {
    if (!window.confirm('Weet je zeker dat je deze gebruiker definitief wilt verwijderen?')) return;
    const updatedUsers = config.users.filter((u) => u.id !== userId || u.role === 'owner');
    const updatedConfig: SecurityConfig = { ...config, users: updatedUsers };
    onConfigUpdated(updatedConfig);
    saveSecurityConfig(updatedConfig);
    showFeedback('Gebruiker verwijderd.');
  };

  const handleAddNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Vul a.u.b. een naam en e-mailadres in.');
      return;
    }

    const newUser: AppUser = {
      id: 'usr_' + Date.now(),
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: 'colleague',
      secret: generatedSecret,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const updatedConfig: SecurityConfig = {
      ...config,
      users: [...config.users, newUser],
    };

    onConfigUpdated(updatedConfig);
    saveSecurityConfig(updatedConfig);

    setNewUserName('');
    setNewUserEmail('');
    setGeneratedSecret(generateBase32Secret(16));

    // Open invitation email helper right away
    setInvitationModalUser(newUser);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: SecurityConfig = {
      ...config,
      ownerMasterPin: newMasterPin.trim() || DEFAULT_MASTER_PIN,
      lockoutMessage: customLockoutMsg.trim() || config.lockoutMessage,
    };
    onConfigUpdated(updatedConfig);
    saveSecurityConfig(updatedConfig);
    showFeedback('Instellingen opgeslagen.');
  };

  const getOtpAuthUrl = (name: string, email: string, secret: string) => {
    const issuer = 'Aftrekcheck';
    const label = encodeURIComponent(`${issuer}:${email || name}`);
    return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
  };

  const getQrCodeImgUrl = (name: string, email: string, secret: string) => {
    const otpUrl = getOtpAuthUrl(name, email, secret);
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(otpUrl)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Generate complete email text / guide for colleague
  const generateInviteEmailText = (user: AppUser) => {
    const appUrl = window.location.href.split('#')[0];
    const qrUrl = getQrCodeImgUrl(user.name, user.email, user.secret);

    return `Beste ${user.name},

Je hebt toegang gekregen tot de Audatex / AZT Aftrekcheck applicatie voor meerdere schades.

Om de applicatie veilig te kunnen gebruiken, maken we gebruik van een Authenticator-app op je telefoon (Google Authenticator of Microsoft Authenticator).

STAPPENPLAN OM JE EENMALIG AAN TE MELDEN:
-----------------------------------------------------------
1. Installeer Google Authenticator of Microsoft Authenticator op je telefoon via de App Store of Google Play Store (indien je deze nog niet hebt).

2. Open de Authenticator-app, kies 'Account toevoegen' en scan de QR-code via onderstaande link:
${qrUrl}

Of voer handmatig deze geheime koppelingssleutel in:
Sleutel: ${user.secret}
Type: Tijdgebaseerd (TOTP / 30 seconden)

3. Ga naar de webapplicatie:
${appUrl}

4. Kies op het inlogscherm jouw account (${user.name}) en vul de actuele 6-cijferige code in die op jouw telefoon verschijnt.

Veel succes met het calculeren!

Met vriendelijke groet,
Danny Radjkoemar`;
  };

  const handleOpenEmailClient = (user: AppUser) => {
    const subject = encodeURIComponent(`Toegang & Handleiding Aftrekcheck voor ${user.name}`);
    const body = encodeURIComponent(generateInviteEmailText(user));
    window.location.href = `mailto:${encodeURIComponent(user.email)}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-[#141B22] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8831A] flex items-center justify-center text-white">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Beheerderspaneel (Eigenaarscontrole)</h2>
              <p className="text-xs text-gray-300">
                Centraal toegangsbeheer, Authenticator-licenties &amp; Hoofdschakelaar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-4 pt-2 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('killswitch')}
            className={`px-4 py-2.5 rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'killswitch'
                ? 'bg-white border-t-2 border-t-[#E8831A] text-[#141B22] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            Hoofdschakelaar (Killswitch)
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white border-t-2 border-t-[#E8831A] text-[#141B22] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Gebruikers &amp; Toegang ({config.users.length})
          </button>
          <button
            onClick={() => setActiveTab('adduser')}
            className={`px-4 py-2.5 rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'adduser'
                ? 'bg-white border-t-2 border-t-[#E8831A] text-[#141B22] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Collega toevoegen
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white border-t-2 border-t-[#E8831A] text-[#141B22] shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Noodcode &amp; Berichten
          </button>
        </div>

        {/* Feedback alert */}
        {actionNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-sm">
          {/* TAB 1: KILLSWITCH */}
          {activeTab === 'killswitch' && (
            <div className="space-y-6">
              <div
                className={`p-5 rounded-xl border-2 transition-all ${
                  config.masterAccessEnabled
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : 'bg-red-50/60 border-red-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-base">
                      {config.masterAccessEnabled ? (
                        <>
                          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-emerald-900">Applicatiestatus: ACTIEF VOOR COLLEGA&apos;S</span>
                        </>
                      ) : (
                        <>
                          <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                          <span className="text-red-900">Applicatiestatus: VERGRENDELD / GEBLOKKEERD</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 max-w-lg leading-relaxed">
                      {config.masterAccessEnabled
                        ? 'Geautoriseerde collega’s kunnen inloggen met hun Authenticator-app en de calculaties gebruiken.'
                        : 'Alle collega’s zijn met onmiddellijke ingang buitengesloten! Zij krijgen het vergrendelingsbericht te zien. Alleen jij kunt nog ontgrendelen met je Master-code.'}
                    </p>
                  </div>

                  <button
                    onClick={toggleMasterKillswitch}
                    className={`px-5 py-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 ${
                      config.masterAccessEnabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    {config.masterAccessEnabled ? 'Toegang Nu Intrekken' : 'Toegang Weer Openen'}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Hoe werkt dit als je stopt met werken?
                </div>
                <p className="leading-relaxed">
                  Zodra je vertrekt of besluit dat collega’s de applicatie niet meer mogen gebruiken, klik je op de rode knop <strong>&quot;Toegang Nu Intrekken&quot;</strong>. 
                  Op dat exacte moment kan niemand de app meer in. Zelfs als collega’s de juiste 6-cijferige Authenticator-code invoeren, weigert het systeem de toegang.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: USERS LIST */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-[#141B22]">Lijst met gebruikers &amp; licenties</h3>
                  <p className="text-xs text-gray-500">
                    Schakel individuele collega’s direct uit, verstuur hun handleiding per mail of verwijder ze.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('adduser')}
                  className="px-3 py-1.5 bg-[#E8831A] hover:bg-[#d0750f] text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Nieuwe collega
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200 bg-white">
                {config.users.map((user) => (
                  <div
                    key={user.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{user.name}</span>
                        {user.role === 'owner' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#141B22] text-white">
                            Eigenaar
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Collega
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.status === 'active' ? 'Toegang actief' : 'Geblokkeerd'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-4">
                        <span>E-mail: {user.email}</span>
                        <span className="font-mono text-gray-400">TOTP: {user.secret}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Send invitation email button */}
                      <button
                        onClick={() => setInvitationModalUser(user)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Handleiding &amp; QR-code sturen"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Handleiding &amp; QR Mailen</span>
                      </button>

                      {user.role !== 'owner' ? (
                        <>
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              user.status === 'active'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {user.status === 'active' ? (
                              <>
                                <UserX className="w-3.5 h-3.5" /> Blokkeren
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" /> De-blokkeren
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Verwijder gebruiker"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 italic">Eigenaar (beschermd)</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ADD USER */}
          {activeTab === 'adduser' && (
            <form onSubmit={handleAddNewUser} className="space-y-4 max-w-lg">
              <div>
                <h3 className="font-bold text-[#141B22]">Nieuwe collega koppelen</h3>
                <p className="text-xs text-gray-500">
                  Genereer een unieke Authenticator-sleutel voor een collega en stuur direct een e-mail met instructies.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Naam van collega:
                </label>
                <input
                  type="text"
                  required
                  placeholder="bijv. Marco van den Berg"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  E-mailadres / Gebruikersnaam:
                </label>
                <input
                  type="email"
                  required
                  placeholder="bijv. marco@bedrijf.nl"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Geheime Authenticator Sleutel (TOTP):</span>
                  <button
                    type="button"
                    onClick={() => setGeneratedSecret(generateBase32Secret(16))}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Nieuwe sleutel
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <code className="p-2 bg-white border border-gray-300 rounded-md font-mono text-sm tracking-wider text-[#E8831A] font-bold flex-1 text-center">
                    {generatedSecret}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedSecret)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copiedKey ? 'Gekopieerd' : 'Kopieer'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E8831A] hover:bg-[#d0750f] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> Toevoegen &amp; Handleiding Mailen
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-lg">
              <div>
                <h3 className="font-bold text-[#141B22]">Beheerders-instellingen</h3>
                <p className="text-xs text-gray-500">
                  Pas je Master PIN code en het vergrendelingsbericht aan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Master PIN (Noodcode voor eigenaar):
                </label>
                <input
                  type="password"
                  value={newMasterPin}
                  onChange={(e) => setNewMasterPin(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-mono"
                  placeholder="Standaard: 12122015"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Hiermee kun je altijd inloggen, zelfs als je telefoon leeg is of kwijt is.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bericht bij vergrendeling / intrekking:
                </label>
                <textarea
                  rows={3}
                  value={customLockoutMsg}
                  onChange={(e) => setCustomLockoutMsg(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Dit is wat collega’s zien als de Killswitch actief is of hun account geblokkeerd is.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#141B22] hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Instellingen Opslaan
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>Aftrekcheck Beveiligingslaag v2.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-semibold cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>

      {/* POPUP MODAL: EMAIL INVITATION & QR GUIDE FOR COLLEAGUE */}
      {invitationModalUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <h3 className="font-bold text-sm sm:text-base">
                  Aanmeldingshandleiding &amp; QR voor {invitationModalUser.name}
                </h3>
              </div>
              <button
                onClick={() => setInvitationModalUser(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 border rounded-lg">
                <img
                  src={getQrCodeImgUrl(invitationModalUser.name, invitationModalUser.email, invitationModalUser.secret)}
                  alt="Authenticator QR-code"
                  className="w-32 h-32 border p-1 bg-white rounded-md shadow-xs shrink-0"
                />
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="font-bold text-gray-800 text-sm">{invitationModalUser.name}</div>
                  <div className="text-gray-500">E-mail: {invitationModalUser.email}</div>
                  <div className="flex items-center gap-1 font-mono text-[11px] bg-white border p-1.5 rounded">
                    <span>Sleutel:</span>
                    <strong className="text-[#E8831A]">{invitationModalUser.secret}</strong>
                  </div>
                  <a
                    href={getQrCodeImgUrl(invitationModalUser.name, invitationModalUser.email, invitationModalUser.secret)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline pt-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download / Open QR-afbeelding
                  </a>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-700">Klaargezette e-mailtekst met handleiding:</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateInviteEmailText(invitationModalUser));
                      setCopiedInviteText(true);
                      setTimeout(() => setCopiedInviteText(false), 2000);
                    }}
                    className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedInviteText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedInviteText ? 'Tekst gekopieerd!' : 'Kopieer e-mailtekst'}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={9}
                  value={generateInviteEmailText(invitationModalUser)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-mono text-[11px] bg-gray-50 leading-relaxed text-gray-800"
                />
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => handleOpenEmailClient(invitationModalUser)}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Open direct in je e-mailprogramma (Outlook / Mail)</span>
                </button>
                <button
                  onClick={() => setInvitationModalUser(null)}
                  className="py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg cursor-pointer"
                >
                  Klaar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
