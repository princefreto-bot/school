// ============================================================
// PAGE COURS & EXERCICES PARENTS/ÉLÈVES — Modern & Interactive
// ============================================================
import React, { useState } from 'react';
import { BookOpen, Award, CheckCircle, XCircle, ExternalLink, Play, FileText, ChevronRight } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const ParentCourses: React.FC = () => {
  // Exercice de révision interactif local (Démonstration H5P / Quiz local)
  const mathQuiz: QuizQuestion[] = [
    {
      id: 1,
      question: "Calculer : 7 x 8 = ?",
      options: ["48", "56", "64", "54"],
      correctAnswer: 1
    },
    {
      id: 2,
      question: "Quelle est la capitale du Togo ?",
      options: ["Kpalimé", "Kara", "Lomé", "Atakpamé"],
      correctAnswer: 2
    },
    {
      id: 3,
      question: "Trouver la valeur de x : 2x + 5 = 15",
      options: ["x = 5", "x = 10", "x = 7.5", "x = 2"],
      correctAnswer: 0
    }
  ];

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Alternatives gratuites recommandées
  const alternatives = [
    {
      name: "Sésamath (Maths)",
      category: "Mathématiques",
      desc: "Manuels et cahiers d'exercices libres de droits, très populaires dans l'espace francophone. Idéal pour télécharger des fiches d'exercices complètes du CM1 au Lycée.",
      url: "https://www.sesamath.net/",
      type: "Fiches & Manuels"
    },
    {
      name: "Khan Academy (Maths & Sciences)",
      category: "Multi-disciplinaire",
      desc: "Vidéos de leçons courtes et parcours d'exercices interactifs gratuits avec suivi. Entièrement disponible en français.",
      url: "https://fr.khanacademy.org/",
      type: "Vidéos & Exercices"
    },
    {
      name: "Bibliothèque Numérique Romande",
      category: "Littérature & Français",
      desc: "Livres classiques libres de droits au format PDF/EPUB. Parfait pour proposer des lectures gratuites aux élèves (romans, poésies, contes).",
      url: "https://ebooks-bnr.com/",
      type: "Livres Gratuits"
    },
    {
      name: "Module H5P (Quizz & Contenu)",
      category: "Intégration Locale",
      desc: "Outil open-source permettant de concevoir des vidéos interactives, des textes à trous et des jeux de mémoire. Intégrable directement dans DGhubSchool.",
      url: "https://h5p.org/",
      type: "Quiz Interactifs"
    }
  ];

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerChecked(true);
    if (selectedOption === mathQuiz[currentQuestionIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswerChecked(false);
    if (currentQuestionIdx < mathQuiz.length - 1) {
      setCurrentQuestionIdx(idx => idx + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-24">
      {/* En-tête Principal */}
      <div className="rounded-[24px] p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white relative overflow-hidden shadow-[0_8px_30px_rgba(49,46,129,0.2)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[20px] flex items-center justify-center shadow-inner">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Espace Révisions & Exercices</h2>
              <p className="text-indigo-200 text-sm mt-1 font-medium max-w-md">
                Cours interactifs et ressources scolaires gratuites pour s'entraîner à la maison.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Exercice Interactif Local (H5P / Quiz local) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                ✏️ Exercice de Révision Interactif
              </h3>
              <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                Maths & Culture
              </span>
            </div>

            {!quizFinished ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Question {currentQuestionIdx + 1} sur {mathQuiz.length}</span>
                  <span>Score : {score}/{mathQuiz.length}</span>
                </div>

                <h4 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {mathQuiz[currentQuestionIdx].question}
                </h4>

                <div className="grid grid-cols-1 gap-3">
                  {mathQuiz[currentQuestionIdx].options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === mathQuiz[currentQuestionIdx].correctAnswer;
                    let optionStyle = "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50";
                    
                    if (isSelected) {
                      optionStyle = "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400";
                    }
                    if (isAnswerChecked) {
                      if (isCorrect) {
                        optionStyle = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400";
                      } else if (isSelected) {
                        optionStyle = "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswerChecked}
                        onClick={() => setSelectedOption(idx)}
                        className={`flex items-center justify-between p-4 border rounded-2xl text-left text-xs font-bold transition-all ${optionStyle}`}
                      >
                        <span>{option}</span>
                        {isAnswerChecked && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                        {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-6">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900">
                  <Award className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">Félicitations !</h4>
                  <p className="text-xs text-slate-500 mt-1">Vous avez terminé l'exercice avec un score de {score} sur {mathQuiz.length}.</p>
                </div>
                <button
                  onClick={handleRestartQuiz}
                  className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
                >
                  Recommencer l'exercice
                </button>
              </div>
            )}
          </div>

          {!quizFinished && (
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 flex justify-end gap-3">
              {!isAnswerChecked ? (
                <button
                  disabled={selectedOption === null}
                  onClick={handleCheckAnswer}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
                >
                  Vérifier ma réponse
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Question Suivante</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Alternatives Gratuites Recommandées */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              📚 Alternatives Gratuites
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Ressources éducatives en libre accès
            </p>
          </div>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {alternatives.map((alt, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-slate-950 dark:text-white">{alt.name}</h4>
                    <span className="text-[9px] font-bold text-slate-400">{alt.category}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-[9px] font-black rounded-lg uppercase tracking-wider">
                    {alt.type}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {alt.desc}
                </p>
                <a
                  href={alt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-wider"
                >
                  <span>Accéder à la ressource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
