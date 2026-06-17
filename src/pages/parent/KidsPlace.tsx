// ============================================================
// KIDS PLACE — Espace Vidéos Éducatives pour Enfants
// Design enfantin, joyeux, avec lecteur YouTube intégré
// ============================================================
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Play, Star, Heart, Music, BookOpen, Sparkles,
  ChevronLeft, Volume2, Globe, ArrowRight
} from 'lucide-react';

// ── Données des vidéos ────────────────────────────────────────
interface KidsVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  category: 'comptines' | 'chretien' | 'educatif' | 'nature';
  emoji: string;
  color: string;
  ageRange: string;
}

const videos: KidsVideo[] = [
  // ─── Comptines & Chansons ───────────────────────────────────
  {
    id: 'v1',
    youtubeId: 'kytMGNsrVdQ',
    title: 'Comptines pour Enfants',
    description: 'Un voyage musical plein de chansons joyeuses pour apprendre en chantant et en dansant !',
    category: 'comptines',
    emoji: '🎵',
    color: '#F59E0B',
    ageRange: '2–8 ans',
  },
  {
    id: 'v2',
    youtubeId: '0RWGtmizro0',
    title: 'Comptines Chrétiennes',
    description: 'Des chansons spirituelles et douces pour les enfants, pleines de joie et d\'amour divin.',
    category: 'chretien',
    emoji: '🕊️',
    color: '#8B5CF6',
    ageRange: '3–10 ans',
  },
  // ─── Autres ressources éducatives YouTube ───────────────────
  {
    id: 'v3',
    youtubeId: 'wBsDHKl2CUw',
    title: 'L\'Alphabet en Français',
    description: 'Apprends les lettres A, B, C... en t\'amusant avec des animations colorées et des chansons.',
    category: 'educatif',
    emoji: '🔤',
    color: '#3B82F6',
    ageRange: '3–6 ans',
  },
  {
    id: 'v4',
    youtubeId: 'DR-cfDsHCGA',
    title: 'Les Chiffres 1 à 10',
    description: 'Compte de 1 à 10 avec des animations amusantes. Parfait pour apprendre les mathématiques !',
    category: 'educatif',
    emoji: '🔢',
    color: '#10B981',
    ageRange: '2–5 ans',
  },
  {
    id: 'v5',
    youtubeId: 'XKFMCVGZ4e4',
    title: 'Les Couleurs pour Enfants',
    description: 'Rouge, bleu, jaune, vert... Découvrons toutes les couleurs de l\'arc-en-ciel ensemble !',
    category: 'educatif',
    emoji: '🌈',
    color: '#EC4899',
    ageRange: '2–5 ans',
  },
  {
    id: 'v6',
    youtubeId: 'mCgBVMDCIAo',
    title: 'Les Animaux et leurs Cris',
    description: 'Écoute comment parle le lion, l\'éléphant, le chien... Une aventure sonore passionnante !',
    category: 'nature',
    emoji: '🦁',
    color: '#F97316',
    ageRange: '1–5 ans',
  },
];

// ── Catégories ────────────────────────────────────────────────
const categories = [
  { id: 'all', label: 'Tout voir', emoji: '✨', color: '#F59E0B' },
  { id: 'comptines', label: 'Comptines', emoji: '🎵', color: '#F59E0B' },
  { id: 'chretien', label: 'Chrétien', emoji: '🕊️', color: '#8B5CF6' },
  { id: 'educatif', label: 'Éducatif', emoji: '📚', color: '#3B82F6' },
  { id: 'nature', label: 'Nature', emoji: '🌿', color: '#10B981' },
] as const;

// ── SVG Stickers décoratifs ───────────────────────────────────
const StarSticker = ({ style }: { style?: React.CSSProperties }) => (
  <div style={{ ...style, position: 'absolute', pointerEvents: 'none' }}>
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path d="M20 4L24.2 15.8H36.6L26.7 23L30.9 34.8L20 27.6L9.1 34.8L13.3 23L3.4 15.8H15.8L20 4Z"
        fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5"/>
    </svg>
  </div>
);

const HeartSticker = ({ style }: { style?: React.CSSProperties }) => (
  <div style={{ ...style, position: 'absolute', pointerEvents: 'none' }}>
    <svg width="36" height="32" viewBox="0 0 36 32" fill="none">
      <path d="M18 29L3.5 15C1.3 12.9 1.3 9.4 3.5 7.3C5.7 5.2 9.2 5.2 11.4 7.3L18 13.7L24.6 7.3C26.8 5.2 30.3 5.2 32.5 7.3C34.7 9.4 34.7 12.9 32.5 15L18 29Z"
        fill="#FB7185" stroke="#F43F5E" strokeWidth="1.5"/>
    </svg>
  </div>
);

const CloudSticker = ({ style }: { style?: React.CSSProperties }) => (
  <div style={{ ...style, position: 'absolute', pointerEvents: 'none' }}>
    <svg width="60" height="40" viewBox="0 0 60 40" fill="none">
      <ellipse cx="30" cy="28" rx="28" ry="12" fill="white" opacity="0.7"/>
      <circle cx="20" cy="22" r="12" fill="white" opacity="0.7"/>
      <circle cx="36" cy="20" r="14" fill="white" opacity="0.7"/>
    </svg>
  </div>
);

const RainbowSticker = ({ style }: { style?: React.CSSProperties }) => (
  <div style={{ ...style, position: 'absolute', pointerEvents: 'none' }}>
    <svg width="70" height="40" viewBox="0 0 70 40" fill="none">
      <path d="M5 38C5 20 17 5 35 5C53 5 65 20 65 38" stroke="#F87171" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M12 38C12 23.5 22 12 35 12C48 12 58 23.5 58 38" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M19 38C19 27 26 18 35 18C44 18 51 27 51 38" stroke="#34D399" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M26 38C26 30.5 30 24 35 24C40 24 44 30.5 44 38" stroke="#60A5FA" strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
  </div>
);

const MusicNoteSticker = ({ style }: { style?: React.CSSProperties }) => (
  <div style={{ ...style, position: 'absolute', pointerEvents: 'none' }}>
    <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
      <path d="M12 28V10L28 6V24" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="8" cy="28" r="5" fill="#A78BFA"/>
      <circle cx="24" cy="24" r="5" fill="#A78BFA"/>
    </svg>
  </div>
);

// ── Composant principal ───────────────────────────────────────
export const KidsPlace: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();

  const [selectedVideo, setSelectedVideo] = useState<KidsVideo | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const filteredVideos = activeCategory === 'all'
    ? videos
    : videos.filter(v => v.category === activeCategory);

  const handlePlayVideo = (video: KidsVideo) => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setTimeout(() => setSelectedVideo(null), 300);
  };

  return (
    <div className="kids-page">

      {/* ── Decorative floating elements ── */}
      <StarSticker style={{ top: '80px', left: '5%', transform: 'rotate(-20deg)', opacity: 0.8 }} />
      <StarSticker style={{ top: '200px', right: '8%', transform: 'rotate(15deg) scale(0.7)', opacity: 0.6 }} />
      <HeartSticker style={{ top: '140px', left: '12%', transform: 'rotate(10deg)', opacity: 0.7 }} />
      <HeartSticker style={{ top: '320px', right: '5%', transform: 'scale(0.8) rotate(-15deg)', opacity: 0.5 }} />
      <CloudSticker style={{ top: '60px', right: '20%', opacity: 0.5 }} />
      <MusicNoteSticker style={{ top: '170px', right: '15%', transform: 'rotate(-10deg)', opacity: 0.7 }} />
      <RainbowSticker style={{ bottom: '10%', left: '3%', transform: 'scale(0.8)', opacity: 0.4 }} />

      {/* ── Header ── */}
      <header className="kids-header">
        <button
          onClick={() => navigate(`/${lang}`)}
          className="kids-back-btn"
        >
          <ChevronLeft size={20} />
          <span>Retour</span>
        </button>

        <div className="kids-header-logo">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="kids-logo-text">DGhub<span style={{ color: '#0F172A' }}>School</span></span>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="kids-hero">
        <div className="kids-hero-content">
          {/* Badge */}
          <div className="kids-hero-badge">
            <span>🎬</span>
            <span>Espace Kids</span>
          </div>

          {/* Title */}
          <h1 className="kids-hero-title">
            <span className="kids-title-line1">Ma Place</span>
            <span className="kids-title-line2">à Moi ! 🌟</span>
          </h1>

          <p className="kids-hero-sub">
            Des vidéos éducatives et des comptines sélectionnées avec amour pour apprendre en s'amusant !
          </p>

          {/* Fun stat pills */}
          <div className="kids-stat-pills">
            <div className="kids-stat-pill" style={{ background: 'rgba(245,158,11,0.15)', color: '#92400E' }}>
              <Play size={14} />
              <span>{videos.length} vidéos</span>
            </div>
            <div className="kids-stat-pill" style={{ background: 'rgba(139,92,246,0.15)', color: '#5B21B6' }}>
              <Star size={14} />
              <span>100% gratuit</span>
            </div>
            <div className="kids-stat-pill" style={{ background: 'rgba(16,185,129,0.15)', color: '#065F46' }}>
              <Heart size={14} />
              <span>Sélection parents</span>
            </div>
          </div>
        </div>

        {/* Decorative bubbles */}
        <div className="kids-bubble kids-bubble-1" />
        <div className="kids-bubble kids-bubble-2" />
        <div className="kids-bubble kids-bubble-3" />
      </section>

      {/* ── Player modal ── */}
      {isPlayerOpen && selectedVideo && (
        <div
          className={`kids-player-overlay ${isPlayerOpen ? 'kids-player-visible' : ''}`}
          onClick={(e) => { if (e.target === e.currentTarget) handleClosePlayer(); }}
        >
          <div className="kids-player-modal">
            {/* Player header */}
            <div className="kids-player-header" style={{ background: selectedVideo.color + '20', borderBottom: `2px solid ${selectedVideo.color}30` }}>
              <div className="kids-player-info">
                <span className="kids-player-emoji">{selectedVideo.emoji}</span>
                <div>
                  <h3 className="kids-player-title">{selectedVideo.title}</h3>
                  <span className="kids-player-age">{selectedVideo.ageRange}</span>
                </div>
              </div>
              <button className="kids-player-close" onClick={handleClosePlayer}>✕</button>
            </div>

            {/* YouTube embed */}
            <div className="kids-video-container">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&fs=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="kids-video-iframe"
              />
            </div>

            {/* Description */}
            <div className="kids-player-desc">
              <p>{selectedVideo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Filters ── */}
      <section className="kids-categories-section">
        <div className="kids-categories-inner">
          <div className="kids-section-label">
            <Sparkles size={16} />
            <span>Choisir une catégorie</span>
          </div>
          <div className="kids-categories">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`kids-cat-btn ${activeCategory === cat.id ? 'kids-cat-active' : ''}`}
                style={activeCategory === cat.id ? {
                  background: cat.color,
                  borderColor: cat.color,
                  color: '#fff',
                } : {}}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Video Grid ── */}
      <main className="kids-main">
        <div className="kids-videos-header">
          <h2 className="kids-videos-title">
            {activeCategory === 'all' ? '🎬 Toutes les vidéos' :
              categories.find(c => c.id === activeCategory)?.emoji + ' ' +
              categories.find(c => c.id === activeCategory)?.label}
          </h2>
          <span className="kids-video-count">{filteredVideos.length} vidéo{filteredVideos.length > 1 ? 's' : ''}</span>
        </div>

        <div className="kids-video-grid">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="kids-video-card"
              style={{ '--card-color': video.color } as React.CSSProperties}
            >
              {/* Thumbnail with YouTube preview */}
              <div className="kids-thumb-wrap">
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                  alt={video.title}
                  className="kids-thumb-img"
                  loading="lazy"
                />
                {/* Overlay gradient */}
                <div className="kids-thumb-overlay" style={{ background: `linear-gradient(to bottom, transparent 40%, ${video.color}cc)` }} />

                {/* Play button */}
                <button
                  onClick={() => handlePlayVideo(video)}
                  className="kids-play-btn"
                  style={{ background: video.color }}
                  aria-label={`Lire ${video.title}`}
                >
                  <Play size={24} fill="white" color="white" />
                </button>

                {/* Category badge */}
                <div className="kids-thumb-badge" style={{ background: video.color }}>
                  {video.emoji}
                </div>

                {/* Age range */}
                <div className="kids-age-badge">
                  {video.ageRange}
                </div>
              </div>

              {/* Card body */}
              <div className="kids-card-body">
                <h3 className="kids-card-title">{video.title}</h3>
                <p className="kids-card-desc">{video.description}</p>

                <button
                  onClick={() => handlePlayVideo(video)}
                  className="kids-watch-btn"
                  style={{ color: video.color, borderColor: video.color + '40' }}
                >
                  <Play size={14} />
                  <span>Regarder maintenant</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Tips Section ── */}
      <section className="kids-tips-section">
        <div className="kids-tips-inner">
          <div className="kids-tips-header">
            <div className="kids-tips-icon">💡</div>
            <div>
              <h3 className="kids-tips-title">Conseils pour les parents</h3>
              <p className="kids-tips-sub">Pour une expérience optimale avec vos enfants</p>
            </div>
          </div>
          <div className="kids-tips-grid">
            {[
              { icon: '👁️', tip: 'Regardez avec votre enfant pour renforcer l\'apprentissage' },
              { icon: '⏰', tip: 'Limitez les sessions à 15-20 minutes pour les plus petits' },
              { icon: '🎤', tip: 'Chantez et dansez avec les comptines pour plus de fun' },
              { icon: '🌙', tip: 'Évitez les écrans 1h avant le coucher pour un meilleur sommeil' },
            ].map((item, i) => (
              <div key={i} className="kids-tip-item">
                <span className="kids-tip-icon">{item.icon}</span>
                <p className="kids-tip-text">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="kids-footer">
        <div className="kids-footer-inner">
          <p className="kids-footer-text">
            🌟 DGhubSchool Kids Place · Contenu sélectionné pour votre sécurité
          </p>
          <p className="kids-footer-sub">
            Toutes les vidéos sont hébergées sur YouTube et suivent les directives de sécurité pour enfants.
          </p>
        </div>
      </footer>
    </div>
  );
};
