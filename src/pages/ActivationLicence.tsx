import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const ActivationLicence: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  
  const [licenseKey, setLicenseKey] = useState(searchParams.get('key') || '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Si la clé est déjà dans l'URL, on lance l'activation automatiquement
    if (searchParams.get('key')) {
      handleActivate(searchParams.get('key')!);
    }
  }, [searchParams]);

  const handleActivate = async (keyToUse: string) => {
    if (!keyToUse) return;
    setStatus('loading');
    
    try {
      // Simulate API Call for now or actually hit your backend when ready
      // const response = await fetch(`${API_BASE_URL}/licenses/activate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ key: keyToUse })
      // });
      // const data = await response.json();
      
      // Simulation pour le moment (2 secondes de chargement)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus('success');
      setMessage(lang === 'fr' 
        ? 'Votre licence a été activée avec succès ! Vous bénéficiez de 320 jours supplémentaires.' 
        : 'Your license has been successfully activated! You get 320 additional days.');
      
      // Redirection après 3 secondes vers le login ou dashboard
      setTimeout(() => {
        navigate(`/${lang}/login`);
      }, 3000);
      
    } catch (err) {
      setStatus('error');
      setMessage(lang === 'fr' ? 'La clé de licence est invalide ou déjà utilisée.' : 'License key is invalid or already used.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Poppins']">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-2">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Activation en cours...</h2>
            <p className="text-sm text-slate-500">Veuillez patienter pendant que nous validons votre licence Chariow.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Licence Activée</h2>
            <p className="text-sm text-emerald-600 font-medium bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
              {message}
            </p>
            <p className="text-xs text-slate-400 mt-4">Redirection automatique...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-2">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Échec de l'activation</h2>
            <p className="text-sm text-rose-600 font-medium">{message}</p>
            <button 
              onClick={() => setStatus('idle')}
              className="mt-4 text-sm font-bold text-slate-500 hover:text-slate-700 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {status === 'idle' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Activer votre licence</h1>
              <p className="text-sm text-slate-500 mt-2">Saisissez la clé UUID de 320 jours générée par Chariow pour activer votre compte.</p>
            </div>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000" 
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-center"
              />
              <button 
                onClick={() => handleActivate(licenseKey)}
                disabled={!licenseKey.trim()}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black uppercase tracking-wider text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Valider la licence <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
