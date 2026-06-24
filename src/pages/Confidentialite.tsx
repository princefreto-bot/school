import React from 'react';
import { ArrowLeft, Eye, Lock, FileText, Globe } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Footer } from '../components/Footer';

interface ConfidentialiteTranslations {
  badge: string;
  title: string;
  lastUpdated: string;
  highlightText: string;
  introTitle: string;
  introText: string;
  sec1Title: string;
  sec1Intro: string;
  sec1Item1: React.ReactNode;
  sec1Item2: React.ReactNode;
  sec1Item3: React.ReactNode;
  sec2Title: string;
  sec2Intro: string;
  sec2Item1: string;
  sec2Item2: string;
  sec2Item3: string;
  sec2Item4: string;
  sec3Title: string;
  sec3Intro: string;
  sec3Item1: React.ReactNode;
  sec3Item2: React.ReactNode;
  sec3Item3: React.ReactNode;
  sec4Title: string;
  sec4Text1: React.ReactNode;
  sec4Text2: string;
  backHome: string;
}

const translations: Record<'fr' | 'en', ConfidentialiteTranslations> = {
  fr: {
    backHome: "Retour à l'accueil",
    badge: "🛡️ Protection des Données",
    title: "Politique de confidentialité",
    lastUpdated: "Dernière mise à jour : 15 Juin 2026",
    highlightText: "Chez DGhubSchool, la protection de la vie privée des élèves et la sécurité des données financières et académiques sont fondamentales. Nous appliquons des protocoles d'isolation stricts pour chaque école.",
    introTitle: "Introduction",
    introText: "Chez DGhubSchool, nous accordons une priorité absolue à la protection et à la confidentialité des données personnelles des élèves, des parents et du personnel scolaire. Cette politique de confidentialité détaille comment nous collectons, gérons et sécurisons ces informations éducatives sensibles au sein de notre infrastructure multi-écoles isolée.",
    sec1Title: "1. Nature des Données Collectées",
    sec1Intro: "Dans le cadre de la gestion académique et financière de votre établissement, nous collectons uniquement les informations nécessaires :",
    sec1Item1: <><strong>Élèves</strong> : Noms, prénoms, date de naissance, classe, notes, relevés de présence et documents officiels numérisés (actes de naissance, bulletins scolaires antérieurs).</>,
    sec1Item2: <><strong>Parents</strong> : Noms, numéros de téléphone (utilisés pour les alertes de présence par SMS et reçus de scolarité numériques).</>,
    sec1Item3: <><strong>Personnel</strong> : Noms, rôles d'accès au système de l'école (directeur, comptable, enseignant, surveillant).</>,
    sec2Title: "2. Finalité des Traitements",
    sec2Intro: "Ces données sont exclusivement traitées pour assurer le bon fonctionnement administratif et pédagogique :",
    sec2Item1: "Le suivi financier, la facturation des frais scolaires et l'édition de reçus de paiement sécurisés.",
    sec2Item2: "La saisie des notes et l'édition automatique des bulletins et relevés de notes.",
    sec2Item3: "La numérisation sécurisée des dossiers des élèves via l'outil scanner intégré.",
    sec2Item4: "L'envoi d'alertes instantanées (notifications push et SMS d'absences ou de reçus financiers) aux parents.",
    sec3Title: "3. Sécurité & Hébergement",
    sec3Intro: "Toutes les données sont stockées et sécurisées à l'aide de protocoles stricts de niveau professionnel :",
    sec3Item1: <>Les bases de données sont gérées via <strong>Supabase</strong> et sont cryptées au repos et en transit via HTTPS/SSL.</>,
    sec3Item2: <>Les documents numérisés (actes de naissance, bulletins archivés) sont enregistrés dans un stockage privé sécurisé et ne sont accessibles qu'aux comptes autorisés.</>,
    sec3Item3: <>Un système d'authentification robuste (Jetons JWT sécurisés) empêche toute consultation non autorisée des données des élèves.</>,
    sec4Title: "4. Partage & Droits des Utilisateurs",
    sec4Text1: <><strong>Aucune donnée n'est cédée, vendue ou louée à des tiers à des fins publicitaires ou marketing.</strong></>,
    sec4Text2: "Conformément à la réglementation sur la protection des données personnelles, vous disposez d'un droit d'accès, de rectification et d'effacement de vos informations. Pour toute demande de modification ou suppression, vous pouvez contacter directement la direction de l'établissement scolaire ou envoyer un email à notre service technique.",
  },
  en: {
    backHome: "Back to home",
    badge: "🛡️ Data Protection",
    title: "Privacy Policy",
    lastUpdated: "Last updated: June 15, 2026",
    highlightText: "At DGhubSchool, protecting student privacy and securing financial and academic data are fundamental. We apply strict isolation protocols for each school.",
    introTitle: "Introduction",
    introText: "At DGhubSchool, we prioritize the protection and confidentiality of personal data of students, parents, and school staff. This privacy policy details how we collect, manage, and secure this sensitive educational information within our isolated multi-school infrastructure.",
    sec1Title: "1. Nature of Data Collected",
    sec1Intro: "As part of the academic and financial management of your school, we only collect the necessary information:",
    sec1Item1: <><strong>Students</strong>: Last names, first names, date of birth, grade level, grades, attendance records, and scanned official documents (birth certificates, previous report cards).</>,
    sec1Item2: <><strong>Parents</strong>: Names, phone numbers (used for attendance alerts via SMS and digital school fees receipts).</>,
    sec1Item3: <><strong>Staff</strong>: Names, access roles to the school system (principal, accountant, teacher, supervisor).</>,
    sec2Title: "2. Purpose of Processing",
    sec2Intro: "This data is processed exclusively to ensure smooth administrative and pedagogical operations:",
    sec2Item1: "Financial tracking, school fee billing, and the generation of secure payment receipts.",
    sec2Item2: "Grade recording and automatic generation of report cards and transcripts.",
    sec2Item3: "Secure digitization of student files via the integrated scanner tool.",
    sec2Item4: "Sending instant alerts (push notifications and SMS for absences or financial receipts) to parents.",
    sec3Title: "3. Security & Hosting",
    sec3Intro: "All data is stored and secured using strict professional-level protocols:",
    sec3Item1: <>Databases are managed via <strong>Supabase</strong> and are encrypted at rest and in transit via HTTPS/SSL.</>,
    sec3Item2: <>Scanned documents (birth certificates, archived report cards) are stored in secure private storage and are only accessible to authorized accounts.</>,
    sec3Item3: <>A robust authentication system (secure JWT tokens) prevents any unauthorized access to student data.</>,
    sec4Title: "4. Sharing & User Rights",
    sec4Text1: <><strong>No data is sold, rented, or shared with third parties for advertising or marketing purposes.</strong></>,
    sec4Text2: "In accordance with personal data protection regulations, you have the right to access, rectify, and delete your information. For any request for modification or deletion, you can directly contact the school administration or send an email to our technical support.",
  }
};

export const Confidentialite: React.FC = () => {
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
            <Lock className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-left font-medium">
            {t.highlightText}
          </p>
        </div>
      </section>

      {/* ── LEGAL CONTENT SECTION ── */}
      <section className="bg-slate-50/50 dark:bg-slate-950 py-16 px-6 md:px-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Introduction */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              {t.introTitle}
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {t.introText}
            </p>
          </div>

          {/* 1. Nature des Données Collectées */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.sec1Title}
              </h2>
            </div>
            
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                {t.sec1Intro}
              </p>
              <ul className="space-y-2 pl-4 list-disc marker:text-amber-500 leading-relaxed">
                <li>{t.sec1Item1}</li>
                <li>{t.sec1Item2}</li>
                <li>{t.sec1Item3}</li>
              </ul>
            </div>
          </div>

          {/* 2. Finalité des Traitements */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.sec2Title}
              </h2>
            </div>
            
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                {t.sec2Intro}
              </p>
              <ul className="space-y-2 pl-4 list-disc marker:text-amber-500 leading-relaxed">
                <li>{t.sec2Item1}</li>
                <li>{t.sec2Item2}</li>
                <li>{t.sec2Item3}</li>
                <li>{t.sec2Item4}</li>
              </ul>
            </div>
          </div>

          {/* 3. Sécurité et Hébergement */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.sec3Title}
              </h2>
            </div>
            
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                {t.sec3Intro}
              </p>
              <ul className="space-y-2 pl-4 list-disc marker:text-amber-500 leading-relaxed">
                <li>{t.sec3Item1}</li>
                <li>{t.sec3Item2}</li>
                <li>{t.sec3Item3}</li>
              </ul>
            </div>
          </div>

          {/* 4. Partage et Droits */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[24px] space-y-4 shadow-sm text-left">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">
                {t.sec4Title}
              </h2>
            </div>
            
            <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-3 font-medium">
              <p>
                {t.sec4Text1}
              </p>
              <p>
                {t.sec4Text2}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER UNIFIÉ ── */}
      <Footer />
      
    </div>
  );
};
