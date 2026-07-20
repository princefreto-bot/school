import React from 'react';
import { ArrowLeft, Landmark, FileText, Shield, Key, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Footer } from '../components/Footer';

interface ConditionsTranslations {
  backHome: string;
  badge: string;
  title: string;
  lastUpdated: string;
  highlightText: string;
  secPreambleTitle: string;
  secPreambleItem1: React.ReactNode;
  secPreambleItem2: React.ReactNode;
  secPreambleItem3: string;
  sec1Title: string;
  sec1Text: string;
  sec2Title: string;
  sec2Text: string;
  sec3Title: string;
  sec3P1: string;
  sec3BoxTitle: string;
  sec3BoxItem1School: React.ReactNode;
  sec3BoxItem2Parent: React.ReactNode;
  sec3Warning: string;
  sec4Title: string;
  sec4Text: string;
}

const translations: Record<'fr' | 'en', ConditionsTranslations> = {
  fr: {
    backHome: "Retour à l'accueil",
    badge: "📄 Contrat de Service",
    title: "Conditions générales d'utilisation",
    lastUpdated: "Dernière mise à jour : 20 Juillet 2026",
    highlightText: "L'utilisation du Service implique l'acceptation pleine et entière de ces conditions d'utilisation. Si vous agissez au nom d'un établissement scolaire, vous garantissez disposer des pouvoirs nécessaires pour l'engager juridiquement.",
    secPreambleTitle: "Préambule",
    secPreambleItem1: <><strong>« Nous »</strong> se réfère à la plateforme <strong>DGhubSchool</strong>.</>,
    secPreambleItem2: <><strong>« Le Service »</strong> désigne <strong>DGhubSchool</strong>, un logiciel de gestion scolaire et de suivi parental en tant que service (SaaS) accessible via Internet.</>,
    secPreambleItem3: "Le service est proposé via internet en tant que \"Software-as-a-Service\". L'utilisation du service implique l'acceptation de ces termes et conditions.",
    sec1Title: "1. Accès à la Plateforme & Sécurité",
    sec1Text: "L'accès au Service nécessite une inscription préalable. L'établissement et les parents s'engagent à fournir des informations réelles et à jour (noms, numéros de téléphone et e-mails réels). L'utilisateur est seul responsable de la confidentialité de son mot de passe et de son identifiant d'accès. Tout accès non autorisé doit être immédiatement signalé à notre support.",
    sec2Title: "2. Obligations de l'Établissement",
    sec2Text: "L'établissement scolaire s'engage à utiliser la plateforme dans le respect de la législation en vigueur relative à la protection des données personnelles de l'enfance. L'école est responsable de la validité et de la légalité des documents téléchargés ou scannés (actes de naissance, reçus financiers, photos d'élèves).",
    sec3Title: "3. Tarification & Non-Paiement",
    sec3P1: "L'inscription et l'utilisation de DGhubSchool sont entièrement gratuites pour les établissements scolaires, sans aucun frais de licence ni de maintenance. Le modèle économique du Service repose exclusivement sur la contribution annuelle des comptes parents, conformément aux tarifs indiqués au sein du Service.",
    sec3BoxTitle: "Période de grâce applicable (Essai initial) :",
    sec3BoxItem1School: <><strong>Établissements scolaires (Écoles)</strong> : Bénéficient d'un accès complet, gratuit et sans restriction, à durée indéterminée, dès la création de leur compte.</>,
    sec3BoxItem2Parent: <><strong>Comptes Parents</strong> : Bénéficient d'une période de grâce de <strong>14 jours</strong> après inscription pour lier et consulter les informations de leurs enfants, avant l'activation requise d'une licence de <strong>2 100 FCFA par élève et par an</strong>, payable en trois tranches de <strong>700 FCFA</strong>.</>,
    sec3Warning: "Si la contribution parentale n'est pas soldée à l'issue de la période de grâce et du délai accordé pour les tranches, l'accès au compte parent concerné sera automatiquement suspendu jusqu'au règlement de la somme due.",
    sec4Title: "4. Maintenance & Support",
    sec4Text: "Bien que nous nous efforcions de maintenir une disponibilité continue (avec un objectif de 99.9% de disponibilité réseau), nous ne garantissons pas un accès ininterrompu. Le Service peut subir des opérations de maintenance. Notre équipe technique s'engage à assurer un support continu et à communiquer sur les interruptions à l'avance dans la mesure du possible. Les données de chaque établissement font l'objet d'une sauvegarde automatique quotidienne, conservée 30 jours, sans que cela constitue une garantie absolue contre toute perte de données."
  },
  en: {
    backHome: "Back to home",
    badge: "📄 Terms of Service",
    title: "General Terms & Conditions",
    lastUpdated: "Last updated: July 20, 2026",
    highlightText: "The use of the Service implies the full and complete acceptance of these terms of use. If you act on behalf of a school, you warrant that you have the necessary authority to legally bind it.",
    secPreambleTitle: "Preamble",
    secPreambleItem1: <><strong>\"We\"</strong> refers to the <strong>DGhubSchool</strong> platform.</>,
    secPreambleItem2: <><strong>\"The Service\"</strong> designates <strong>DGhubSchool</strong>, a school management and parental tracking software as a service (SaaS) accessible via the Internet.</>,
    secPreambleItem3: "The service is offered via the internet as a \"Software-as-a-Service\". Using the service implies acceptance of these terms and conditions.",
    sec1Title: "1. Platform Access & Security",
    sec1Text: "Access to the Service requires prior registration. The school and parents agree to provide accurate and up-to-date information (real names, phone numbers, and emails). The user is solely responsible for the confidentiality of their password and access credentials. Any unauthorized access must be reported immediately to our support.",
    sec2Title: "2. Obligations of the Institution",
    sec2Text: "The school agrees to use the platform in compliance with current legislation regarding the protection of children's personal data. The school is responsible for the validity and legality of uploaded or scanned documents (birth certificates, financial receipts, student photos).",
    sec3Title: "3. Pricing & Non-Payment",
    sec3P1: "Registration and use of DGhubSchool are entirely free for schools, with no license or maintenance fees whatsoever. The Service's economic model relies exclusively on the annual contribution of parent accounts, in accordance with the rates indicated within the Service.",
    sec3BoxTitle: "Applicable Grace Period (Initial Trial):",
    sec3BoxItem1School: <><strong>School Institutions (Schools)</strong>: Benefit from full, free, unrestricted access for an indefinite period, starting from their account creation.</>,
    sec3BoxItem2Parent: <><strong>Parent Accounts</strong>: Benefit from a grace period of <strong>14 days</strong> after registration to link and view their children's information, before a license activation of <strong>2,100 FCFA per student per year</strong> is required, payable in three installments of <strong>700 FCFA</strong>.</>,
    sec3Warning: "If the parental contribution is not settled by the end of the grace period and the installment deadline, access to the parent account concerned will be automatically suspended until the amount due is paid.",
    sec4Title: "4. Maintenance & Support",
    sec4Text: "While we strive to maintain continuous availability (with a target of 99.9% network uptime), we do not guarantee uninterrupted access. The Service may undergo maintenance operations. Our technical team is committed to providing ongoing support and communicating interruptions in advance whenever possible. Each school's data is automatically backed up daily and retained for 30 days, though this does not constitute an absolute guarantee against data loss."
  }
};

export const ConditionsUtilisation: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: 'fr' | 'en' }>();
  const activeLang = (lang === 'fr' || lang === 'en') ? lang : 'fr';
  const t = translations[activeLang];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-amber-500/20 flex flex-col">
      
      {/* ── HEADER / NAVIGATION ── */}
      <header className="relative z-50 border-b border-slate-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex-shrink-0">
        <nav className="w-full flex items-center justify-between p-4 md:px-8">
          <div 
            onClick={() => navigate(`/${activeLang}`)}
            className="flex items-center gap-2 text-amber-600 font-black tracking-tighter text-xl uppercase select-none cursor-pointer"
          >
            <img src="/logo.svg" className="w-8 h-8 object-contain rounded-lg" alt="Logo" />
            <span className="text-amber-500">DGhubSchool</span>
          </div>
          
          <button 
            onClick={() => navigate(`/${activeLang}`)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t.backHome}
          </button>
        </nav>
      </header>

      {/* ── HERO HEADER ── */}
      <section className="relative w-full max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-xl space-y-4 text-left">
          <span className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/40 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
            {t.badge}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight uppercase">
            {t.title}
          </h1>
          <p className="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {t.lastUpdated}
          </p>
        </div>
        
        {/* Highlight box */}
        <div className="w-full md:w-fit bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80 p-6 rounded-[24px] shadow-sm max-w-sm flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-left font-medium">
            {t.highlightText}
          </p>
        </div>
      </section>

      {/* ── LEGAL CONTENT SECTION ── */}
      <section className="bg-slate-50/50 dark:bg-slate-950 py-16 px-6 md:px-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Préambule */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              {t.secPreambleTitle}
            </h2>
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                {t.secPreambleItem1}
              </p>
              <p>
                {t.secPreambleItem2}
              </p>
              <p>
                {t.secPreambleItem3}
              </p>
            </div>
          </div>

          {/* 1. Inscription et Accès */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.sec1Title}
              </h2>
            </div>
            
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {t.sec1Text}
            </p>
          </div>

          {/* 2. Obligations de l'Utilisateur */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Landmark className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.sec2Title}
              </h2>
            </div>
            
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {t.sec2Text}
            </p>
          </div>

          {/* 3. Tarification, Licences et Suspension */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.sec3Title}
              </h2>
            </div>
            
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                {t.sec3P1}
              </p>
              <div className="p-3.5 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/25 rounded-xl text-amber-600 dark:text-amber-400 font-semibold">
                💡 <strong>{t.sec3BoxTitle}</strong>
                <br />• {t.sec3BoxItem1School}
                <br />• {t.sec3BoxItem2Parent}
              </div>
              <p className="p-3 bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/25 rounded-xl text-rose-600 dark:text-rose-400 font-semibold">
                ⚠️ {t.sec3Warning}
              </p>
            </div>
          </div>

          {/* 4. Disponibilité & Support */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.sec4Title}
              </h2>
            </div>
            
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {t.sec4Text}
            </p>
          </div>

        </div>
      </section>

      {/* ── FOOTER UNIFIÉ ── */}
      <Footer />
      
    </div>
  );
};
