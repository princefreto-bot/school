// ============================================================
// PAGE À PROPOS (ABOUT) — Modern, Premium, Rounded Borders
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck, Heart, Users, Target } from 'lucide-react';
import { Footer } from '../components/Footer';
import { BACKEND_URL } from '../config';
import { StickerStar, StickerHeart, StickerCurvedArrow, StickerWave, StickerNote, StickerCircle, StickerSparkle, StickerCheck } from '../components/Stickers';

export const APropos: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();
  const [dbStats, setDbStats] = useState({ schools: 0, students: 0, documents: 0 });

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/public/stats`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setDbStats({
            schools: data.schools || 0,
            students: data.students || 0,
            documents: data.documents || 0
          });
        }
      })
      .catch(err => console.error("Erreur statistiques:", err));
  }, []);

  const texts = {
    fr: {
      back: "Accueil",
      badge: "🌱 Notre Histoire",
      title: "Repenser la gestion scolaire en Afrique de l'Ouest",
      desc: "Né du constat des difficultés rencontrées par les parents pour régler la scolarité et par les administrations pour éditer les bulletins scolaires papier, DGhubSchool propose un écosystème moderne, simple et accessible.",
      valuesBadge: "Nos Valeurs",
      valuesTitle: "Ce qui nous guide au quotidien",
      missionTitle: "Notre Mission",
      missionDesc: "Libérer les directeurs et enseignants des tâches répétitives (calcul des moyennes, impression des bulletins, suivi des paiements) grâce à un système automatisé accessible depuis n'importe quel smartphone, même en connexion 2G/3G.",
      transparentTitle: "Suivi Simple & Transparent",
      transparentDesc: "Chaque versement (espèces, chèques, Mobile Money, virements) est enregistré avec horodatage automatique. Le parent reçoit un reçu PDF + SMS instantanément. Le journal de caisse quotidien s'alimente en temps réel et s'exporte en Excel/CSV.",
      securityTitle: "Sécurité & Transparence",
      securityDesc: "Chaque élève dispose d'une carte d'identité avec QR Code crypté unique. Au scan d'entrée ou de sortie, le parent est notifié par SMS/Push en moins de 2 secondes. Les données financières sont chiffrées et les sauvegardes sont effectuées quotidiennement.",
      proximityTitle: "Proximité locale",
      proximityDesc: "Un support technique dédié disponible 7j/7 via WhatsApp et téléphone. Formation des équipes sur site, accompagnement au déploiement, et suivi personnalisé tout au long de l'année scolaire.",
      adaptedTitle: "Un outil conçu pour le terrain scolaire africain",
      adaptedDesc1: "Nous savons que les coupures de réseau et le manque de matériel informatique sont des réalités quotidiennes. C'est pourquoi DGhubSchool a été conçu pour être extrêmement léger (moins de 500 Ko par page) et utilisable directement depuis n'importe quel smartphone Android ou iPhone, même en connexion 2G.",
      adaptedDesc2: "De l'enregistrement d'un règlement de scolarité à la validation des sorties d'élèves par scan QR Code, chaque action prend moins de 2 secondes. Les bulletins PDF se génèrent en un clic et les reçus numériques sont envoyés par SMS en moins de 3 secondes.",
      statsTitle: "DGhubSchool en quelques chiffres",
      statsSchools: "Écoles partenaires",
      statsStudents: "Élèves enregistrés",
      statsAPI: "Disponibilité API",
      statsSupport: "Support technique",
      ctaTitle: "Rejoignez l'aventure DGhubSchool",
      ctaDesc: "Profitez de notre essai gratuit de 60 jours pour tester la plateforme avec vos élèves et vos professeurs.",
      ctaBtn: "Créer mon compte établissement"
    },
    en: {
      back: "Home",
      badge: "🌱 Our Story",
      title: "Rethinking school management in West Africa",
      desc: "Born from the observation of difficulties faced by parents to pay school fees and by administrations to issue paper report cards, DGhubSchool offers a modern, simple, and accessible ecosystem.",
      valuesBadge: "Our Values",
      valuesTitle: "What guides us daily",
      missionTitle: "Our Mission",
      missionDesc: "Free directors and teachers from repetitive tasks (average calculations, report card printing, payment tracking) through an automated system accessible from any smartphone, even on 2G/3G connection.",
      transparentTitle: "Simple & Transparent Tracking",
      transparentDesc: "Every payment (cash, checks, Mobile Money, transfers) is recorded with automatic timestamping. Parents receive an instant PDF + SMS receipt. The daily cash journal feeds in real time and exports to Excel/CSV.",
      securityTitle: "Security & Transparency",
      securityDesc: "Each student has an ID card with a unique encrypted QR Code. On entry or exit scan, parents are notified by SMS/Push in under 2 seconds. Financial data is encrypted and backups are performed daily.",
      proximityTitle: "Local Proximity",
      proximityDesc: "Dedicated technical support available 7 days a week via WhatsApp and phone. On-site team training, deployment assistance, and personalized follow-up throughout the school year.",
      adaptedTitle: "A tool designed for the African school context",
      adaptedDesc1: "We know that network outages and lack of computer equipment are daily realities. That is why DGhubSchool was designed to be extremely lightweight (under 500 KB per page) and usable directly from any Android or iPhone, even on 2G connection.",
      adaptedDesc2: "From recording a school fee payment to validating student exits by QR Code scan, each action takes under 2 seconds. PDF report cards are generated in one click and digital receipts are sent by SMS in under 3 seconds.",
      statsTitle: "DGhubSchool in numbers",
      statsSchools: "Partner schools",
      statsStudents: "Registered students",
      statsAPI: "API Availability",
      statsSupport: "Technical support",
      ctaTitle: "Join the DGhubSchool adventure",
      ctaDesc: "Take advantage of our 60-day free trial to test the platform with your students and teachers.",
      ctaBtn: "Create my school account"
    }
  };

  const t = texts[lang];

  const values = [
    {
      icon: <Target className="w-6 h-6 text-amber-500" />,
      title: t.missionTitle,
      desc: t.missionDesc
    },
    {
      icon: <Users className="w-6 h-6 text-amber-500" />,
      title: t.transparentTitle,
      desc: t.transparentDesc
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-amber-500" />,
      title: t.securityTitle,
      desc: t.securityDesc
    },
    {
      icon: <Heart className="w-6 h-6 text-amber-500" />,
      title: t.proximityTitle,
      desc: t.proximityDesc
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-['Poppins'] relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <nav className="w-full flex items-center justify-between p-4 md:px-8">
          <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl select-none cursor-pointer" onClick={() => navigate(`/${lang}`)}>
            <img src="/logo.svg" className="w-8 h-8 object-contain" alt="Logo" />
            <span className="text-amber-500">DGhub<span className="text-slate-900">School</span></span>
          </div>
          <button 
            onClick={() => navigate(`/${lang}`)} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.back}</span>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-16 md:pt-20 pb-12 text-center">
        {/* Stickers décoratifs Hero */}
        <StickerStar className="absolute top-20 left-6 hidden md:block" style={{ transform: 'rotate(-10deg)', opacity: 0.6 }} />
        <StickerHeart className="absolute top-16 right-8 hidden lg:block" style={{ transform: 'rotate(12deg)', opacity: 0.5 }} />
        <StickerSparkle className="absolute bottom-6 right-[20%] hidden md:block" />

        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          {t.badge}
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tight mb-6 animate-slideUp">
          {t.title}
        </h1>
        <p className="text-sm md:text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto font-medium">
          {t.desc}
        </p>
      </section>

      {/* Core Values Section */}
      <section className="relative z-10 bg-slate-50 border-y border-slate-200 py-20">
        {/* Stickers décoratifs Values */}
        <StickerCurvedArrow className="absolute top-16 right-12 hidden lg:block" style={{ transform: 'rotate(-10deg)' }} />
        <StickerCircle className="absolute bottom-12 left-8 hidden md:block" />
        <StickerNote className="absolute top-24 left-4 hidden xl:block" style={{ transform: 'rotate(-2deg)' }}>
          {lang === 'fr' ? 'Fait pour le terrain 🌍' : 'Built for the field 🌍'}
        </StickerNote>

        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">{t.valuesBadge}</h2>
            <h3 className="text-2xl md:text-4xl font-black text-slate-950 uppercase tracking-tight">
              {t.valuesTitle}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {values.map((val, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm flex gap-4 transition-all hover:shadow-md">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl h-fit shrink-0">
                  {val.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-950 uppercase tracking-wide mb-2">
                    {val.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {val.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About The Platform Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        {/* Stickers */}
        <StickerWave className="absolute top-12 right-4 hidden md:block" />
        <StickerCheck className="absolute bottom-16 left-8 hidden lg:block" style={{ transform: 'rotate(6deg)', opacity: 0.5 }} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-xl md:text-2xl font-black text-slate-950 uppercase tracking-tight leading-snug">
              {t.adaptedTitle}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">
              {t.adaptedDesc1}
            </p>
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">
              {t.adaptedDesc2}
            </p>
          </div>
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-3">
              {t.statsTitle}
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight block">
                  +{dbStats.schools.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.statsSchools}</span>
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight block">
                  +{dbStats.students.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.statsStudents}</span>
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight block">99.9%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.statsAPI}</span>
              </div>
              <div>
                <span className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight block">24/7</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.statsSupport}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-950 text-white py-16 text-center relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        {/* Sticker CTA */}
        <StickerStar className="absolute top-8 left-[10%] hidden md:block" style={{ opacity: 0.3 }} />

        <div className="max-w-3xl mx-auto px-4 space-y-6 relative z-10">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-snug">
            {t.ctaTitle}
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed font-medium">
            {t.ctaDesc}
          </p>
          <button 
            onClick={() => navigate(`/${lang}/creer-compte`)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest px-8 py-5 rounded-xl border border-amber-600 shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            {t.ctaBtn}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── FOOTER UNIFIÉ ── */}
      <Footer />
    </div>
  );
};
