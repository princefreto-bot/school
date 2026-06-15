import React from 'react';
import { ArrowLeft, Mail, HelpCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Footer } from '../components/Footer';

export const HelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();

  const texts = {
    fr: {
      support: "🤝 Support",
      title: "Centre d'aide",
      subtitle: "Comment pouvons-nous vous aider aujourd'hui ? Parcourez nos ressources ou contactez notre équipe.",
      emailSupport: "Support par Email",
      emailDesc: "Notre équipe technique est disponible pour résoudre vos problèmes complexes.",
      writeUs: "Nous écrire",
      docs: "Documentation",
      docsDesc: "Consultez nos guides et tutoriels pour maîtriser la plateforme.",
      soon: "Bientôt disponible",
      urgentTitle: "Un problème urgent ?",
      urgentDesc: "Si vous êtes administrateur d'un établissement, vous pouvez contacter directement votre gestionnaire de compte dédié."
    },
    en: {
      support: "🤝 Support",
      title: "Help Center",
      subtitle: "How can we help you today? Browse our resources or contact our team.",
      emailSupport: "Email Support",
      emailDesc: "Our technical team is available to solve your complex issues.",
      writeUs: "Write to us",
      docs: "Documentation",
      docsDesc: "Check out our guides and tutorials to master the platform.",
      soon: "Coming soon",
      urgentTitle: "Urgent issue?",
      urgentDesc: "If you are a school administrator, you can directly contact your dedicated account manager."
    }
  };

  const t = texts[lang];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-900">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="w-full px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/${lang}`)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center transform -rotate-6">
                <img src="/logo.png" className="w-full h-full object-contain rounded-md" alt="" />
              </div>
              <span className="font-black text-xl tracking-tight text-slate-950 dark:text-white">
                DGhub<span className="text-amber-500">School</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full">
        <div className="space-y-6 mb-16 text-center">
          <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full inline-block">
            {t.support}
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-950 dark:text-white tracking-tight uppercase leading-none">
            {t.title}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center hover:border-amber-500/50 transition-colors">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase mb-4">{t.emailSupport}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-medium">
              {t.emailDesc}
            </p>
            <a href="mailto:support@dghubschool.com" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-colors">
              {t.writeUs}
            </a>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center hover:border-amber-500/50 transition-colors">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
              <HelpCircle className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-black text-slate-950 dark:text-white uppercase mb-4">{t.docs}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-medium">
              {t.docsDesc}
            </p>
            <button className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-950 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors">
              {t.soon}
            </button>
          </div>

        </div>
        
        <div className="bg-slate-950 dark:bg-slate-900 rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white uppercase mb-4">{t.urgentTitle}</h3>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto font-medium">
              {t.urgentDesc}
            </p>
          </div>
          {/* Decors */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full"></div>
        </div>

      </main>

      <Footer />
    </div>
  );
};
