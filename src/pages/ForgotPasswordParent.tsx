import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserX } from 'lucide-react';

export const ForgotPasswordParent: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-['Poppins']">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserX className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Mot de passe oublié ?</h1>
        
        <p className="text-sm text-slate-600 leading-relaxed mb-8">
          Pour des raisons de sécurité, nous ne permettons pas la réinitialisation directe du mot de passe pour les comptes parents. 
          <br /><br />
          <span className="font-bold text-slate-800">
            Veuillez demander au directeur de votre établissement de supprimer votre compte actuel afin que vous puissiez en créer un nouveau avec un nouveau mot de passe.
          </span>
        </p>

        <button 
          onClick={() => navigate(`/${lang}/login`)}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 transition flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </button>
      </div>
    </div>
  );
};
