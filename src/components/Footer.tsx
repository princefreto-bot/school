import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Linkedin, Facebook, Youtube, Instagram, Globe, Sparkles, Send } from 'lucide-react';

interface FooterItem {
  label: string;
  path: string;
  external?: boolean;
}

interface FooterColumn {
  title: string;
  items: FooterItem[];
}

interface FooterLangText {
  testimonialTitle: string;
  testimonialText: string;
  subtitle: string;
  notice: string;
  copyright: string;
  ctaButton: string;
  columns: {
    products: FooterColumn;
    resources: FooterColumn;
    legal: FooterColumn;
    company: FooterColumn;
  };
}

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const parts = location.pathname.split('/');
  const lang = (parts[1] === 'en' || parts[1] === 'fr') ? parts[1] as 'en' | 'fr' : 'fr';
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const setLang = (newLang: 'en' | 'fr') => {
    const parts = location.pathname.split('/');
    if (parts[1] === 'fr' || parts[1] === 'en') {
      parts[1] = newLang;
    } else {
      parts.unshift(newLang);
    }
    navigate(parts.join('/') + location.search + location.hash);
  };

  const texts: Record<'fr' | 'en', FooterLangText> = {
    fr: {
      testimonialTitle: "Votre témoignage peut convaincre 10 autres directeurs",
      testimonialText: "Partagez en 2 phrases comment DGhubSchool a transformé votre gestion quotidienne. Votre retour terrain est notre meilleure publicité — et il aide d'autres écoles à faire le bon choix.",
      subtitle: "L'outil tout-en-un des directeurs d'écoles en Afrique de l'Ouest.",
      notice: "DGhubSchool est une plateforme de gestion scolaire conçue pour les établissements primaires, secondaires et lycées. Elle couvre la gestion des paiements de scolarité, les bulletins académiques, le suivi des présences et le portail parents. Pour toute demande, écrivez-nous à support@dghubschool.com.",
      copyright: "Copyright © 2026 DGhubSchool — Tous droits réservés.",
      ctaButton: "Partager mon expérience",
      columns: {
        products: {
          title: "Fonctionnalités",
          items: [
            { label: "Caisse & Paiements", path: "/features" },
            { label: "Bulletins & Notes", path: "/features" },
            { label: "Portail Parents", path: "/features" },
            { label: "Cartes Scolaires QR", path: "/features" }
          ]
        },
        resources: {
          title: "Ressources",
          items: [
            { label: "Centre d'aide", path: "/centre-aide" },
            { label: "Tarifs", path: "/pricing" }
          ]
        },
        legal: {
          title: "Légal",
          items: [
            { label: "Politique de confidentialité", path: "/confidentialite" },
            { label: "Conditions d'utilisation", path: "/conditions-utilisation" }
          ]
        },
        company: {
          title: "À propos",
          items: [
            { label: "Notre histoire", path: "/a-propos" },
            { label: "Actualités", path: "/#newsroom" },
            { label: "Nous contacter", path: "https://wa.me/22872473027", external: true }
          ]
        }
      }
    },
    en: {
      testimonialTitle: "Your story can convince 10 other principals",
      testimonialText: "Share in 2 sentences how DGhubSchool transformed your daily management. Your field feedback is our best advertising — and helps other schools make the right choice.",
      subtitle: "The all-in-one tool for school principals in West Africa.",
      notice: "DGhubSchool is a school management platform designed for primary, secondary and high school institutions. It covers tuition payment management, academic report cards, attendance tracking and the parent portal. For any inquiries, write to us at support@dghubschool.com.",
      copyright: "Copyright © 2026 DGhubSchool — All rights reserved.",
      ctaButton: "Share my experience",
      columns: {
        products: {
          title: "Features",
          items: [
            { label: "Cashier & Payments", path: "/features" },
            { label: "Report Cards & Grades", path: "/features" },
            { label: "Parents Portal", path: "/features" },
            { label: "QR School Cards", path: "/features" }
          ]
        },
        resources: {
          title: "Resources",
          items: [
            { label: "Help Center", path: "/centre-aide" },
            { label: "Pricing", path: "/pricing" }
          ]
        },
        legal: {
          title: "Legal",
          items: [
            { label: "Privacy Policy", path: "/confidentialite" },
            { label: "Terms & Conditions", path: "/conditions-utilisation" }
          ]
        },
        company: {
          title: "About",
          items: [
            { label: "Our story", path: "/a-propos" },
            { label: "News", path: "/#newsroom" },
            { label: "Contact us", path: "https://wa.me/22872473027", external: true }
          ]
        }
      }
    }
  };

  const current = texts[lang];

  const handleNavigation = (path: string, external?: boolean) => {
    if (external) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else if (path.startsWith('/#')) {
      const elementId = path.substring(2);
      navigate(`/${lang}`);
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      navigate(`/${lang}${path}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-900 text-slate-600 dark:text-slate-400 font-sans mt-auto select-none">
      
      {/* ── TESTIMONIAL BANNER (TOP FOOTER) ── */}
      <div className="w-full px-6 md:px-8 py-10 md:py-12 border-b border-slate-200/50 dark:border-slate-900/50">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/[0.03] to-transparent dark:from-amber-950/20 dark:via-amber-950/[0.05] dark:to-transparent rounded-[32px] p-6 md:p-10 border border-amber-500/20 dark:border-amber-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl space-y-2">
            <h4 className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
              {current.testimonialTitle}
            </h4>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {current.testimonialText}
            </p>
          </div>
          <button
            onClick={() => handleNavigation('/partager-mon-histoire')}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 active:scale-95 transition-all duration-300 shrink-0 cursor-pointer border-none"
          >
            <Send className="w-3.5 h-3.5" />
            {current.ctaButton}
          </button>
        </div>
      </div>

      {/* ── MAIN COLUMNS ── */}
      <div className="w-full px-6 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
        
        {/* Brand column */}
        <div className="lg:col-span-4 space-y-6 text-left">
          <div 
            onClick={() => handleNavigation('/')}
            className="flex items-center gap-2.5 text-slate-950 dark:text-white font-black tracking-tighter text-2xl uppercase cursor-pointer select-none"
          >
            <img src="/logo.svg" className="w-8 h-8 object-contain rounded-xl bg-white p-0.5 border border-slate-200 dark:border-slate-800" alt="Logo DGhubSchool" />
            <span>DGhubSchool</span>
          </div>
          
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm">
            {current.subtitle}
          </p>

          {/* Social icons */}
          <div className="flex flex-row justify-start items-center gap-4 pt-2">
            {[
              { icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn", url: "https://www.linkedin.com/company/axa-zara-llc/" },
              { icon: <Facebook className="w-4 h-4" />, label: "Facebook", url: "https://web.facebook.com/axazaraHQ" },
              { icon: <Youtube className="w-4 h-4" />, label: "YouTube", url: "https://www.youtube.com/channel/UC_U9UG_8ZgGDDqXU-N2DQnA" },
              { icon: <Instagram className="w-4 h-4" />, label: "Instagram", url: "https://www.instagram.com/axazaraHQ" },
              {
                icon: (
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                ),
                label: "Twitter",
                url: "https://twitter.com/axazaraHQ"
              }
            ].map((soc, idx) => (
              <a
                key={idx}
                href={soc.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={soc.label}
                className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-center text-slate-500 hover:text-amber-500 hover:border-amber-500/50 dark:hover:text-amber-500 dark:hover:border-amber-500/50 shadow-sm transition-all duration-300"
              >
                {soc.icon}
              </a>
            ))}
          </div>

          {/* Language selector dropdown */}
          <div className="relative inline-block pt-2">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 shadow-sm hover:border-amber-500/50 transition-all duration-300 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span>{lang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}</span>
            </button>
            {langDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => { setLang('fr'); setLangDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${lang === 'fr' ? 'text-amber-500 font-black' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    <span>🇫🇷</span> Français
                  </button>
                  <button
                    onClick={() => { setLang('en'); setLangDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${lang === 'en' ? 'text-amber-500 font-black' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    <span>🇬🇧</span> English
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Links columns */}
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(current.columns).map(([key, col]) => (
            <div key={key} className="space-y-4 text-left">
              <h5 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                {col.title}
              </h5>
              <ul className="space-y-3 text-xs md:text-sm font-semibold">
                {col.items.map((item, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleNavigation(item.path, item.external)}
                      className="text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-500 transition-colors duration-250 text-left cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>

      {/* ── LEGAL NOTICE & COPYRIGHT (BOTTOM) ── */}
      <div className="border-t border-slate-200/50 dark:border-slate-900 bg-slate-100/50 dark:bg-slate-950/40 py-10 px-6 md:px-8">
        <div className="w-full space-y-8">
          
          {/* Detailed Delaware legal notice */}
          <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium text-left">
            {current.notice}
          </p>

          <div className="border-t border-slate-200/30 dark:border-slate-900/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Copyright */}
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {current.copyright}
            </p>

            {/* Removed Crafted by Axa Zara logo as per rebranding instructions */}

          </div>

        </div>
      </div>

    </footer>
  );
};
