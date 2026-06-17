import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserX } from 'lucide-react';
import gsap from 'gsap';

export const ForgotPasswordParent: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  const cardRef = useRef<HTMLDivElement>(null);

  // GSAP entrance animation
  useEffect(() => {
    if (cardRef.current) {
      gsap.from(cardRef.current, {
        y: 60,
        opacity: 0,
        duration: 0.9,
        ease: 'power4.out',
      });
      gsap.from(cardRef.current.querySelectorAll('.fpp-item'), {
        y: 20,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.35,
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 font-['Poppins'] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] bg-rose-500/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[55%] h-[55%] bg-amber-500/6 rounded-full blur-[120px] pointer-events-none" />

      <div ref={cardRef} className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-[32px] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)] text-center relative z-10">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6 fpp-item shadow-lg shadow-rose-500/10">
          <UserX className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-black text-white tracking-tight mb-4 fpp-item">Mot de passe oublié ?</h1>
        
        <p className="text-sm text-slate-400 leading-relaxed mb-8 fpp-item">
          Pour des raisons de sécurité, nous ne permettons pas la réinitialisation directe du mot de passe pour les comptes parents. 
          <br /><br />
          <span className="font-bold text-slate-200">
            Veuillez demander au directeur de votre établissement de supprimer votre compte actuel afin que vous puissiez en créer un nouveau avec un nouveau mot de passe.
          </span>
        </p>

        <button 
          onClick={() => navigate(`/${lang}/login`)}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_8px_24px_rgba(245,158,11,0.3)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] fpp-item"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </button>
      </div>
    </div>
  );
};
