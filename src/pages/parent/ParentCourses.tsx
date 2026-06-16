import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  BookOpen, Award, CheckCircle, XCircle, Play, FileText, 
  ChevronRight, BookOpenCheck, ArrowLeft, ArrowRight, 
  Book, Download, Eye, Sparkles, Trophy, CheckCircle2,
  ChevronLeft, Search, ZoomIn, ZoomOut, AlignLeft
} from 'lucide-react';

interface BookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  coverGradient: string;
  pagesCount: number;
  chapters: { title: string; content: string }[];
  pdfUrl?: string;
  htmlUrl?: string;
}

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface SubjectWorkbook {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  questionsCount: number;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  color: string;
  questions: Question[];
}

export const ParentCourses: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();

  // Navigation par onglets local
  const [activeTab, setActiveTab] = useState<'library' | 'exercises' | 'resources'>('library');

  // États pour la bibliothèque & le lecteur de livres
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  // États pour les exercices
  const [activeWorkbook, setActiveWorkbook] = useState<SubjectWorkbook | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // ── Bibliothèque d'Ebooks Intégrés ──
  const books: BookItem[] = [
    {
      id: "l-enfant-noir",
      title: "L'Enfant Noir",
      author: "Camara Laye",
      category: "Littérature Africaine",
      description: "Roman autobiographique décrivant l'enfance de l'auteur en Haute-Guinée, son éducation traditionnelle et son départ pour la France.",
      coverGradient: "from-amber-600 via-orange-600 to-amber-800",
      pagesCount: 180,
      chapters: [
        {
          title: "Chapitre 1 : Mon enfance et la forge",
          content: "J'étais enfant et je jouais près de la forge de mon père. Mon père était un forgeron renommé à Kouroussa. Dans l'atelier de forge, le feu crépitait sous le soufflet magique. Je regardais les étincelles s'élever comme des étoiles filantes. C'est ici que j'ai appris le respect du métal et des traditions ancestrales. Un petit serpent noir, totem protecteur de notre famille, venait souvent lui rendre visite, glissant le long des outils sous les yeux émerveillés des apprentis."
        },
        {
          title: "Chapitre 2 : La vie à la campagne",
          content: "Chaque année, pendant la saison des récoltes, je me rendais dans la plaine de Tindican pour rendre visite à ma grand-mère. Les rizières à perte de vue vibraient sous la chaleur tropicale. Là-bas, mes oncles m'apprenaient à couper le riz mûr, à écouter le chant des oiseaux et à comprendre les cycles de la nature. C'était un monde de liberté et d'entraide communautaire, loin des exigences de l'école coloniale."
        },
        {
          title: "Chapitre 3 : Le départ pour Conakry",
          content: "Après avoir obtenu mon certificat d'études à Kouroussa, le moment était venu de poursuivre ma scolarité au collège technique de Conakry. Les adieux furent déchirants. Ma mère pleurait en versant de l'eau sacrée derrière mes pas pour me souhaiter la bienvenue et me protéger des mauvais esprits. Le train siffla, m'emportant vers un avenir inconnu au bord de l'océan."
        }
      ]
    },
    {
      id: "le-petit-prince",
      title: "Le Petit Prince",
      author: "Antoine de Saint-Exupéry",
      category: "Conte Philosophique",
      description: "L'histoire touchante d'un aviateur égaré dans le désert du Sahara qui fait la rencontre d'un petit garçon venu d'une autre planète.",
      coverGradient: "from-indigo-600 via-blue-700 to-indigo-950",
      pagesCount: 96,
      chapters: [
        {
          title: "Chapitre 1 : Le dessin du boa",
          content: "Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait 'Histoires Vécues'. Ça représentait un serpent boa qui avalait un fauve. J'ai dessiné mon dessin numéro 1. Il représentait un chapeau. Mais pour les grandes personnes, c'était un chapeau. Alors j'ai dessiné l'intérieur du boa pour qu'elles puissent comprendre. Elles ont toujours besoin d'explications."
        },
        {
          title: "Chapitre 2 : La rencontre dans le désert",
          content: "J'ai ainsi vécu seul, sans personne avec qui parler véritablement, jusqu'à une panne dans le désert du Sahara, il y a six ans. Quelque chose s'était cassé dans mon moteur. Et le premier matin je fus bien surpris quand une drôle de petite voix me réveilla. Elle disait : 'S'il vous plaît... dessine-moi un mouton !' J'ai sauté sur mes pieds comme si j'avais été frappé par la foudre."
        },
        {
          title: "Chapitre 3 : La fleur et le renard",
          content: "Le petit prince apprit à connaître une rose coquette sur son astéroïde, mais c'est sur la Terre qu'il rencontra le renard. 'Viens jouer avec moi', lui proposa le petit prince. 'Je ne puis pas jouer avec toi', dit le renard. 'Je ne suis pas apprivoisé. Créer des liens, c'est ce qui rend unique.' C'est alors que le petit prince comprit que sa fleur était unique au monde."
        }
      ]
    },
    {
      id: "sesamath-6eme",
      title: "Manuel de Mathématiques 6ème",
      author: "Collectif Sésamath",
      category: "Manuel Scolaire",
      description: "Manuel officiel de mathématiques libre de droits. Cours complets et exercices d'application directe sur les fractions, la géométrie et le calcul mental.",
      coverGradient: "from-emerald-600 via-teal-600 to-emerald-800",
      pagesCount: 220,
      chapters: [
        {
          title: "Chapitre 1 : Les fractions décimales",
          content: "Une fraction décimale est une fraction dont le dénominateur est 10, 100, 1000... Par exemple, 3/10 s'écrit aussi sous la forme décimale 0,3. Pour ajouter deux fractions de même dénominateur, on ajoute les numérateurs et on garde le dénominateur commun : 3/10 + 4/10 = 7/10. Pratiquez le calcul mental au quotidien pour fluidifier ces opérations fondamentales."
        },
        {
          title: "Chapitre 2 : Les bases de la géométrie plane",
          content: "Une droite est illimitée. Un segment est une portion de droite délimitée par deux points appelés extrémités. Deux droites sont perpendiculaires lorsqu'elles se coupent en formant un angle droit (90 degrés). Deux droites sont parallèles lorsqu'elles n'ont aucun point commun, même si on les prolonge à l'infini."
        },
        {
          title: "Chapitre 3 : Proportionnalité et pourcentages",
          content: "Deux grandeurs sont proportionnelles si l'on peut passer de l'une à l'autre en multipliant par un nombre constant appelé coefficient de proportionnalité. Un pourcentage est un rapport dont le dénominateur est 100. Par exemple, appliquer un taux de 20% sur un montant de 1500 F CFA revient à calculer : 1500 x 20 / 100 = 300 F CFA."
        }
      ]
    },
    {
      id: "leo-et-toinon",
      title: "Léo et Toinon",
      author: "Marie-Thérèse Latzarus",
      category: "Lecture Jeunesse",
      description: "Une charmante histoire d'enfance de deux petits orphelins courageux à travers la campagne française, pleine d'aventures et d'apprentissages.",
      coverGradient: "from-rose-500 via-pink-600 to-rose-700",
      pagesCount: 124,
      pdfUrl: "https://ebooks-bnr.com/?stdb_dl=ebooks%2Fpdf4%2Fleo_toinon.pdf",
      htmlUrl: "https://ebooks-bnr.com/ebooks/html/leo_toinon.html",
      chapters: [
        {
          title: "Chapitre 1 : Les petits orphelins",
          content: "Dans un petit hameau niché au cœur des collines françaises, Léo et sa sœur Toinon vivaient paisiblement chez leur tante. Bien qu'orphelins, les deux enfants débordaient d'énergie et de joie de vivre. Toinon, toujours soucieuse d'aider, apprenait la couture tandis que Léo, passionné de nature, passait ses journées à explorer les forêts environnantes à la recherche de secrets sylvestres."
        },
        {
          title: "Chapitre 2 : La découverte du vieux moulin",
          content: "Un après-midi ensoleillé de printemps, Léo entraîna Toinon vers la colline du Moulin de la Garde. Ce vieux moulin abandonné, dont les ailes ne tournaient plus depuis des décennies, abritait bien des légendes locales. En furetant sous les vieilles poutres de chêne, Toinon aperçut un reflet brillant dissimulé derrière un vieux sac de farine."
        }
      ]
    },
    {
      id: "les-trois-mousquetaires",
      title: "Les Trois Mousquetaires",
      author: "Alexandre Dumas",
      category: "Classique Français",
      description: "L'incroyable épopée du jeune Gascon d'Artagnan qui s'associe à Athos, Porthos et Aramis pour déjouer les complots du cardinal de Richelieu.",
      coverGradient: "from-red-600 via-amber-700 to-red-900",
      pagesCount: 650,
      pdfUrl: "https://ebooks-bnr.com/?stdb_dl=ebooks%2Fpdf4%2Fdumas_les_trois_mousquetaires.pdf",
      htmlUrl: "https://ebooks-bnr.com/ebooks/html/dumas_les_trois_mousquetaires.html",
      chapters: [
        {
          title: "Chapitre 1 : Les trois présents de M. d'Artagnan père",
          content: "Le premier lundi du mois d'avril 1625, le bourg de Meung vit un grand tumulte. Un jeune homme nommé d'Artagnan y faisait son entrée sur un bidet jaune, vêtu d'une jaquette de laine dont la couleur bleue avait fait place à une teinte indéfinissable. Son père lui avait donné trois présents : un cheval, quinze écus et de sages conseils pour servir le Roi."
        },
        {
          title: "Chapitre 2 : L'antichambre de M. de Tréville",
          content: "Arrivé à Paris, d'Artagnan se rendit chez M. de Tréville, le capitaine des mousquetaires du Roi. L'antichambre était remplie de gentilshommes bruyants, fiers de porter la casaque bleue. C'est dans ce tumulte qu'il bouscula par mégarde Athos blessé à l'épaule, s'emmêla dans le baudrier d'or de Porthos, et ramassa un mouchoir compromettant pour Aramis."
        }
      ]
    },
    {
      id: "vingt-mille-lieues",
      title: "Vingt mille lieues sous les mers",
      author: "Jules Verne",
      category: "Aventure & Sci-Fi",
      description: "Le fantastique voyage à bord du sous-marin Nautilus, commandé par le mystérieux Capitaine Nemo, à travers les profondeurs inexplorées des océans.",
      coverGradient: "from-cyan-600 via-teal-700 to-blue-900",
      pagesCount: 450,
      pdfUrl: "https://ebooks-bnr.com/?stdb_dl=ebooks%2Fpdf4%2Fverne_20000_lieues_sous_les_mers.pdf",
      htmlUrl: "https://ebooks-bnr.com/ebooks/html/verne_20000_lieues_sous_les_mers.html",
      chapters: [
        {
          title: "Chapitre 1 : Un écueil fuyant",
          content: "L'année 1866 fut marquée par un événement bizarre, un phénomène inexpliqué et inexplicable. Depuis quelque temps, plusieurs navires s'étaient croisés avec un objet long, fusiforme, parfois phosphorescent, infiniment plus grand et plus rapide qu'une baleine. La rumeur publique s'enflamma, certains y voyant un monstre marin d'une puissance colossale."
        },
        {
          title: "Chapitre 2 : Le capitaine Nemo et le Nautilus",
          content: "Fait prisonnier à bord avec le harponneur Ned Land et son fidèle domestique Conseil, le professeur Aronnax découvrit avec stupéfaction que le monstre était en réalité un chef-d'œuvre de la technologie humaine : un navire sous-marin propulsé à l'électricité, créé et dirigé par l'énigmatique Capitaine Nemo, un homme ayant rompu tout lien avec l'humanité."
        }
      ]
    }
  ];

  // ── Cahiers d'Exercices Interactifs ──
  const workbooks: SubjectWorkbook[] = [
    {
      id: "maths-6e",
      title: "Équations & Calcul Mental",
      subject: "Mathématiques",
      gradeLevel: "Classe de 6ème",
      questionsCount: 5,
      difficulty: "Moyen",
      color: "from-blue-500 to-indigo-600",
      questions: [
        {
          id: 1,
          text: "Trouver la valeur de x dans l'équation : x + 12 = 30",
          options: ["x = 18", "x = 42", "x = 15", "x = 22"],
          correct: 0,
          explanation: "Pour isoler x, on soustrait 12 des deux côtés : x = 30 - 12, donc x = 18."
        },
        {
          id: 2,
          text: "Calculer rapidement : 15% de 4000 F CFA",
          options: ["400 F CFA", "600 F CFA", "800 F CFA", "150 F CFA"],
          correct: 1,
          explanation: "Calculer 15% revient à faire (4000 x 15) / 100 = 40 x 15 = 600 F CFA."
        },
        {
          id: 3,
          text: "Quelle est la formule de l'aire d'un triangle ?",
          options: ["Base x Hauteur", "(Base x Hauteur) / 2", "Côté x Côté", "Longueur x Largeur"],
          correct: 1,
          explanation: "L'aire d'un triangle s'obtient en multipliant la base par la hauteur, puis en divisant le résultat par 2."
        },
        {
          id: 4,
          text: "Résoudre : 3x - 5 = 10",
          options: ["x = 3", "x = 5", "x = 15", "x = 4"],
          correct: 1,
          explanation: "On ajoute 5 : 3x = 15. Puis on divise par 3 : x = 15 / 3 = 5."
        },
        {
          id: 5,
          text: "Combien font 7 x 8 ?",
          options: ["54", "56", "64", "48"],
          correct: 1,
          explanation: "Selon les tables de multiplication standards, 7 multiplié par 8 fait 56."
        }
      ]
    },
    {
      id: "francais-5e",
      title: "Grammaire & Conjugaison",
      subject: "Français",
      gradeLevel: "Classe de 5ème",
      questionsCount: 4,
      difficulty: "Facile",
      color: "from-amber-500 to-orange-600",
      questions: [
        {
          id: 1,
          text: "Quel est le participe passé correct du verbe 'Prendre' ?",
          options: ["Prendu", "Pris", "Prené", "Print"],
          correct: 1,
          explanation: "Le verbe 'prendre' fait son participe passé en 'pris' (ex: 'J'ai pris mes cahiers')."
        },
        {
          id: 2,
          text: "Trouver la phrase contenant un complément d'objet direct (COD) :",
          options: ["Il dort paisiblement.", "L'élève écoute le professeur.", "Elle parle à sa mère.", "Nous partons en vacances."],
          correct: 1,
          explanation: "'Le professeur' répond à la question 'qui' après le verbe : L'élève écoute qui ? -> Le professeur (COD)."
        },
        {
          id: 3,
          text: "Au subjonctif présent, que donne le verbe 'Être' à la première personne du pluriel ?",
          options: ["Que nous soyons", "Que nous soyions", "Que nous sommes", "Que nous étions"],
          correct: 0,
          explanation: "La conjugaison correcte au subjonctif présent est 'que nous soyons' (avec un seul 'y')."
        },
        {
          id: 4,
          text: "Quelle est la nature du mot 'rapidement' ?",
          options: ["Adjectif", "Adverbe", "Nom commun", "Verbe"],
          correct: 1,
          explanation: "Les mots se terminant par '-ment' formés sur un adjectif sont généralement des adverbes de manière."
        }
      ]
    },
    {
      id: "sciences-phy",
      title: "Le Système Solaire & Univers",
      subject: "Sciences",
      gradeLevel: "Classe de 4ème",
      questionsCount: 4,
      difficulty: "Difficile",
      color: "from-emerald-500 to-teal-600",
      questions: [
        {
          id: 1,
          text: "Quelle planète est surnommée la planète rouge ?",
          options: ["Vénus", "Jupiter", "Mars", "Saturne"],
          correct: 2,
          explanation: "Mars est appelée la planète rouge en raison de l'abondance d'oxyde de fer (rouille) à sa surface."
        },
        {
          id: 2,
          text: "Quelle est la vitesse approximative de la lumière ?",
          options: ["150 000 km/s", "300 000 km/s", "1 000 000 km/s", "30 000 km/h"],
          correct: 1,
          explanation: "La vitesse de la lumière dans le vide est d'environ 300 000 kilomètres par seconde."
        },
        {
          id: 3,
          text: "Quel gaz compose majoritairement l'atmosphère terrestre ?",
          options: ["Oxygène (O2)", "Dioxyde de carbone (CO2)", "Azote (N2)", "Hydrogène (H2)"],
          correct: 2,
          explanation: "L'azote (diazote) constitue environ 78% de notre atmosphère, contre 21% pour l'oxygène."
        },
        {
          id: 4,
          text: "Quelle force maintient les planètes en orbite autour du Soleil ?",
          options: ["La force magnétique", "La force gravitationnelle", "La force centrifuge", "La friction atmosphérique"],
          correct: 1,
          explanation: "C'est la force de gravitation (découverte par Isaac Newton) qui régit l'attraction mutuelle des corps célestes."
        }
      ]
    }
  ];

  // Alternatives pour approfondir
  const externalResources = [
    {
      name: "Sésamath France",
      desc: "Portail officiel de ressources libres de droit. Manuels scolaires complets téléchargeables en PDF.",
      url: "https://www.sesamath.net/"
    },
    {
      name: "Khan Academy",
      desc: "Parcours de vidéos et de quiz interactifs sur les sciences, le codage et les mathématiques.",
      url: "https://fr.khanacademy.org/"
    },
    {
      name: "Bibliothèque Romande (BNR)",
      desc: "Des milliers de grands classiques de la littérature française en téléchargement gratuit.",
      url: "https://ebooks-bnr.com/"
    }
  ];

  // Gestionnaires pour le lecteur
  const handleOpenBook = (book: BookItem) => {
    setSelectedBook(book);
    setCurrentChapterIdx(0);
  };

  const handleCloseBook = () => {
    setSelectedBook(null);
  };

  // Gestionnaires pour les exercices
  const handleStartWorkbook = (wb: SubjectWorkbook) => {
    setActiveWorkbook(wb);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setScore(0);
    setIsFinished(false);
  };

  const handleAnswerSelect = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null || !activeWorkbook) return;
    setIsAnswerChecked(true);
    if (selectedOption === activeWorkbook.questions[currentQuestionIdx].correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!activeWorkbook) return;
    setSelectedOption(null);
    setIsAnswerChecked(false);
    
    if (currentQuestionIdx < activeWorkbook.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-800 dark:text-slate-100 font-sans selection:bg-amber-500/20 flex flex-col">
      
      {/* Barre de navigation supérieure (pleine largeur, bords droits) */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/${lang}`)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-none transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour au Tableau de bord
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Espace révisions</span>
          </div>
        </div>
      </div>

      {/* En-tête (Pleine largeur, bande contrastée couleur jaune ambre) */}
      <div className="w-full bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 py-12 px-4 shrink-0">
        <div className="max-w-6xl mx-auto text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-amber-500 rounded-none flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/10 mb-6 border border-amber-600">
            <BookOpen className="w-8 h-8" />
          </div>

          <h1 className="text-3.5xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight uppercase">
            Cours & <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-amber-600">Exercices</span>
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-3">
            DGhubSchool — Espace Révisions & Devoirs
          </p>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-6 max-w-2xl leading-relaxed">
            Des manuels scolaires officiels et des cahiers d'exercices interactifs intégrés pour s'entraîner à la maison.
          </p>
        </div>
      </div>

      {/* Zone de Contenu Principal */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 flex-1 w-full">

        {/* ── Menu Onglets Modernes (Charte Ambrée) ── */}
        <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <button
            onClick={() => { setActiveTab('library'); setActiveWorkbook(null); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === 'library' && !activeWorkbook
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/15'
                : 'border-transparent text-slate-500 hover:text-amber-500 hover:bg-amber-500/5'
            }`}
          >
            <Book className="w-4 h-4" />
            <span>Bibliothèque Ebooks</span>
          </button>
          <button
            onClick={() => { setActiveTab('exercises'); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === 'exercises' || activeWorkbook
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/15'
                : 'border-transparent text-slate-500 hover:text-amber-500 hover:bg-amber-500/5'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Cahiers d'Exercices</span>
          </button>
          <button
            onClick={() => { setActiveTab('resources'); setActiveWorkbook(null); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
              activeTab === 'resources' && !activeWorkbook
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/15'
                : 'border-transparent text-slate-500 hover:text-amber-500 hover:bg-amber-500/5'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Ressources Externes</span>
          </button>
        </div>

        {/* ── CONTENU : Onglet 1 — Bibliothèque ── */}
        {activeTab === 'library' && !activeWorkbook && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">📚 Bibliothèque de révision intégrée</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Livres scolaires et classiques à lire directement sur l'écran ou en ligne</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {books.map((book) => (
                <div key={book.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
                  <div className={`h-48 bg-gradient-to-br ${book.coverGradient} p-6 flex flex-col justify-between relative`}>
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-lg w-fit">
                      {book.category}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-white text-wrap leading-tight">{book.title}</h4>
                      <p className="text-xs text-white/80 font-medium">{book.author}</p>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {book.description}
                    </p>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
                        <span>{book.pagesCount} pages</span>
                        <span className="truncate max-w-[120px]">{book.category}</span>
                      </div>
                      
                      <div className="flex flex-col gap-2 w-full">
                        <button
                          onClick={() => handleOpenBook(book)}
                          className="w-full py-2.5 bg-slate-950 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lire Intégré</span>
                        </button>
                        
                        <div className="flex gap-2 w-full">
                          {book.pdfUrl && (
                            <a
                              href={book.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 border border-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer text-center"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Télécharger PDF</span>
                            </a>
                          )}
                          {book.htmlUrl && (
                            <a
                              href={book.htmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-850 dark:bg-slate-805 dark:hover:bg-slate-700 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer text-center border border-slate-200 dark:border-slate-700"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Lire en ligne</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTENU : Onglet 2 — Cahiers d'Exercices ── */}
        {activeTab === 'exercises' && !activeWorkbook && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">✏️ Cahiers d'exercices thématiques</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Choisissez une matière et commencez votre cahier de révision interactif</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {workbooks.map((wb) => (
                <div key={wb.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-lg uppercase tracking-wider">
                        {wb.subject}
                      </span>
                      <span className={`px-2.5 py-0.5 border text-[9px] font-black rounded-lg uppercase tracking-widest ${
                        wb.difficulty === 'Facile' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        wb.difficulty === 'Moyen' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {wb.difficulty}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-slate-950 dark:text-white leading-tight">{wb.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 font-bold uppercase">{wb.gradeLevel}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{wb.questionsCount} questions</span>
                    <button
                      onClick={() => handleStartWorkbook(wb)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-1 cursor-pointer border border-amber-600 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Lancer le cahier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTENU : Onglet 2 bis — Résolution d'un Cahier d'Exercice Interactif ── */}
        {activeWorkbook && (
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-md">
            {!isFinished ? (
              <div className="space-y-6">
                {/* Entête de l'exercice */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveWorkbook(null)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{activeWorkbook.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{activeWorkbook.subject} • {activeWorkbook.gradeLevel}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black rounded-lg uppercase tracking-wider">
                    Question {currentQuestionIdx + 1} / {activeWorkbook.questions.length}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${((currentQuestionIdx) / activeWorkbook.questions.length) * 100}%` }}
                  ></div>
                </div>

                {/* Question */}
                <div className="space-y-4 py-2">
                  <h4 className="text-lg font-black text-slate-950 dark:text-white leading-snug">
                    {activeWorkbook.questions[currentQuestionIdx].text}
                  </h4>

                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {activeWorkbook.questions[currentQuestionIdx].options.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === activeWorkbook.questions[currentQuestionIdx].correct;
                      let optionStyle = "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-300";

                      if (isSelected) {
                        optionStyle = "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400";
                      }
                      if (isAnswerChecked) {
                        if (isCorrect) {
                          optionStyle = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400";
                        } else if (isSelected) {
                          optionStyle = "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400";
                        } else {
                          optionStyle = "border-slate-200 opacity-50 dark:border-slate-800";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswerChecked}
                          onClick={() => handleAnswerSelect(idx)}
                          className={`flex items-center justify-between p-4 border rounded-2xl text-left text-xs font-bold transition-all cursor-pointer ${optionStyle}`}
                        >
                          <span>{option}</span>
                          {isAnswerChecked && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                          {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Explication & Bouton de validation */}
                {isAnswerChecked && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 animate-scaleUp">
                    <h5 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Explication de la réponse
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {activeWorkbook.questions[currentQuestionIdx].explanation}
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
                  {!isAnswerChecked ? (
                    <button
                      disabled={selectedOption === null}
                      onClick={handleCheckAnswer}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer border border-amber-600"
                    >
                      Vérifier ma réponse
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{currentQuestionIdx < activeWorkbook.questions.length - 1 ? 'Question suivante' : 'Terminer le cahier'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-6 animate-scaleUp">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto border border-amber-300 shadow-lg shadow-amber-500/20">
                  <Trophy className="w-10 h-10 text-white" />
                </div>

                <div>
                  <h4 className="text-2xl font-black text-slate-955 dark:text-white uppercase tracking-tight">Cahier Terminé !</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Série résolue avec succès</p>
                </div>

                <div className="max-w-xs mx-auto bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white block">{score} / {activeWorkbook.questions.length}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Score obtenu</span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block">+{score * 10} XP</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Points acquis</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 max-w-sm mx-auto">
                  <button
                    onClick={() => handleStartWorkbook(activeWorkbook)}
                    className="flex-1 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    Recommencer
                  </button>
                  <button
                    onClick={() => setActiveWorkbook(null)}
                    className="flex-1 px-5 py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
                  >
                    Retour aux exercices
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CONTENU : Onglet 3 — Ressources Externes ── */}
        {activeTab === 'resources' && !activeWorkbook && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">🌐 Autres plateformes gratuites recommandées</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Des sites externes d'excellence pour compléter la formation de vos enfants</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {externalResources.map((res, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{res.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {res.desc}
                    </p>
                  </div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest"
                  >
                    <span>Visiter le portail</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="w-full bg-white dark:bg-slate-900 py-12 px-4 border-t border-slate-200 dark:border-slate-800 shrink-0 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
          <p>© {new Date().getFullYear()} DGhubSchool. Tous droits réservés.</p>
          <p className="flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Plateforme scolaire sécurisée pour la réussite de vos enfants.
          </p>
        </div>
      </div>

      {/* ── MODAL : LECTEUR DE LIVRE INTÉGRÉ (PREMIUM READER VIEW) ── */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm p-4 flex justify-center items-center">
          <div className="w-full max-w-4xl h-[90vh] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
            
            {/* Header du lecteur */}
            <div className="p-4 md:px-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-10 bg-gradient-to-br ${selectedBook.coverGradient} rounded-md flex items-center justify-center text-white font-black text-[9px] shadow-sm`}>
                  {selectedBook.title[0]}
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white leading-tight">{selectedBook.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedBook.author}</p>
                </div>
              </div>

              {/* Contrôleurs de lecture */}
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 p-1 rounded-lg">
                  <button 
                    onClick={() => setFontSize('sm')} 
                    className={`px-2 py-1 text-[10px] font-black rounded cursor-pointer ${fontSize === 'sm' ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400'}`}
                  >
                    A-
                  </button>
                  <button 
                    onClick={() => setFontSize('base')} 
                    className={`px-2 py-1 text-[10px] font-black rounded cursor-pointer ${fontSize === 'base' ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400'}`}
                  >
                    A
                  </button>
                  <button 
                    onClick={() => setFontSize('lg')} 
                    className={`px-2 py-1 text-[10px] font-black rounded cursor-pointer ${fontSize === 'lg' ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400'}`}
                  >
                    A+
                  </button>
                </div>

                {selectedBook.pdfUrl && (
                  <a
                    href={selectedBook.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-lg cursor-pointer text-center border border-amber-600 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Télécharger PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </a>
                )}

                {selectedBook.htmlUrl && (
                  <a
                    href={selectedBook.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest rounded-lg cursor-pointer text-center"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Lire en ligne</span>
                    <span className="sm:hidden">HTML</span>
                  </a>
                )}

                <button
                  onClick={handleCloseBook}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Split view : Table des matières & Corps du texte */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Sidebar : Table des matières (Desktop) */}
              <div className="hidden md:block w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Table des chapitres</h5>
                <div className="space-y-2">
                  {selectedBook.chapters.map((ch, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentChapterIdx(idx)}
                      className={`w-full text-left p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        currentChapterIdx === idx
                          ? 'bg-amber-500 text-slate-955 font-black'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <span className="truncate">{ch.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone de lecture de texte */}
              <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-955">
                <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
                  <div className="max-w-2xl mx-auto space-y-6">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white border-b border-slate-105 dark:border-slate-900 pb-4">
                      {selectedBook.chapters[currentChapterIdx].title}
                    </h3>
                    <p className={`text-slate-700 dark:text-slate-300 leading-relaxed text-justify font-medium ${
                      fontSize === 'sm' ? 'text-xs md:text-sm' :
                      fontSize === 'base' ? 'text-sm md:text-base' :
                      'text-base md:text-lg'
                    }`}>
                      {selectedBook.chapters[currentChapterIdx].content}
                    </p>
                  </div>
                </div>

                {/* Footer du lecteur : Pagination bascule */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                  <button
                    disabled={currentChapterIdx === 0}
                    onClick={() => setCurrentChapterIdx(prev => prev - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Précédent</span>
                  </button>

                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Chapitre {currentChapterIdx + 1} sur {selectedBook.chapters.length}
                  </span>

                  <button
                    disabled={currentChapterIdx === selectedBook.chapters.length - 1}
                    onClick={() => setCurrentChapterIdx(prev => prev + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    <span>Suivant</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
