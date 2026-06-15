import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [lang, setLang] = useState<'en' | 'fr'>('fr');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const texts: Record<'fr' | 'en', FooterLangText> = {
    fr: {
      testimonialTitle: "Votre succès inspire d'autres créateurs",
      testimonialText: "Partagez comment Chariow transforme votre activité. Votre témoignage encourage d'autres créateurs africains à sauter le pas.",
      subtitle: "La plateforme tout-en-un pour vendre vos produits numériques.",
      notice: "Chariow est un service d'Axa Zara LLC, une société américaine enregistrée dans l'État du Delaware. Axa Zara LLC est une entreprise technologique agissant en tant que fournisseur de services logiciels, mais non en tant que fournisseur de services de paiement ou marchand officiel. Les services de paiement et de facturation sont fournis par des prestataires agréés en partenariat avec MiMo Global Inc et ses filiales. Contactez-nous à support@chariow.com pour toute question.",
      copyright: "Copyright © 2026 Chariow - Axa Zara LLC. Tous droits réservés.",
      ctaButton: "Partager mon histoire",
      columns: {
        products: {
          title: "Produits",
          items: [
            { label: "Fichiers", path: "/features" },
            { label: "Cours", path: "/features" },
            { label: "Licences", path: "/features" },
            { label: "Packs (Bundles)", path: "/features" },
            { label: "Coaching", path: "/features" }
          ]
        },
        resources: {
          title: "Ressources",
          items: [
            { label: "Centre d'aide", path: "https://support.axazara.com/fr", external: true },
            { label: "Tarifs", path: "/pricing" },
            { label: "Roadmap", path: "/features" },
            { label: "Docs Développeurs", path: "/features" }
          ]
        },
        legal: {
          title: "Légal",
          items: [
            { label: "Politique de confidentialité", path: "/confidentialite" },
            { label: "Conditions d'utilisation", path: "/conditions-utilisation" },
            { label: "Sécurité", path: "/features" },
            { label: "Statut des services", path: "https://status.axazara.com", external: true }
          ]
        },
        company: {
          title: "Entreprise",
          items: [
            { label: "À propos", path: "/a-propos" },
            { label: "Équipe", path: "/a-propos" },
            { label: "Carrières", path: "https://careers.axazara.com/fr", external: true },
            { label: "Newsroom", path: "/#newsroom" },
            { label: "Contact", path: "mailto:support@chariow.com", external: true }
          ]
        }
      }
    },
    en: {
      testimonialTitle: "Your success inspires other creators",
      testimonialText: "Share how Chariow transforms your business. Your testimonial encourages other African creators to take the leap.",
      subtitle: "The All-in-One Platform to Sell Your Digital Products.",
      notice: "Chariow is a service of Axa Zara LLC, an American company registered in the State of Delaware. Axa Zara LLC is a technology company acting as a software service provider, but not as a payment service provider or merchant of record. Payment and billing services are provided by approved service providers in partnership with MiMo Global Inc and its affiliates. Contact us at support@chariow.com if you have any questions.",
      copyright: "Copyright © 2026 Chariow - Axa Zara LLC. All rights reserved.",
      ctaButton: "Share your story",
      columns: {
        products: {
          title: "Products",
          items: [
            { label: "Files", path: "/features" },
            { label: "Courses", path: "/features" },
            { label: "Licenses", path: "/features" },
            { label: "Bundles", path: "/features" },
            { label: "Coaching", path: "/features" }
          ]
        },
        resources: {
          title: "Resources",
          items: [
            { label: "Help Center", path: "https://support.axazara.com/fr", external: true },
            { label: "Pricing", path: "/pricing" },
            { label: "Roadmap", path: "/features" },
            { label: "Developer Docs", path: "/features" }
          ]
        },
        legal: {
          title: "Legal",
          items: [
            { label: "Privacy Policy", path: "/confidentialite" },
            { label: "Terms & conditions", path: "/conditions-utilisation" },
            { label: "Security", path: "/features" },
            { label: "Services status", path: "https://status.axazara.com", external: true }
          ]
        },
        company: {
          title: "Company",
          items: [
            { label: "About Us", path: "/a-propos" },
            { label: "People", path: "/a-propos" },
            { label: "Careers", path: "https://careers.axazara.com/fr", external: true },
            { label: "Newsroom", path: "/#newsroom" },
            { label: "Contact", path: "mailto:support@chariow.com", external: true }
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
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-900 text-slate-600 dark:text-slate-400 font-sans mt-auto select-none">
      
      {/* ── TESTIMONIAL BANNER (TOP FOOTER) ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12 border-b border-slate-200/50 dark:border-slate-900/50">
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
          <a
            href="mailto:support@chariow.com?subject=Témoignage%20Chariow"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 active:scale-95 transition-all duration-300 shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {current.ctaButton}
          </a>
        </div>
      </div>

      {/* ── MAIN COLUMNS ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
        
        {/* Brand column */}
        <div className="lg:col-span-4 space-y-6 text-left">
          <div 
            onClick={() => handleNavigation('/')}
            className="flex items-center gap-2.5 text-slate-950 dark:text-white font-black tracking-tighter text-2xl uppercase cursor-pointer select-none"
          >
            <img src="/logo.jpeg" className="w-8 h-8 object-contain rounded-xl bg-white p-0.5 border border-slate-200 dark:border-slate-800" alt="Logo Chariow" />
            <span>Chariow</span>
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
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Detailed Delaware legal notice */}
          <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-medium text-left">
            {current.notice}
          </p>

          <div className="border-t border-slate-200/30 dark:border-slate-900/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Copyright */}
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {current.copyright}
            </p>

            {/* Crafted by Axa Zara logo */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>Crafted by</span>
              <a
                href="https://axazara.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:opacity-85 transition-opacity"
              >
                <span className="text-amber-500 font-black text-xs uppercase tracking-tighter">Axa Zara</span>
              </a>
            </div>

          </div>

        </div>
      </div>

    </footer>
  );
};
