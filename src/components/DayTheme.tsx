import React, { useState, useEffect, useCallback } from 'react';

// ── Day detection (Africa/Lome timezone) ──
function getDayInLome(): number {
  const now = new Date();
  const lome = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lome' }));
  return lome.getDay();
}

function getTodayKey(): string {
  const now = new Date();
  const lome = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Lome' }));
  return `${lome.getFullYear()}-${lome.getMonth()}-${lome.getDate()}`;
}

type DayThemeType = 'friday' | 'sunday' | 'normal';

function getThemeType(): DayThemeType {
  const day = getDayInLome();
  if (day === 5) return 'friday';
  if (day === 0) return 'sunday';
  return 'normal';
}

// ── SVG Decorations ──
const MosqueSilhouette: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 800 200" fill="currentColor" className={className} preserveAspectRatio="xMidYMax meet">
    <defs>
      <linearGradient id="mosqueGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    {/* Central dome */}
    <ellipse cx="400" cy="120" rx="80" ry="70" fill="url(#mosqueGrad)" />
    <rect x="320" y="120" width="160" height="80" fill="url(#mosqueGrad)" />
    {/* Central minaret */}
    <rect x="390" y="30" width="20" height="90" fill="url(#mosqueGrad)" />
    <circle cx="400" cy="25" r="12" fill="url(#mosqueGrad)" />
    {/* Side domes */}
    <ellipse cx="250" cy="140" rx="50" ry="40" fill="url(#mosqueGrad)" />
    <rect x="200" y="140" width="100" height="60" fill="url(#mosqueGrad)" />
    <ellipse cx="550" cy="140" rx="50" ry="40" fill="url(#mosqueGrad)" />
    <rect x="500" y="140" width="100" height="60" fill="url(#mosqueGrad)" />
    {/* Left minaret */}
    <rect x="195" y="80" width="12" height="60" fill="url(#mosqueGrad)" />
    <circle cx="201" cy="76" r="8" fill="url(#mosqueGrad)" />
    {/* Right minaret */}
    <rect x="593" y="80" width="12" height="60" fill="url(#mosqueGrad)" />
    <circle cx="599" cy="76" r="8" fill="url(#mosqueGrad)" />
    {/* Far side structures */}
    <rect x="100" y="160" width="80" height="40" fill="url(#mosqueGrad)" />
    <ellipse cx="140" cy="160" rx="40" ry="25" fill="url(#mosqueGrad)" />
    <rect x="620" y="160" width="80" height="40" fill="url(#mosqueGrad)" />
    <ellipse cx="660" cy="160" rx="40" ry="25" fill="url(#mosqueGrad)" />
    {/* Base line */}
    <rect x="0" y="190" width="800" height="10" fill="url(#mosqueGrad)" />
  </svg>
);

const CrescentStar: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor" className={className}>
    <path d="M44 32c0-8.8-5.6-16.3-13.4-19.1C31.5 12.3 32 11.2 32 10c0-2.8-2.2-5-5-5s-5 2.2-5 5c0 .4.1.7.1 1.1C14.5 15.2 10 23.1 10 32c0 12.1 9.9 22 22 22s22-9.9 22-22h-10Z" />
    <polygon points="54,10 56.5,17 64,17 58,21.5 60,28.5 54,24 48,28.5 50,21.5 44,17 51.5,17" />
  </svg>
);

const SmallStar: React.FC<{ size?: number; className?: string }> = ({ size = 12, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
  </svg>
);

const PeaceDove: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor" className={className}>
    <path d="M56 8c-2 0-4.5 1-6 2.5L44 16l-8-2c-6-1-12 1-16 6l-6 10 16 4-8 10c-1.5 2.5.5 5.5 3 5.5l3-.5 10-12 16 4c4 1 8-1 10-4.5l6-14c1-3-1-6-4-7L56 8Z" />
    <circle cx="52" cy="14" r="2" opacity="0.3" />
    <path d="M20 38c-3 3-8 4-12 3 2 3 6 5 10 4l4-3-2-4Z" opacity="0.6" />
  </svg>
);

const OliveBranch: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 800 120" fill="currentColor" className={className} preserveAspectRatio="xMidYMax meet">
    <defs>
      <linearGradient id="branchGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.03" />
      </linearGradient>
    </defs>
    {/* Central vine */}
    <path d="M100 100 Q200 60 300 80 Q400 100 500 70 Q600 40 700 80" fill="none" stroke="url(#branchGrad)" strokeWidth="3" />
    {/* Leaves */}
    {[180, 260, 350, 440, 530, 620].map((x, i) => (
      <ellipse key={i} cx={x} cy={70 + (i % 2 ? -15 : 15)} rx="20" ry="10"
        fill="url(#branchGrad)" transform={`rotate(${i % 2 ? 30 : -30} ${x} ${70 + (i % 2 ? -15 : 15)})`} />
    ))}
  </svg>
);

// ── Floating particle wrapper ──
const Particle: React.FC<{
  children: React.ReactNode;
  style: React.CSSProperties;
}> = ({ children, style }) => (
  <div className="absolute pointer-events-none" style={style}>
    {children}
  </div>
);

// ── Seeded random for consistent particle positions ──
function seededPositions(count: number) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      x: (i * 37 + 11) % 94 + 3,
      y: (i * 53 + 7) % 84 + 8,
      size: 6 + (i % 5) * 3,
      delay: i * 0.8,
      duration: 6 + (i % 4) * 3,
      opacity: 0.06 + (i % 5) * 0.02,
      rotation: (i * 47) % 360,
    });
  }
  return items;
}

// ── Friday Greeting Card ──
const FridayGreeting: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting' | 'gone'>('entering');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 100);
    const t2 = setTimeout(() => setPhase('exiting'), 14000);
    const t3 = setTimeout(() => { setPhase('gone'); onDismiss(); }, 14600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDismiss]);

  const dismiss = useCallback(() => {
    setPhase('exiting');
    setTimeout(() => { setPhase('gone'); onDismiss(); }, 500);
  }, [onDismiss]);

  if (phase === 'gone') return null;

  const particles = seededPositions(24);
  const isVisible = phase === 'visible';
  const isExiting = phase === 'exiting';

  return (
    <div
      className={`fixed inset-0 z-[10001] flex items-center justify-center p-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : isExiting ? 'opacity-0' : 'opacity-0'}`}
      onClick={dismiss}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#064e3b]/90 via-[#0a1628]/85 to-[#064e3b]/90 backdrop-blur-2xl" />

      {/* Mosque silhouette at bottom */}
      <div className="absolute bottom-0 left-0 right-0 text-emerald-400">
        <MosqueSilhouette />
      </div>

      {/* Floating stars & crescents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <Particle
            key={i}
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              opacity: p.opacity,
              animation: `dayThemeFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          >
            {i % 4 === 0 ? (
              <CrescentStar size={p.size * 1.5} className="text-[#F4B400]" />
            ) : (
              <SmallStar size={p.size} className={i % 2 === 0 ? 'text-[#F4B400]' : 'text-emerald-300'} />
            )}
          </Particle>
        ))}
      </div>

      {/* Card */}
      <div
        className={`relative max-w-md w-full rounded-[32px] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] font-['Poppins']
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-12'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Card bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/95 via-[#064e3b]/95 to-emerald-950/95 border border-emerald-500/20 rounded-[32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(244,180,0,0.12),transparent_60%)]" />

        {/* Islamic geometric pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5'%3E%3Cpolygon points='40,5 75,25 75,55 40,75 5,55 5,25'/%3E%3Cpolygon points='40,15 65,30 65,50 40,65 15,50 15,30'/%3E%3Cline x1='40' y1='5' x2='40' y2='75'/%3E%3Cline x1='5' y1='25' x2='75' y2='55'/%3E%3Cline x1='75' y1='25' x2='5' y2='55'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative px-8 py-10 sm:px-10 sm:py-14 text-center space-y-5">

          {/* Logo + Crescent */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#F4B400] to-[#D9A100] flex items-center justify-center shadow-[0_0_50px_rgba(244,180,0,0.35)] animate-[dayThemePulseGlow_3s_ease-in-out_infinite]">
                <svg viewBox="0 0 40 40" className="w-10 h-10 text-emerald-900">
                  <path fill="currentColor" d="M32 18.5A14 14 0 0 1 25 17c-7.7 0-14-6.3-14-14 0-1 .1-1.8.3-2.7A14 14 0 0 0 4 13c0 7.7 6.3 14 14 14a14 14 0 0 0 14-8.5Z" transform="translate(4, 6)" />
                </svg>
              </div>
              <SmallStar size={10} className="absolute -top-1 -right-2 text-[#F4B400] animate-[dayThemeTwinkle_2s_ease-in-out_infinite]" />
              <SmallStar size={7} className="absolute top-1 -left-3 text-emerald-300 animate-[dayThemeTwinkle_2.5s_ease-in-out_0.7s_infinite]" />
              <SmallStar size={5} className="absolute -bottom-1 right-1 text-[#F4B400] animate-[dayThemeTwinkle_1.8s_ease-in-out_1.2s_infinite]" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#F4B400]/70">
              Vendredi Béni
            </p>
            <h1 className="text-[40px] sm:text-[48px] font-black text-white tracking-tight leading-[1.05]">
              Jummah<br />
              <span className="bg-gradient-to-r from-[#F4B400] via-[#FBBF24] to-[#F4B400] bg-clip-text text-transparent">
                Mubarak
              </span>
            </h1>
            <p className="text-xl text-[#F4B400]/80 font-normal" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>
              جمعة مباركة
            </p>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F4B400] shadow-[0_0_8px_rgba(244,180,0,0.6)]" />
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
          </div>

          {/* Message */}
          <p className="text-emerald-100/70 text-[13px] leading-relaxed max-w-xs mx-auto">
            Que cette journée bénie apporte paix, sérénité et bénédictions
            à toute la communauté <span className="font-bold text-[#F4B400]">DGhubSchool</span>.
          </p>

          {/* CTA */}
          <button
            onClick={dismiss}
            className="inline-flex items-center gap-2.5 px-7 py-3 bg-[#F4B400]/15 hover:bg-[#F4B400]/25 border border-[#F4B400]/30 hover:border-[#F4B400]/50 text-[#F4B400] hover:text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 active:scale-[0.96] backdrop-blur-sm shadow-[0_0_20px_rgba(244,180,0,0.1)]"
          >
            Amine — Continuer
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          {/* Brand footer */}
          <p className="text-[8px] font-bold text-emerald-500/30 uppercase tracking-[0.3em] pt-2">
            DGhubSchool — Éducation · Innovation · Communauté
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Sunday Greeting Card ──
const SundayGreeting: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting' | 'gone'>('entering');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 100);
    const t2 = setTimeout(() => setPhase('exiting'), 14000);
    const t3 = setTimeout(() => { setPhase('gone'); onDismiss(); }, 14600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDismiss]);

  const dismiss = useCallback(() => {
    setPhase('exiting');
    setTimeout(() => { setPhase('gone'); onDismiss(); }, 500);
  }, [onDismiss]);

  if (phase === 'gone') return null;

  const particles = seededPositions(18);
  const isVisible = phase === 'visible';
  const isExiting = phase === 'exiting';

  return (
    <div
      className={`fixed inset-0 z-[10001] flex items-center justify-center p-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : isExiting ? 'opacity-0' : 'opacity-0'}`}
      onClick={dismiss}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/90 via-[#0a1628]/85 to-violet-950/90 backdrop-blur-2xl" />

      {/* Olive branch at bottom */}
      <div className="absolute bottom-0 left-0 right-0 text-violet-400">
        <OliveBranch />
      </div>

      {/* Floating doves & leaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <Particle
            key={i}
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              opacity: p.opacity,
              animation: `dayThemeFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          >
            {i % 4 === 0 ? (
              <PeaceDove size={p.size * 2} className="text-sky-300" />
            ) : i % 4 === 1 ? (
              <SmallStar size={p.size} className="text-violet-300" />
            ) : (
              <SmallStar size={p.size * 0.8} className="text-[#F4B400]" />
            )}
          </Particle>
        ))}
      </div>

      {/* Card */}
      <div
        className={`relative max-w-md w-full rounded-[32px] overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] font-['Poppins']
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-12'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/95 via-violet-900/95 to-slate-900/95 border border-violet-500/20 rounded-[32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(244,180,0,0.06),transparent_50%)]" />

        {/* Soft dot pattern */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='2' fill='%23ffffff'/%3E%3C/svg%3E")`,
        }} />

        <div className="relative px-8 py-10 sm:px-10 sm:py-14 text-center space-y-5">

          {/* Dove Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.3)] animate-[dayThemePulseGlow_4s_ease-in-out_infinite]">
                <PeaceDove size={44} className="text-white drop-shadow-lg" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#F4B400] flex items-center justify-center shadow-lg animate-[dayThemeSwing_3s_ease-in-out_infinite]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 12.5 2 12.5s3-3.5 5.5-4S17 8 17 8Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-violet-300/70">
              Jour de Grâce & de Repos
            </p>
            <h1 className="text-[40px] sm:text-[48px] font-black text-white tracking-tight leading-[1.05]">
              Dimanche<br />
              <span className="bg-gradient-to-r from-sky-300 via-violet-300 to-[#F4B400] bg-clip-text text-transparent">
                de Paix
              </span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-sky-300/60 text-xs font-semibold tracking-[0.2em]">
              <span>Repos</span>
              <div className="w-1 h-1 rounded-full bg-[#F4B400]" />
              <span>Sérénité</span>
              <div className="w-1 h-1 rounded-full bg-[#F4B400]" />
              <span>Renouveau</span>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F4B400] shadow-[0_0_8px_rgba(244,180,0,0.6)]" />
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
          </div>

          {/* Message */}
          <p className="text-indigo-100/70 text-[13px] leading-relaxed max-w-xs mx-auto">
            Que ce dimanche vous offre le repos mérité et l'énergie pour
            une nouvelle semaine pleine de réussite avec <span className="font-bold text-[#F4B400]">DGhubSchool</span>.
          </p>

          {/* CTA */}
          <button
            onClick={dismiss}
            className="inline-flex items-center gap-2.5 px-7 py-3 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/30 hover:border-violet-400/50 text-violet-200 hover:text-white rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 active:scale-[0.96] backdrop-blur-sm shadow-[0_0_20px_rgba(139,92,246,0.1)]"
          >
            Paix à tous — Continuer
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <p className="text-[8px] font-bold text-violet-500/30 uppercase tracking-[0.3em] pt-2">
            DGhubSchool — Éducation · Innovation · Communauté
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Ambient Particles (visible after greeting dismissed) ──
const AmbientParticles: React.FC<{ theme: DayThemeType }> = ({ theme }) => {
  if (theme === 'normal') return null;
  const particles = seededPositions(10);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {particles.map((p, i) => (
        <Particle
          key={i}
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            opacity: p.opacity * 0.6,
            animation: `dayThemeFloat ${p.duration + 4}s ease-in-out ${p.delay}s infinite`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          {theme === 'friday' ? (
            i % 3 === 0
              ? <CrescentStar size={p.size * 1.2} className="text-[#F4B400]" />
              : <SmallStar size={p.size} className="text-emerald-400/80" />
          ) : (
            i % 3 === 0
              ? <PeaceDove size={p.size * 1.5} className="text-violet-400/80" />
              : <SmallStar size={p.size * 0.8} className="text-sky-400/60" />
          )}
        </Particle>
      ))}
    </div>
  );
};

// ── Top Banner (persistent, brand-styled) ──
const DayBanner: React.FC<{ theme: DayThemeType }> = ({ theme }) => {
  if (theme === 'normal') return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9999] h-7 flex items-center justify-center font-['Poppins'] transition-all duration-500 ${
      theme === 'friday'
        ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 shadow-[0_2px_12px_rgba(16,185,129,0.2)]'
        : 'bg-gradient-to-r from-indigo-700 via-violet-600 to-indigo-700 shadow-[0_2px_12px_rgba(139,92,246,0.2)]'
    }`}>
      <div className="flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.25em] text-white/90">
        {theme === 'friday' ? (
          <>
            <SmallStar size={6} className="text-[#F4B400] animate-[dayThemeTwinkle_2s_ease-in-out_infinite]" />
            <span>Jummah Mubarak</span>
            <span className="text-[#F4B400]/80">—</span>
            <span className="text-[#F4B400]/90" style={{ fontFamily: "'Amiri', serif" }}>جمعة مباركة</span>
            <span className="text-[#F4B400]/80">—</span>
            <span>Bon Vendredi Béni</span>
            <SmallStar size={6} className="text-[#F4B400] animate-[dayThemeTwinkle_2s_ease-in-out_0.5s_infinite]" />
          </>
        ) : (
          <>
            <PeaceDove size={10} className="text-sky-200" />
            <span>Dimanche de Paix</span>
            <span className="text-[#F4B400]/80">·</span>
            <span className="text-sky-200/80">Repos & Sérénité</span>
            <span className="text-[#F4B400]/80">·</span>
            <span>Bonne journée</span>
            <SmallStar size={5} className="text-[#F4B400]" />
          </>
        )}
      </div>
    </div>
  );
};

// ── Main DayTheme Component ──
export const DayThemeOverlay: React.FC = () => {
  const [themeType] = useState<DayThemeType>(getThemeType);
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    if (themeType === 'normal') return;
    const storageKey = `dayTheme_${themeType}_${getTodayKey()}`;
    try {
      if (!localStorage.getItem(storageKey)) {
        setShowGreeting(true);
        localStorage.setItem(storageKey, 'shown');
      }
    } catch {
      setShowGreeting(true);
    }
  }, [themeType]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('day-theme-friday', 'day-theme-sunday');
    if (themeType === 'friday') root.classList.add('day-theme-friday');
    if (themeType === 'sunday') root.classList.add('day-theme-sunday');

    // Push body down by 28px to make room for the fixed banner
    if (themeType !== 'normal') {
      document.body.style.paddingTop = '28px';
    }

    return () => {
      root.classList.remove('day-theme-friday', 'day-theme-sunday');
      document.body.style.paddingTop = '';
    };
  }, [themeType]);

  if (themeType === 'normal') return null;

  return (
    <>
      <AmbientParticles theme={themeType} />
      <DayBanner theme={themeType} />
      {showGreeting && themeType === 'friday' && (
        <FridayGreeting onDismiss={() => setShowGreeting(false)} />
      )}
      {showGreeting && themeType === 'sunday' && (
        <SundayGreeting onDismiss={() => setShowGreeting(false)} />
      )}
    </>
  );
};

export { getThemeType, type DayThemeType };
