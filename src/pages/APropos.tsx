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
      badge: "🌱 Pourquoi DGhubSchool",
      title: "Né du terrain. Construit pour les directeurs d'Afrique de l'Ouest.",
      desc: "Trop de directeurs gèrent encore leur école avec Excel, un cahier de caisse et des bulletins imprimés la veille. DGhubSchool est né pour mettre fin à cela — avec un outil simple, rapide et accessible depuis n'importe quel smartphone.",
      valuesBadge: "Ce en quoi nous croyons",
      valuesTitle: "Quatre piliers. Une seule obsession : votre efficacité.",
      missionTitle: "Notre Mission",
      missionDesc: "Donner à chaque directeur d'école africain le même niveau d'outillage que les meilleurs établissements privés internationaux. Automatiser les tâches répétitives (calcul des moyennes, suivi des paiements, impression des bulletins) pour libérer du temps pour l'essentiel : enseigner et encadrer.",
      transparentTitle: "Transparence totale",
      transparentDesc: "Chaque franc versé est enregistré, daté et associé à un élève. Le parent reçoit un reçu PDF + SMS en temps réel. La direction consulte son journal de caisse en direct et l'exporte en un clic. Plus d'ambigüité ni de contestation.",
      securityTitle: "Sécurité & Confidentialité",
      securityDesc: "Chaque élève a sa carte QR unique. Chaque établissement a son espace de données 100% isolé. Vos informations financières et académiques ne sont jamais partagées avec un autre établissement. Les sauvegardes sont automatiques et quotidiennes.",
      proximityTitle: "Proximité humaine",
      proximityDesc: "Un support dédié par WhatsApp et par téléphone, disponible 7j/7. Formation des équipes sur site, accompagnement au déploiement, suivi personnalisé toute l'année. Nous connaissons la réalité du terrain et nous sommes là quand vous en avez besoin.",
      adaptedTitle: "Conçu pour la réalité africaine",
      adaptedDesc1: "Nous savons que les coupures de réseau arrivent. Que tout le monde n'a pas un ordinateur. C'est pourquoi DGhubSchool est ultra-léger (moins de 500 Ko par page), accessible depuis n'importe quel Android ou iPhone, et utilisable même en connexion 2G ou 3G instable.",
      adaptedDesc2: "De l'encaissement d'un versement de scolarité à la validation d'une sortie d'élève par QR Code, chaque action prend moins de 2 secondes. Les bulletins PDF se génèrent en un clic. Les reçus SMS partent en moins de 3 secondes. Pas de formation technique nécessaire.",
      statsTitle: "DGhubSchool en chiffres réels",
      statsSchools: "Établissements actifs",
      statsStudents: "Élèves suivis",
      statsAPI: "Disponibilité plateforme",
      statsSupport: "Support disponible",
      ctaTitle: "Votre école a déjà attendu trop longtemps.",
      ctaDesc: "Première année gratuite pour tester la plateforme avec vos vraies données, vos vrais élèves. Aucune carte bancaire requise.",
      ctaBtn: "Lancer mon école gratuitement"
    },
    en: {
      back: "Home",
      badge: "🌱 Why DGhubSchool",
      title: "Born in the field. Built for West African school principals.",
      desc: "Too many principals still manage their school with Excel, a cash register book and last-minute printed report cards. DGhubSchool was born to end that — with a simple, fast tool accessible from any smartphone.",
      valuesBadge: "What we believe in",
      valuesTitle: "Four pillars. One obsession: your efficiency.",
      missionTitle: "Our Mission",
      missionDesc: "Give every African school principal the same level of tools as the best international private institutions. Automate repetitive tasks (average calculations, payment tracking, report card printing) to free up time for what matters: teaching and mentoring.",
      transparentTitle: "Total Transparency",
      transparentDesc: "Every franc paid is recorded, dated and linked to a student. The parent receives a PDF + SMS receipt in real time. The principal checks the cash journal live and exports it in one click. No more ambiguity or disputes.",
      securityTitle: "Security & Confidentiality",
      securityDesc: "Every student has a unique QR card. Every school has a 100% isolated data space. Your financial and academic information is never shared with another institution. Backups are automatic and daily.",
      proximityTitle: "Human Proximity",
      proximityDesc: "Dedicated support via WhatsApp and phone, available 7 days a week. On-site team training, deployment support, personalized follow-up all year. We know the reality of the field and we're here when you need us.",
      adaptedTitle: "Designed for the African reality",
      adaptedDesc1: "We know network outages happen. That not everyone has a computer. That's why DGhubSchool is ultra-lightweight (under 500 KB per page), accessible from any Android or iPhone, and usable even on unstable 2G or 3G connections.",
      adaptedDesc2: "From collecting a tuition payment to validating a student's exit by QR Code, every action takes under 2 seconds. PDF report cards generate in one click. SMS receipts go out in under 3 seconds. No technical training needed.",
      statsTitle: "DGhubSchool in real numbers",
      statsSchools: "Active schools",
      statsStudents: "Students tracked",
      statsAPI: "Platform uptime",
      statsSupport: "Support available",
      ctaTitle: "Your school has already waited long enough.",
      ctaDesc: "Free first year to test the platform with your real data, your real students. No credit card required.",
      ctaBtn: "Launch my school for free"
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
