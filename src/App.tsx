import React, { useState, useEffect } from 'react';
import {
  Car,
  FileText,
  Calculator,
  BookOpen,
  Printer,
  RotateCcw,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  Lock,
  LogOut,
  Shield,
  Sliders,
  UserCheck
} from 'lucide-react';
import {
  getInitialSecurityConfig,
  getActiveSessionUser,
  clearActiveSession,
  AppUser,
  SecurityConfig,
} from './lib/security';
import { AuthGate } from './components/AuthGate';
import { OwnerAdminModal } from './components/OwnerAdminModal';
import { CinematicIntro } from './components/CinematicIntro';

interface VBTItem {
  id: string;
  desc: string;
  ae: number;
}

interface MatItem {
  id: string;
  desc: string;
  euro: number;
  isDouble: boolean;
}

interface ParsedResult {
  vbtAftrekAE: number | null;
  vbtUitleg: string;
  matAftrekEuro: number | null;
  matUitleg: string;
  samenvatting: string;
  stappen: string[];
  gevonden: {
    c1: any;
    c2: any;
  };
  controlePunten: string[];
}

export default function App() {
  // Cinematic film-style startup intro state
  const [showIntro, setShowIntro] = useState(true);

  // Security and Auth state
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => getInitialSecurityConfig());
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getActiveSessionUser());
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'plak' | 'zelf' | 'ref'>('plak');

  // Tab 1 state
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [korting, setKorting] = useState<number>(12.5);
  const [plate, setPlate] = useState<string | null>(null);
  const [calcResult, setCalcResult] = useState<ParsedResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Tab 2 (Zelf rekenen) state
  const [vbtRows, setVbtRows] = useState<VBTItem[]>([
    { id: '1', desc: 'Schade 1 – kunststof (bumper uitgebouwd)', ae: 14 },
    { id: '2', desc: 'Schade 2 – metaal', ae: 23 },
    { id: '3', desc: 'Schade 2 – kunststof (tweede materiaal)', ae: 5 },
  ]);
  const [matRows, setMatRows] = useState<MatItem[]>([
    { id: '1', desc: 'Materiaalconstante schade 1', euro: 45.3, isDouble: true },
    { id: '2', desc: 'Materiaalconstante schade 2', euro: 45.3, isDouble: false },
  ]);
  const [korting2, setKorting2] = useState<number>(12.5);

  const [qLak, setQLak] = useState<'2' | '1'>('2');
  const [qMat, setQMat] = useState<'metaal' | 'kunststof' | 'spot'>('metaal');
  const [qFase, setQFase] = useState('zwaar');
  const [qSit, setQSit] = useState<number>(0);
  const [qSpots, setQSpots] = useState<number>(1);
  const [qTweede, setQTweede] = useState<string>('zwaar');
  const [q2k, setQ2k] = useState<boolean>(false);

  // Drawer modal state for AZT table
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Load calculation inputs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aftrekcheck_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.s1) setS1(parsed.s1);
        if (parsed.s2) setS2(parsed.s2);
        if (parsed.korting) setKorting(parsed.korting);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem('aftrekcheck_data', JSON.stringify({ s1, s2, korting }));
    } catch {
      // ignore
    }
  }, [s1, s2, korting]);

  // License plate detection
  useEffect(() => {
    const PLATE_PATTERNS = [
      /\b[A-Z]{2}-?\d{2}-?\d{2}\b/,
      /\b\d{2}-?\d{2}-?[A-Z]{2}\b/,
      /\b\d{2}-?[A-Z]{2}-?\d{2}\b/,
      /\b[A-Z]{2}-?\d{2}-?[A-Z]{2}\b/,
      /\b[A-Z]{2}-?[A-Z]{2}-?\d{2}\b/,
      /\b\d{2}-?[A-Z]{2}-?[A-Z]{2}\b/,
      /\b\d{2}-?[A-Z]{3}-?\d\b/,
      /\b\d-?[A-Z]{3}-?\d{2}\b/,
      /\b[A-Z]-?\d{3}-?[A-Z]{2}\b/,
      /\b[A-Z]{2}-?\d{3}-?[A-Z]\b/,
      /\b[A-Z]{3}-?\d{2}-?[A-Z]\b/,
      /\b[A-Z]-?\d{2}-?[A-Z]{3}\b/,
      /\b\d-?[A-Z]{2}-?\d{3}\b/,
      /\b\d{3}-?[A-Z]{2}-?\d\b/,
    ];
    const txt = `${s1}\n${s2}`.toUpperCase();
    let found: string | null = null;
    for (const re of PLATE_PATTERNS) {
      const m = txt.match(re);
      if (m) {
        const c = m[0].replace(/-/g, '');
        const matched =
          c.match(/^([A-Z0-9]{2})([A-Z0-9]{2})([A-Z0-9]{2})$/) ||
          c.match(/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9])$/) ||
          c.match(/^([A-Z0-9])([A-Z0-9]{3})([A-Z0-9]{2})$/) ||
          c.match(/^([A-Z0-9])([A-Z0-9]{2})([A-Z0-9]{3})$/) ||
          c.match(/^([A-Z0-9]{3})([A-Z0-9]{2})([A-Z0-9])$/);
        found = matched ? matched.slice(1).join('-') : m[0];
        break;
      }
    }
    setPlate(found);
  }, [s1, s2]);

  // Parsing helpers
  const parseAE = (str: string): number | null => {
    const m = String(str).replace(',', '.').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  };

  const parseCalc = (text: string) => {
    const up = text.toUpperCase();
    const lines = up.split(/\r?\n/);
    const out: {
      vbt: { mat: string; ae: number }[];
      mat: { mat: string; euro: number }[];
      lak: string | null;
      uitgebouwd: boolean;
      voorspuiten: boolean;
      spot: boolean;
    } = {
      vbt: [],
      mat: [],
      lak: null,
      uitgebouwd: false,
      voorspuiten: false,
      spot: false,
    };

    if (/\b3-?LAGEN|\b4-?LAGEN|MEERLAGEN/.test(up)) out.lak = 'meer';
    else if (/\b2-?LAGEN/.test(up)) out.lak = '2';
    else if (/\b1-?LAAG|1-?LAGEN|\bUNI\b/.test(up)) out.lak = '1';

    if (/MONT-?DELEN\s+UITGEB|UITGEB(OUWD)?|GEDEMONT|DEMONTAB/.test(up)) out.uitgebouwd = true;
    if (/VOORSPUIT/.test(up)) out.voorspuiten = true;
    if (/SPOT-?REPAIR|\bSPOTREP/.test(up)) out.spot = true;

    let pendingVbt: string | null = null;
    let pendingMat: string | null = null;

    lines.forEach((ln) => {
      let m = ln.match(/VOORBEREIDING\S*\s+(KUNSTSTOF|METAAL)\D*(-?\d+[.,]?\d*)/);
      if (m) {
        const val = parseAE(m[2]);
        if (val !== null) out.vbt.push({ mat: m[1] === 'KUNSTSTOF' ? 'kunststof' : 'metaal', ae: val });
        return;
      }
      m = ln.match(/VOORBEREIDING\s+(KUNSTSTOF|METAAL)\s*$/);
      if (m) {
        pendingVbt = m[1] === 'KUNSTSTOF' ? 'kunststof' : 'metaal';
        return;
      }
      if (pendingVbt) {
        const a = parseAE(ln);
        if (a !== null) {
          out.vbt.push({ mat: pendingVbt, ae: a });
          pendingVbt = null;
          return;
        }
      }

      m = ln.match(/MATERIAAL-?CONSTANTE\s+(KUNSTSTOF|METAAL)\D*(-?\d+[.,]?\d*)/);
      if (m) {
        const val = parseAE(m[2]);
        if (val !== null) out.mat.push({ mat: m[1] === 'KUNSTSTOF' ? 'kunststof' : 'metaal', euro: val });
        return;
      }
      m = ln.match(/MATERIAAL-?CONSTANTE\s+(KUNSTSTOF|METAAL)\s*$/);
      if (m) {
        pendingMat = m[1] === 'KUNSTSTOF' ? 'kunststof' : 'metaal';
        return;
      }
      if (pendingMat) {
        const a = parseAE(ln);
        if (a !== null) {
          out.mat.push({ mat: pendingMat, euro: a });
          pendingMat = null;
        }
      }
    });

    return out;
  };

  const handleCalculate = () => {
    setErrorMsg('');
    if (!s1.trim() || !s2.trim()) {
      setErrorMsg('Voer a.u.b. beide calculaties (Schade 1 en Schade 2) in.');
      return;
    }

    const c1 = parseCalc(s1);
    const c2 = parseCalc(s2);
    const lak = c1.lak === 'meer' || c2.lak === 'meer' ? 'meer' : c1.lak === '1' && c2.lak === '1' ? '1' : '2';

    const alleVbt = [
      ...c1.vbt.map((v) => ({ ...v, schade: 1 })),
      ...c2.vbt.map((v) => ({ ...v, schade: 2 })),
    ];
    const alleMat = [
      ...c1.mat.map((v) => ({ ...v, schade: 1 })),
      ...c2.mat.map((v) => ({ ...v, schade: 2 })),
    ];

    const totVbt = alleVbt.reduce((a, v) => a + (v.ae || 0), 0);

    let juist = 0;
    const juistUitleg: string[] = [];

    if (alleVbt.length > 0) {
      const hoofd = alleVbt.reduce((a, b) => ((b.ae || 0) > (a.ae || 0) ? b : a));
      juist += hoofd.ae || 0;
      juistUitleg.push(`hoofdbewerking ${hoofd.mat} ${hoofd.ae} AE`);
      const hoofdMat = hoofd.mat;
      const andereMaterialen = Array.from(new Set(alleVbt.map((v) => v.mat))).filter((m) => m !== hoofdMat);
      andereMaterialen.forEach((m) => {
        const comb = lak === '1' ? 6 : 8;
        juist += comb;
        juistUitleg.push(`tweede materiaal ${m} ${comb} AE`);
      });
    }

    const vbtAftrek = Math.round((totVbt - juist) * 100) / 100;

    const perMat: Record<string, typeof alleMat> = {};
    alleMat.forEach((mm) => {
      if (!perMat[mm.mat]) perMat[mm.mat] = [];
      perMat[mm.mat].push(mm);
    });

    let dubbelEuro = 0;
    const matUitleg: string[] = [];
    Object.keys(perMat).forEach((matKey) => {
      const list = perMat[matKey].slice().sort((a, b) => (b.euro || 0) - (a.euro || 0));
      list.slice(1).forEach((x) => {
        dubbelEuro += x.euro || 0;
        matUitleg.push(`€ ${x.euro.toFixed(2).replace('.', ',')} (${matKey}, schade ${x.schade})`);
      });
    });

    const matNet = Math.round(dubbelEuro * (1 - korting / 100) * 100) / 100;

    const stappenList: string[] = [];
    stappenList.push(
      `Gevonden voorbereidingstijd: ${
        alleVbt.length > 0
          ? alleVbt.map((v) => `${v.mat} ${v.ae} AE (schade ${v.schade})`).join(', ')
          : 'geen'
      }.`
    );
    if (alleVbt.length > 0) {
      stappenList.push(`Bij één gecombineerde spuitgang telt: ${juistUitleg.join(' + ')} = ${juist} AE.`);
      stappenList.push(`Aftrek voorbereidingstijd: ${totVbt} AE − ${juist} AE = ${vbtAftrek} AE.`);
    }
    stappenList.push(
      `Gevonden materiaalconstante: ${
        alleMat.length > 0
          ? alleMat.map((m) => `${m.mat} € ${m.euro.toFixed(2).replace('.', ',')} (schade ${m.schade})`).join(', ')
          : 'geen'
      }.`
    );
    if (dubbelEuro > 0) {
      stappenList.push(
        `Dubbele constante: € ${dubbelEuro.toFixed(2).replace('.', ',')} min ${String(korting).replace('.', ',')}% korting = € ${matNet.toFixed(2).replace('.', ',')}. Dit bedrag kan worden ingevuld bij tekstzonecode 143.`
      );
    }

    const controleList: string[] = [];
    if (!alleVbt.length) controleList.push("Geen voorbereidingstijd gevonden. Controleer of 'VOORBEREIDING METAAL/KUNSTSTOF' in de tekst staat.");
    if (!alleMat.length) controleList.push("Geen materiaalconstante gevonden. Controleer of 'MATERIAAL-CONSTANTE' in de tekst staat.");
    if (lak === 'meer') controleList.push('Dit betreft een meerlagen laksysteem (3- of 4-lagen). Controleer de tijden in de AZT-naslagtabel.');
    controleList.push('Aangenomen is dat beide schades in één doorgang worden hersteld/gespoten.');
    if (alleMat.length > 1) {
      controleList.push('Per materiaalsoort hoort slechts één materiaalconstante te worden gerekend. Het dubbele bedrag is gecorrigeerd conform korting.');
    }

    const samenvattingParts: string[] = [];
    if (alleVbt.length > 0) {
      samenvattingParts.push(`Breng ${vbtAftrek} AE voorbereidingstijd in mindering.`);
    }
    if (dubbelEuro > 0) {
      samenvattingParts.push(`Vul bij TZ-code 143 een aftrek spuitbedrag in van € ${matNet.toFixed(2).replace('.', ',')} (als minbedrag).`);
    } else if (alleMat.length > 0) {
      samenvattingParts.push('Er is geen dubbele materiaalconstante geconstateerd.');
    }

    setCalcResult({
      vbtAftrekAE: alleVbt.length > 0 ? vbtAftrek : null,
      vbtUitleg: alleVbt.length > 0 ? `${totVbt} AE − ${juist} AE = ${vbtAftrek} AE (${juistUitleg.join(' + ')})` : '',
      matAftrekEuro: alleMat.length > 0 ? matNet : null,
      matUitleg:
        dubbelEuro > 0
          ? `Dubbel: ${matUitleg.join(' + ')} = € ${dubbelEuro.toFixed(2).replace('.', ',')} − ${korting}% = € ${matNet.toFixed(2).replace('.', ',')}`
          : 'Geen dubbele constante',
      samenvatting: samenvattingParts.join(' '),
      stappen: stappenList,
      gevonden: { c1, c2 },
      controlePunten: controleList,
    });
  };

  const handleReset = () => {
    setS1('');
    setS2('');
    setKorting(12.5);
    setCalcResult(null);
    setErrorMsg('');
    setPlate(null);
    try {
      localStorage.removeItem('aftrekcheck_data');
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    clearActiveSession();
    setCurrentUser(null);
  };

  // Tab 2 Calculation
  const AZT_TABLE: Record<string, any> = {
    '2': {
      metaal: { zwaar: [23, 27, 11], licht: [13, null, 11] },
      kunststof: { zwaar: [23, 27, 14], licht: [13, 17, 11] },
      combZwaar: 8,
      combLicht: 5,
      spot: 11,
      spotOpp: 9,
      spotComb: 5,
      extra2k: [1, 3, 3],
    },
    '1': {
      metaal: { zwaar: [17, 19, 7], licht: [8, null, 7] },
      kunststof: { zwaar: [17, 19, 10], licht: [8, 10, 7] },
      combZwaar: 6,
      combLicht: 3,
      spot: 0,
      extra2k: [1, 2, 2],
    },
  };

  const calculateZelf = () => {
    const totVbtIngesteld = vbtRows.reduce((a, b) => a + Number(b.ae || 0), 0);
    const t = AZT_TABLE[qLak];

    let juist = 0;
    if (qMat === 'spot') {
      juist = (t.spot || 11) + (Number(qSpots) || 1) * (t.spotOpp || 9);
    } else {
      const v = t[qMat]?.[qFase]?.[qSit] ?? t[qMat]?.[qFase]?.[0] ?? 23;
      juist += v;
      if (qTweede === 'zwaar') juist += t.combZwaar || 8;
      if (qTweede === 'licht') juist += t.combLicht || 5;
      if (qTweede === 'spot') juist += t.spotComb || 5;
    }

    if (q2k) {
      juist += (t.extra2k?.[0] || 1) + (t.extra2k?.[1] || 3) + (t.extra2k?.[2] || 3);
    }

    const aftrekAE = Math.round((totVbtIngesteld - juist) * 100) / 100;

    const dubbelEuro = matRows
      .filter((r) => r.isDouble)
      .reduce((a, b) => a + Number(b.euro || 0), 0);
    const aftrekEuro = Math.round(dubbelEuro * (1 - korting2 / 100) * 100) / 100;

    return {
      totVbtIngesteld,
      juist,
      aftrekAE,
      dubbelEuro,
      aftrekEuro,
    };
  };

  const zelfCalc = calculateZelf();

  // Show Cinematic 3D Studio Intro on first launch
  if (showIntro) {
    return <CinematicIntro onFinish={() => setShowIntro(false)} />;
  }

  // If user is not authenticated or if master lock is active (and user is not owner) -> Show Auth Gate
  if (!currentUser || (!securityConfig.masterAccessEnabled && currentUser.role !== 'owner')) {
    return (
      <>
        <AuthGate
          config={securityConfig}
          onAuthenticated={(user) => setCurrentUser(user)}
          onOpenOwnerAdmin={() => setIsOwnerModalOpen(true)}
        />
        <OwnerAdminModal
          config={securityConfig}
          isOpen={isOwnerModalOpen}
          onClose={() => setIsOwnerModalOpen(false)}
          onConfigUpdated={(newCfg) => setSecurityConfig(newCfg)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF1F4] text-[#141B22] font-['Inter_Tight',system-ui,sans-serif]">
      {/* Top Header */}
      <header className="bg-white border-b border-[#C2CAD2] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="font-['Michroma',sans-serif] text-2xl tracking-widest font-bold text-[#141B22]">AE</span>
            <span className="w-2.5 h-2.5 bg-[#E8831A] rotate-45 inline-block" />
            <span className="font-['Michroma',sans-serif] text-sm tracking-widest hidden sm:inline text-[#141B22]">MODULE</span>
          </div>

          <div className="flex items-center gap-3">
            {/* User status tag */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-gray-700">{currentUser.name}</span>
              {currentUser.role === 'owner' && (
                <span className="px-1.5 py-0.2 bg-[#E8831A] text-white rounded text-[10px] font-bold">Eigenaar</span>
              )}
            </div>

            {/* Owner Admin Button */}
            {currentUser.role === 'owner' && (
              <button
                onClick={() => setIsOwnerModalOpen(true)}
                className="px-3 py-1.5 bg-[#141B22] hover:bg-black text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Beheerderspaneel openen"
              >
                <Sliders className="w-3.5 h-3.5 text-[#E8831A]" />
                <span>Beheer &amp; Licenties</span>
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Sessie vergrendelen"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Afmelden</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141B22]">
          Aftrek bij meerdere schades
        </h1>
        <p className="mt-2 text-[#5E6B78] max-w-3xl text-sm sm:text-base leading-relaxed">
          Twee schades in losse calculaties, maar in één keer gespoten? Dan staan voorbereidingstijd en materiaalconstante vaak dubbel. Bereken hier wat eraf moet en zoek de AZT-regels op.
        </p>

        {/* Navigation Tabs */}
        <div className="mt-6 inline-flex p-1 bg-[#EDF0F3] border border-[#C2CAD2] rounded-lg">
          <button
            onClick={() => setActiveTab('plak')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'plak'
                ? 'bg-white text-[#141B22] shadow-xs'
                : 'text-[#5E6B78] hover:text-[#141B22]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Calculatie plakken
          </button>
          <button
            onClick={() => setActiveTab('zelf')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'zelf'
                ? 'bg-white text-[#141B22] shadow-xs'
                : 'text-[#5E6B78] hover:text-[#141B22]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Zelf rekenen
          </button>
          <button
            onClick={() => setActiveTab('ref')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ref'
                ? 'bg-white text-[#141B22] shadow-xs'
                : 'text-[#5E6B78] hover:text-[#141B22]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Naslag AZT
          </button>
        </div>

        {/* TAB 1: PLAKKEN */}
        {activeTab === 'plak' && (
          <section className="mt-6 space-y-6">
            {plate && (
              <div className="flex items-center gap-3 bg-white p-3 border border-[#C2CAD2] rounded-lg w-fit">
                <span className="text-xs text-[#5E6B78] font-semibold uppercase">Kenteken:</span>
                <div className="inline-flex items-center h-10 bg-[#F2C300] border-2 border-black rounded-sm overflow-hidden font-bold">
                  <div className="bg-[#0A3AA6] text-white px-2 h-full flex flex-col justify-center items-center text-[10px]">
                    <span>NL</span>
                  </div>
                  <span className="px-3 tracking-widest text-lg font-mono text-black">{plate}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Schade 1 */}
              <div className="bg-white border border-[#C2CAD2] rounded-lg p-5 shadow-xs">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-6 h-6 rounded-full bg-[#141B22] text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <h2 className="font-semibold text-base">Schade 1</h2>
                    <p className="text-xs text-[#5E6B78]">Plak hier de eerste calculatie als tekst</p>
                  </div>
                </div>
                <textarea
                  value={s1}
                  onChange={(e) => setS1(e.target.value)}
                  placeholder="Plak hier de complete tekst van calculatie 1 (incl. voorbereidingstijd en materiaalconstante)..."
                  className="w-full h-56 p-3 bg-[#FBFCFD] text-[#141B22] border border-[#C2CAD2] rounded-md font-mono text-xs focus:ring-2 focus:ring-[#E8831A] focus:outline-hidden resize-y"
                  spellCheck={false}
                />
              </div>

              {/* Schade 2 */}
              <div className="bg-white border border-[#C2CAD2] rounded-lg p-5 shadow-xs">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-6 h-6 rounded-full bg-[#141B22] text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h2 className="font-semibold text-base">Schade 2</h2>
                    <p className="text-xs text-[#5E6B78]">Plak hier de tweede calculatie als tekst</p>
                  </div>
                </div>
                <textarea
                  value={s2}
                  onChange={(e) => setS2(e.target.value)}
                  placeholder="Plak hier de complete tekst van calculatie 2..."
                  className="w-full h-56 p-3 bg-[#FBFCFD] text-[#141B22] border border-[#C2CAD2] rounded-md font-mono text-xs focus:ring-2 focus:ring-[#E8831A] focus:outline-hidden resize-y"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-end gap-4 bg-white p-4 border border-[#C2CAD2] rounded-lg">
              <div className="flex flex-col gap-1">
                <label htmlFor="kortingInput" className="text-xs font-semibold text-[#5E6B78]">
                  Korting op spuitmateriaal (%)
                </label>
                <input
                  id="kortingInput"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={korting}
                  onChange={(e) => setKorting(parseFloat(e.target.value) || 0)}
                  className="w-28 p-2 bg-[#FBFCFD] border border-[#C2CAD2] rounded-md text-sm font-semibold"
                />
              </div>
              <button
                onClick={handleCalculate}
                className="px-5 py-2.5 bg-[#E8831A] hover:bg-[#d0750f] text-white font-semibold text-sm rounded-md transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                Bereken aftrek
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-white hover:bg-gray-100 text-[#141B22] border border-[#C2CAD2] font-semibold text-sm rounded-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Opnieuw beginnen
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Results Display */}
            {calcResult && (
              <div className="bg-white border border-[#C2CAD2] rounded-lg p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b border-[#EDF0F3] pb-4">
                  <h3 className="text-lg font-bold">Resultaten aftrekberekening</h3>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-[#141B22] text-white rounded-md text-xs font-semibold flex items-center gap-2 hover:bg-black cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Opslaan als PDF / Printen
                  </button>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#FBFCFD] border border-[#C2CAD2] rounded-lg p-5">
                    <div className="text-xs font-bold text-[#5E6B78] uppercase tracking-wider">
                      In mindering brengen
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono mt-2 text-[#141B22]">
                      {calcResult.vbtAftrekAE !== null ? `−${Math.abs(calcResult.vbtAftrekAE)} AE` : '—'}
                    </div>
                    <div className="text-xs text-[#5E6B78] mt-1">voorbereidingstijd</div>
                    {calcResult.vbtUitleg && (
                      <div className="mt-3 pt-3 border-t border-dashed border-[#C2CAD2] text-xs font-mono text-[#5E6B78]">
                        {calcResult.vbtUitleg}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#FBEEDD] border-2 border-[#E8831A] rounded-lg p-5">
                    <div className="text-xs font-bold text-[#8A4B06] uppercase tracking-wider">
                      Invullen bij TZ-code 143
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold font-mono mt-2 text-[#8A4B06]">
                      {calcResult.matAftrekEuro !== null
                        ? `€ −${Math.abs(calcResult.matAftrekEuro).toFixed(2).replace('.', ',')}`
                        : '—'}
                    </div>
                    <div className="text-xs text-[#8A4B06] mt-1">aftrek spuitbedrag</div>
                    {calcResult.matUitleg && (
                      <div className="mt-3 pt-3 border-t border-dashed border-[#E8831A] text-xs font-mono text-[#8A4B06]">
                        {calcResult.matUitleg}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Box */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-[#141B22]">In het kort:</h4>
                  <div className="p-4 bg-[#EDF0F3] border-l-4 border-[#E8831A] rounded-r-md text-sm text-[#141B22]">
                    {calcResult.samenvatting}
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-[#141B22]">De rekensom, stap voor stap:</h4>
                  <ol className="list-decimal pl-5 space-y-1.5 text-sm text-[#5E6B78]">
                    {calcResult.stappen.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                </div>

                {/* Found Table */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-[#141B22]">Wat de app in de calculaties vond:</h4>
                  <div className="overflow-x-auto border border-[#EDF0F3] rounded-md">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#EDF0F3] text-[#5E6B78] uppercase font-mono">
                        <tr>
                          <th className="p-2.5">Calculatie</th>
                          <th className="p-2.5">Voorbereidingstijd</th>
                          <th className="p-2.5">Materiaalconstante</th>
                          <th className="p-2.5">Situatie / Montage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDF0F3]">
                        <tr>
                          <td className="p-2.5 font-semibold">Schade 1</td>
                          <td className="p-2.5">
                            {calcResult.gevonden.c1.vbt.length > 0
                              ? calcResult.gevonden.c1.vbt.map((v: any) => `${v.mat} ${v.ae} AE`).join(', ')
                              : '—'}
                          </td>
                          <td className="p-2.5">
                            {calcResult.gevonden.c1.mat.length > 0
                              ? calcResult.gevonden.c1.mat.map((m: any) => `${m.mat} € ${m.euro.toFixed(2)}`).join(', ')
                              : '—'}
                          </td>
                          <td className="p-2.5">
                            {calcResult.gevonden.c1.uitgebouwd
                              ? 'uitgebouwd'
                              : calcResult.gevonden.c1.voorspuiten
                              ? 'met voorspuiten'
                              : 'aan voertuig'}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold">Schade 2</td>
                          <td className="p-2.5">
                            {calcResult.gevonden.c2.vbt.length > 0
                              ? calcResult.gevonden.c2.vbt.map((v: any) => `${v.mat} ${v.ae} AE`).join(', ')
                              : '—'}
                          </td>
                          <td className="p-2.5">
                            {calcResult.gevonden.c2.mat.length > 0
                              ? calcResult.gevonden.c2.mat.map((m: any) => `${m.mat} € ${m.euro.toFixed(2)}`).join(', ')
                              : '—'}
                          </td>
                          <td className="p-2.5">
                            {calcResult.gevonden.c2.uitgebouwd
                              ? 'uitgebouwd'
                              : calcResult.gevonden.c2.voorspuiten
                              ? 'met voorspuiten'
                              : 'aan voertuig'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Warnings / Check yourself */}
                {calcResult.controlePunten.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-[#141B22]">Controleer dit zelf:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-[#5E6B78]">
                      {calcResult.controlePunten.map((cp, idx) => (
                        <li key={idx}>{cp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: ZELF REKENEN */}
        {activeTab === 'zelf' && (
          <section className="mt-6 space-y-6">
            {/* Box 1: Voorbereidingstijd */}
            <div className="bg-white border border-[#C2CAD2] rounded-lg p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#E8831A] rounded-xs inline-block" />
                Voorbereidingstijd berekenen
              </h2>
              <p className="text-xs text-[#5E6B78]">
                Stap 1: Vul de voorbereidingstijden uit de calculaties in.
              </p>

              {/* Table VBT */}
              <div className="overflow-x-auto border border-[#EDF0F3] rounded-md">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#EDF0F3] text-[#5E6B78] uppercase font-mono">
                    <tr>
                      <th className="p-2.5">Omschrijving</th>
                      <th className="p-2.5 w-32">AE</th>
                      <th className="p-2.5 w-16 text-center">Actie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF0F3]">
                    {vbtRows.map((row) => (
                      <tr key={row.id}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.desc}
                            onChange={(e) => {
                              const updated = vbtRows.map((r) =>
                                r.id === row.id ? { ...r, desc: e.target.value } : r
                              );
                              setVbtRows(updated);
                            }}
                            className="w-full p-1.5 border border-[#C2CAD2] rounded-xs bg-[#FBFCFD]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={row.ae}
                            onChange={(e) => {
                              const updated = vbtRows.map((r) =>
                                r.id === row.id ? { ...r, ae: parseFloat(e.target.value) || 0 } : r
                              );
                              setVbtRows(updated);
                            }}
                            className="w-full p-1.5 border border-[#C2CAD2] rounded-xs bg-[#FBFCFD] font-mono"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => setVbtRows(vbtRows.filter((r) => r.id !== row.id))}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setVbtRows([
                      ...vbtRows,
                      { id: Date.now().toString(), desc: 'Extra voorbereidingstijd', ae: 0 },
                    ])
                  }
                  className="px-3 py-1.5 border border-[#C2CAD2] rounded-md text-xs font-semibold hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Regel toevoegen
                </button>
                <button
                  onClick={() => setVbtRows([])}
                  className="px-3 py-1.5 border border-[#C2CAD2] rounded-md text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Leegmaken
                </button>
              </div>

              <div className="text-xs text-[#5E6B78] font-mono">
                Totaal in calculaties: {zelfCalc.totVbtIngesteld} AE
              </div>

              {/* Step 2 Selectors */}
              <div className="pt-4 border-t border-[#EDF0F3] space-y-3">
                <p className="text-xs text-[#5E6B78]">
                  Stap 2: Kies hoe de auto in één gecombineerde spuitgang wordt gespoten (AZT-tabel NL I/2013):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[#5E6B78] font-semibold mb-1">Laksysteem</label>
                    <select
                      value={qLak}
                      onChange={(e) => setQLak(e.target.value as any)}
                      className="w-full p-2 border border-[#C2CAD2] rounded-md bg-[#FBFCFD]"
                    >
                      <option value="2">2-lagen</option>
                      <option value="1">1-laags</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#5E6B78] font-semibold mb-1">Hoofdbewerking</label>
                    <select
                      value={qMat}
                      onChange={(e) => setQMat(e.target.value as any)}
                      className="w-full p-2 border border-[#C2CAD2] rounded-md bg-[#FBFCFD]"
                    >
                      <option value="metaal">Metaal</option>
                      <option value="kunststof">Kunststof</option>
                      <option value="spot" disabled={qLak === '1'}>Alleen spot repair</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#5E6B78] font-semibold mb-1">Spuitfase</label>
                    <select
                      value={qFase}
                      onChange={(e) => setQFase(e.target.value)}
                      disabled={qMat === 'spot'}
                      className="w-full p-2 border border-[#C2CAD2] rounded-md bg-[#FBFCFD]"
                    >
                      <option value="zwaar">Zware fase (SV, SH, SH1 / SV2-4)</option>
                      <option value="licht">Lichte fase (S / binnendeel / SV1)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#5E6B78] font-semibold mb-1">Situatie</label>
                    <select
                      value={qSit}
                      onChange={(e) => setQSit(parseInt(e.target.value))}
                      disabled={qMat === 'spot'}
                      className="w-full p-2 border border-[#C2CAD2] rounded-md bg-[#FBFCFD]"
                    >
                      <option value="0">Aan het voertuig, zonder voorspuiten</option>
                      <option value="1">Met voorspuiten, of los + aan het voertuig</option>
                      <option value="2">Alleen uitgebouwde delen</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-2">
                  <div>
                    <label className="block text-[#5E6B78] font-semibold mb-1">Tweede materiaalsoort</label>
                    <select
                      value={qTweede}
                      onChange={(e) => setQTweede(e.target.value)}
                      disabled={qMat === 'spot'}
                      className="w-full p-2 border border-[#C2CAD2] rounded-md bg-[#FBFCFD]"
                    >
                      <option value="geen">Geen</option>
                      <option value="zwaar">Ja, zware fase (+8 AE)</option>
                      <option value="licht">Ja, lichte fase (+5 AE)</option>
                      <option value="spot">Ja, ook spot repair (+5 AE)</option>
                    </select>
                  </div>
                  {qMat === 'spot' && (
                    <div>
                      <label className="block text-[#5E6B78] font-semibold mb-1">Aantal spot repairs</label>
                      <input
                        type="number"
                        min="1"
                        value={qSpots}
                        onChange={(e) => setQSpots(parseInt(e.target.value) || 1)}
                        className="w-full p-2 border border-[#C2CAD2] rounded-md bg-[#FBFCFD]"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="q2kCheck"
                      checked={q2k}
                      onChange={(e) => setQ2k(e.target.checked)}
                      className="w-4 h-4 text-[#E8831A]"
                    />
                    <label htmlFor="q2kCheck" className="text-xs font-semibold cursor-pointer">
                      2-kleuren spuiten meerekenen
                    </label>
                  </div>
                </div>

                <div className="pt-3">
                  <div className="text-xs text-[#5E6B78] font-mono">
                    Juist berekend bij één spuitgang: {zelfCalc.juist} AE
                  </div>
                  <div className="text-xl font-bold font-mono text-[#E8831A] mt-1">
                    Aftrek: −{zelfCalc.aftrekAE} AE
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Materiaalconstante */}
            <div className="bg-white border border-[#C2CAD2] rounded-lg p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#E8831A] rounded-xs inline-block" />
                Materiaalconstante berekenen (TZ 143)
              </h2>
              <p className="text-xs text-[#5E6B78]">
                Vul de materiaalconstantes in en vink aan welke dubbel zijn.
              </p>

              <div className="overflow-x-auto border border-[#EDF0F3] rounded-md">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#EDF0F3] text-[#5E6B78] uppercase font-mono">
                    <tr>
                      <th className="p-2.5">Omschrijving</th>
                      <th className="p-2.5 w-32">Bedrag (€)</th>
                      <th className="p-2.5 w-24 text-center">Dubbel?</th>
                      <th className="p-2.5 w-16 text-center">Actie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF0F3]">
                    {matRows.map((row) => (
                      <tr key={row.id}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.desc}
                            onChange={(e) => {
                              const updated = matRows.map((r) =>
                                r.id === row.id ? { ...r, desc: e.target.value } : r
                              );
                              setMatRows(updated);
                            }}
                            className="w-full p-1.5 border border-[#C2CAD2] rounded-xs bg-[#FBFCFD]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            value={row.euro}
                            onChange={(e) => {
                              const updated = matRows.map((r) =>
                                r.id === row.id ? { ...r, euro: parseFloat(e.target.value) || 0 } : r
                              );
                              setMatRows(updated);
                            }}
                            className="w-full p-1.5 border border-[#C2CAD2] rounded-xs bg-[#FBFCFD] font-mono"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={row.isDouble}
                            onChange={(e) => {
                              const updated = matRows.map((r) =>
                                r.id === row.id ? { ...r, isDouble: e.target.checked } : r
                              );
                              setMatRows(updated);
                            }}
                            className="w-4 h-4 text-[#E8831A]"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => setMatRows(matRows.filter((r) => r.id !== row.id))}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() =>
                    setMatRows([
                      ...matRows,
                      {
                        id: Date.now().toString(),
                        desc: 'Materiaalconstante',
                        euro: 45.3,
                        isDouble: true,
                      },
                    ])
                  }
                  className="px-3 py-1.5 border border-[#C2CAD2] rounded-md text-xs font-semibold hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Regel toevoegen
                </button>
                <div className="flex items-center gap-2">
                  <label htmlFor="korting2Input" className="text-xs text-[#5E6B78] font-semibold">
                    Korting (%):
                  </label>
                  <input
                    id="korting2Input"
                    type="number"
                    step="0.1"
                    value={korting2}
                    onChange={(e) => setKorting2(parseFloat(e.target.value) || 0)}
                    className="w-20 p-1.5 border border-[#C2CAD2] rounded-md text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="text-lg font-bold font-mono text-[#8A4B06]">
                  Invullen bij TZ-code 143: € −{zelfCalc.aftrekEuro.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-xs text-[#5E6B78] font-mono mt-1">
                  Dubbel totaal: € {zelfCalc.dubbelEuro.toFixed(2).replace('.', ',')} min {korting2}% = € {zelfCalc.aftrekEuro.toFixed(2).replace('.', ',')}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: NASLAG */}
        {activeTab === 'ref' && (
          <section className="mt-6 space-y-6">
            <div className="bg-white border border-[#C2CAD2] rounded-lg p-6 shadow-xs space-y-6 text-sm">
              <div>
                <h3 className="text-base font-bold text-[#141B22] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#E8831A] rounded-xs inline-block" />
                  Voorbereidingstijden AZT NL I/2013
                </h3>
                <p className="text-xs text-[#5E6B78] mb-3">Tijden in Arbeids-Eenheden (AE).</p>

                <div className="overflow-x-auto border border-[#EDF0F3] rounded-md">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#EDF0F3] text-[#5E6B78] uppercase font-mono">
                      <tr>
                        <th className="p-2.5">Hoofdbewerking (2-lagen)</th>
                        <th className="p-2.5 text-right">Aan voertuig, z. voorspuiten</th>
                        <th className="p-2.5 text-right">Met voorspuiten / los+aan</th>
                        <th className="p-2.5 text-right">Alleen uitgebouwd</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF0F3]">
                      <tr>
                        <td className="p-2 font-medium">Metaal SV, SH, SH1</td>
                        <td className="p-2 text-right font-mono">23</td>
                        <td className="p-2 text-right font-mono">27</td>
                        <td className="p-2 text-right font-mono">11</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Metaal S / binnendeel</td>
                        <td className="p-2 text-right font-mono">13</td>
                        <td className="p-2 text-right font-mono">—</td>
                        <td className="p-2 text-right font-mono">11</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Kunststof SV2/3/4, SH</td>
                        <td className="p-2 text-right font-mono">23</td>
                        <td className="p-2 text-right font-mono">27</td>
                        <td className="p-2 text-right font-mono">14</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Kunststof SV1, S</td>
                        <td className="p-2 text-right font-mono">13</td>
                        <td className="p-2 text-right font-mono">17</td>
                        <td className="p-2 text-right font-mono">11</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Spot repair</td>
                        <td className="p-2 text-center font-mono" colSpan={3}>
                          11 + 9 per spot repair (oppervlakte)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#141B22] mb-2">Gecombineerde tijd (tweede materiaalsoort)</h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-[#5E6B78]">
                  <li>Zware fase (kunststof SV2-4, SH of metaal SV, SH, SH1): <strong>8 AE</strong></li>
                  <li>Lichte fase (kunststof SV1, S of metaal S/binnendeel): <strong>5 AE</strong></li>
                  <li>Naast uitgebouwde delen ook spot repair: <strong>5 AE</strong></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#141B22] mb-2">Aftrek materiaalconstante (TZ-code 143)</h4>
                <p className="text-xs text-[#5E6B78] leading-relaxed">
                  Bij één complete calculatie met TZ-code 95 rekent Audatex dubbele vergoedingen zelf weg. Maak je losse calculaties voor schades die in één keer worden hersteld, dan breng je de dubbele materiaalconstante zelf in mindering met TZ-code 143 &quot;Aftrek/Toeslag spuitbedrag&quot;, als minbedrag.
                </p>
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md font-mono text-xs">
                  Dubbele constante(s): € 45,30<br />
                  Korting 12,5%: € 45,30 × 0,125 = € 5,66<br />
                  Aftrek: € 45,30 − € 5,66 = € 39,64<br />
                  Invullen bij TZ 143: <strong>−39,64</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer info */}
        <div className="mt-12 pt-6 border-t border-[#C2CAD2] text-center text-xs text-[#5E6B78] flex items-center justify-center gap-2">
          <span>Developed by:</span>
          <span className="w-1.5 h-1.5 bg-[#E8831A] rotate-45 inline-block" />
          <span className="font-['Michroma',sans-serif] text-xs font-bold text-[#141B22]">Danny Radjkoemar</span>
        </div>
      </main>

      {/* Side floating button for AZT Table Preview */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#E8831A] hover:bg-[#d0750f] text-white p-3 rounded-l-md font-semibold text-xs shadow-md transition-all flex items-center gap-2 z-20 cursor-pointer"
      >
        <span className="[writing-mode:vertical-rl] rotate-180 tracking-wider">AZT-TABEL</span>
        <span className="hidden sm:inline">Open tabel</span>
      </button>

      {/* Drawer modal for table view */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">Voorbereidingstijden AZT NL I/2013</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(Math.max(0.6, zoomLevel - 0.2))}
                  className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Passend
                </button>
                <button
                  onClick={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.2))}
                  className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-100 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="px-3 py-1.5 bg-[#141B22] text-white rounded-md text-xs font-semibold hover:bg-black cursor-pointer"
                >
                  Sluiten
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
              <div
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                className="transition-transform duration-150 bg-white p-6 rounded-lg shadow-md max-w-3xl text-xs space-y-4"
              >
                <div className="border-b pb-2 text-center">
                  <h4 className="font-bold text-sm text-[#141B22]">Voorbereidingstijden AZT NL I/2013 (Samenvatting)</h4>
                  <p className="text-[10px] text-gray-500">Eurotax / Solera AZT Normtijden</p>
                </div>

                <div>
                  <h5 className="font-bold mb-1 text-gray-700">2-lagen Laksysteem (tijden in AE)</h5>
                  <table className="w-full border-collapse border border-gray-300 text-[11px]">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 p-1.5 text-left">Omschrijving</th>
                        <th className="border border-gray-300 p-1.5 text-center">Aan voertuig</th>
                        <th className="border border-gray-300 p-1.5 text-center">Met voorspuiten</th>
                        <th className="border border-gray-300 p-1.5 text-center">Uitgebouwd</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-1.5">Metaal zware fase (SV, SH, SH1)</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">23</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">27</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">11</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5">Metaal lichte fase (S / binnendeel)</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">13</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">—</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">11</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5">Kunststof zware fase (SV2-4, SH)</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">23</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">27</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">14</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5">Kunststof lichte fase (SV1, S)</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">13</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">17</td>
                        <td className="border border-gray-300 p-1.5 text-center font-mono">11</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h5 className="font-bold mb-1 text-gray-700">Gecombineerd (tweede materiaalsoort)</h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-gray-50 border rounded-xs">
                      <span>Zware fase tweede materiaal:</span>
                      <strong className="block font-mono text-sm text-[#E8831A]">8 AE</strong>
                    </div>
                    <div className="p-2 bg-gray-50 border rounded-xs">
                      <span>Lichte fase tweede materiaal:</span>
                      <strong className="block font-mono text-sm text-[#E8831A]">5 AE</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold mb-1 text-gray-700">Extra toeslagen</h5>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-gray-600">
                    <li>2-kleuren spuiten: 1 AE</li>
                    <li>Lak aanmaken 2-kleuren: 3 AE</li>
                    <li>Proefstaal 2-kleuren: 3 AE</li>
                    <li>Afplakken kunststofdeel (S 9958): 2 AE</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Admin Modal */}
      <OwnerAdminModal
        config={securityConfig}
        isOpen={isOwnerModalOpen}
        currentUser={currentUser}
        onClose={() => setIsOwnerModalOpen(false)}
        onConfigUpdated={(newCfg) => {
          setSecurityConfig(newCfg);
        }}
      />
    </div>
  );
}
