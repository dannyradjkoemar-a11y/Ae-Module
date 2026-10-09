import React, { useEffect, useState } from 'react';

interface CinematicIntroProps {
  onFinish: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'enter' | 'spin' | 'reveal' | 'exit'>('enter');

  useEffect(() => {
    // Stage 1: Initial 3D dramatic emergence & orbit acceleration (0 - 1.8s)
    const t1 = setTimeout(() => {
      setPhase('spin');
    }, 1800);

    // Stage 2: Logo settles in 3D, metallic light flare sweeps across, tagline lights up (1.8s - 4.2s)
    const t2 = setTimeout(() => {
      setPhase('reveal');
    }, 4200);

    // Stage 3: Cinematic slow-glow climax, preparing exit (4.2s - 5.5s)
    const t3 = setTimeout(() => {
      setPhase('exit');
    }, 5500);

    // Stage 4: Seamless dissolve to app (at 6.2s)
    const t4 = setTimeout(() => {
      onFinish();
    }, 6200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#090D11] text-white transition-opacity duration-700 cursor-pointer select-none overflow-hidden ${
        phase === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background cinematic lens flares & pulsing nebula */}
      <div className="absolute w-[650px] h-[650px] rounded-full bg-[#E8831A]/18 blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[100px] -translate-x-32 -translate-y-20 pointer-events-none" />

      {/* Cinematic Studio 3D Container with perspective */}
      <div className="relative flex flex-col items-center [perspective:1200px]">
        {/* Animated 3D Spinning Hex/Cube Halo */}
        <div
          className={`relative flex items-center justify-center transition-all duration-1200 ease-out transform-gpu ${
            phase === 'enter'
              ? '[transform:rotateY(270deg)_rotateX(35deg)_scale(0.3)] opacity-0'
              : phase === 'spin'
              ? '[transform:rotateY(25deg)_rotateX(10deg)_scale(1.08)] opacity-100'
              : '[transform:rotateY(0deg)_rotateX(0deg)_scale(1)] opacity-100'
          }`}
        >
          {/* Dual orbital rings rotating in opposing dimensions */}
          <div className="absolute w-40 h-40 rounded-full border border-[#E8831A]/40 animate-[spin_8s_linear_infinite]" />
          <div className="absolute w-52 h-52 rounded-full border border-dashed border-[#E8831A]/20 animate-[spin_12s_linear_infinite_reverse]" />
          <div className="absolute w-60 h-60 rounded-full border border-dotted border-gray-600/25 animate-[spin_18s_linear_infinite]" />

          {/* Central 3D Embossed Shield with metallic reflections */}
          <div className="relative w-32 h-32 rounded-2xl bg-gradient-to-br from-[#242D36] via-[#141B22] to-[#080B0E] border-2 border-[#E8831A] shadow-[0_0_60px_rgba(232,131,26,0.5),inset_0_2px_4px_rgba(255,255,255,0.25)] flex items-center justify-center">
            {/* Cinematic light sweep across logo */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="w-full h-full bg-gradient-to-tr from-transparent via-white/20 to-transparent transform -translate-x-full animate-[shimmer_2.5s_infinite]" />
            </div>

            <span className="font-['Michroma',sans-serif] text-5xl font-extrabold tracking-widest text-white drop-shadow-[0_4px_16px_rgba(255,255,255,0.5)]">
              AE
            </span>

            {/* Glowing 3D Diamond / Accent */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#E8831A] rotate-45 border-2 border-white/90 shadow-[0_0_20px_#E8831A] animate-pulse" />
          </div>
        </div>

        {/* Wordmark and Tagline with high-impact filmic fade */}
        <div
          className={`mt-8 text-center transition-all duration-1000 ease-out transform ${
            phase === 'enter'
              ? 'translate-y-6 opacity-0'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="font-['Michroma',sans-serif] text-2xl sm:text-3xl tracking-[0.4em] font-extrabold text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              AE MODULE
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#E8831A]" />
            <p className="text-[11px] sm:text-xs text-gray-300 tracking-[0.3em] uppercase font-semibold">
              Automotive Expertise Solutions
            </p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#E8831A]" />
          </div>
        </div>

        {/* Interactive skip tip */}
        <span className="absolute -bottom-24 text-[11px] text-gray-500 tracking-widest uppercase hover:text-gray-300 transition-colors">
          Klik om over te slaan
        </span>
      </div>
    </div>
  );
};
