import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, KeyRound, AlertCircle, ArrowRight, LogIn } from 'lucide-react';
import { parentApi } from '../services/parentApi';

interface ActivationTranslations {
  loadingTitle: string;
  loadingDesc: string;
  successTitle: string;
  partialTitle: string;
  successRedirect: string;
  errorTitle: string;
  retry: string;
  idleTitle: string;
  idleDesc: string;
  inputPlaceholder: string;
  btnSubmit: string;
  successMsg: string;
  errorMsg: string;
  stillProcessingMsg: string;
  needLoginTitle: string;
  needLoginDesc: string;
  goToLogin: string;
  goToDashboard: string;
}

interface PaymentPayload {
  amount: number;
  trancheNumber: number;
  tranchesPaid: number;
  totalPaid: number;
  totalRequired: number;
  amountRemaining: number;
  isFullyPaid: boolean;
}

const translations: Record<'fr' | 'en', ActivationTranslations> = {
  fr: {
    loadingTitle: "Vérification du paiement...",
    loadingDesc: "Nous confirmons votre paiement et débloquons votre compte.",
    successTitle: "Licence Activée",
    partialTitle: "Tranche validée",
    successRedirect: "Redirection vers votre tableau de bord...",
    errorTitle: "Paiement introuvable",
    retry: "Réessayer",
    idleTitle: "Code promotionnel",
    idleDesc: "Si vous disposez d'un code promotionnel fourni par l'école ou le support, saisissez-le ici.",
    inputPlaceholder: "Ex: DGHUB-PROMO-XXXX",
    btnSubmit: "Valider le code",
    successMsg: "Votre licence a été activée avec succès !",
    errorMsg: "Ce code est invalide ou a déjà été utilisé.",
    stillProcessingMsg: "Le paiement est en cours de confirmation, ça peut prendre quelques instants...",
    needLoginTitle: "Connexion requise",
    needLoginDesc: "Connectez-vous à votre compte parent pour finaliser l'activation.",
    goToLogin: "Se connecter",
    goToDashboard: "Aller au tableau de bord"
  },
  en: {
    loadingTitle: "Verifying payment...",
    loadingDesc: "We are confirming your payment and unlocking your account.",
    successTitle: "License Activated",
    partialTitle: "Instalment recorded",
    successRedirect: "Redirecting to your dashboard...",
    errorTitle: "Payment not found",
    retry: "Try again",
    idleTitle: "Promo code",
    idleDesc: "If you have a promotional code provided by the school or support, enter it here.",
    inputPlaceholder: "e.g., DGHUB-PROMO-XXXX",
    btnSubmit: "Validate code",
    successMsg: "Your license was activated successfully!",
    errorMsg: "This code is invalid or has already been used.",
    stillProcessingMsg: "Payment confirmation is in progress, this can take a few moments...",
    needLoginTitle: "Sign-in required",
    needLoginDesc: "Sign in to your parent account to finalize the activation.",
    goToLogin: "Sign in",
    goToDashboard: "Go to dashboard"
  }
};

const POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 2500;

export const ActivationLicence: React.FC = () => {
  const navigate = useNavigate();
  const { lang = 'fr' } = useParams<{ lang?: string }>();
  const activeLang = (lang === 'fr' || lang === 'en') ? lang : 'fr';
  const t = translations[activeLang];

  const [promoCode, setPromoCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'still_processing' | 'success' | 'error' | 'need_login'>('idle');
  const [message, setMessage] = useState('');
  const [payment, setPayment] = useState<PaymentPayload | null>(null);
  const cancelledRef = useRef(false);

  const dashboardPath = `/${activeLang}/portail-parent/dashboard`;

  useEffect(() => {
    cancelledRef.current = false;
    const sessionId = localStorage.getItem('pending_license_checkout_session_id');
    if (sessionId) {
      pollSession(sessionId);
    }
    return () => { cancelledRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollSession = async (sessionId: string) => {
    const token = localStorage.getItem('parent_token');
    if (!token) {
      setStatus('need_login');
      return;
    }

    setStatus('loading');
    setMessage('');

    for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
      if (cancelledRef.current) return;
      try {
        const data = await parentApi.checkLicenseCheckoutSessionStatus(sessionId);
        if (data.sessionStatus === 'PAID' || data.sessionStatus === 'paid') {
          localStorage.removeItem('pending_license_checkout_session_id');
          setPayment(data.payment);
          setStatus('success');
          setMessage(data.payment.isFullyPaid ? t.successMsg : t.successMsg);
          if (data.payment.isFullyPaid) {
            setTimeout(() => { if (!cancelledRef.current) navigate(dashboardPath); }, 3500);
          }
          return;
        }
        if (data.sessionStatus === 'expired' || data.sessionStatus === 'failed') {
          localStorage.removeItem('pending_license_checkout_session_id');
          setStatus('error');
          setMessage(t.errorMsg);
          return;
        }
      } catch (err: any) {
        // Session introuvable ou erreur réseau ponctuelle — on continue les tentatives,
        // la dernière itération basculera sur l'état "still_processing".
      }
      setStatus('still_processing');
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    // Après plusieurs tentatives sans confirmation : le webhook prendra probablement
    // le relais en arrière-plan, mais on laisse le parent avec un état clair plutôt
    // que de le bloquer indéfiniment sur un spinner.
    if (!cancelledRef.current) {
      setStatus('still_processing');
      setMessage(t.stillProcessingMsg);
    }
  };

  const handlePromoCode = async () => {
    if (!promoCode.trim()) return;
    const token = localStorage.getItem('parent_token');
    if (!token) {
      setStatus('need_login');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const data = await parentApi.activateLicenseAuto(promoCode.trim());
      setPayment(data.payment || null);
      setStatus('success');
      setMessage(data.message || t.successMsg);
      if (data.payment?.isFullyPaid !== false) {
        setTimeout(() => { if (!cancelledRef.current) navigate(dashboardPath); }, 3500);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.error || t.errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Poppins']">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">

        {(status === 'loading' || status === 'still_processing') && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-2">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-slate-900">{t.loadingTitle}</h2>
            <p className="text-sm text-slate-500">{status === 'still_processing' ? t.stillProcessingMsg : t.loadingDesc}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in duration-500">
            <div className={`w-16 h-16 ${payment && !payment.isFullyPaid ? 'bg-amber-50' : 'bg-emerald-50'} rounded-full flex items-center justify-center mb-2`}>
              <CheckCircle2 className={`w-8 h-8 ${payment && !payment.isFullyPaid ? 'text-amber-500' : 'text-emerald-500'}`} />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              {payment && !payment.isFullyPaid ? t.partialTitle : t.successTitle}
            </h2>
            <p className={`text-sm font-medium px-4 py-2 rounded-lg border ${payment && !payment.isFullyPaid ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
              {message}
            </p>

            {payment && (
              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-2 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {activeLang === 'fr' ? 'Progression du paiement' : 'Payment progress'}
                  </span>
                  <span className="text-[11px] font-black text-slate-700">
                    {payment.totalPaid.toLocaleString()} / {payment.totalRequired.toLocaleString()} F CFA
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${payment.isFullyPaid ? 'bg-emerald-500' : 'bg-amber-500'} transition-all`}
                    style={{ width: `${Math.min(100, (payment.totalPaid / payment.totalRequired) * 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  {[1, 2, 3].map(n => (
                    <div
                      key={n}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase ${n <= payment.tranchesPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-400 border border-slate-200'}`}
                    >
                      {activeLang === 'fr' ? `Tranche ${n}` : `Instalment ${n}`}
                      <div className="text-[9px] mt-0.5 font-bold">
                        {n <= payment.tranchesPaid ? '700 F ✓' : '700 F'}
                      </div>
                    </div>
                  ))}
                </div>
                {!payment.isFullyPaid && (
                  <p className="text-[11px] text-slate-500 text-center font-medium pt-1">
                    {activeLang === 'fr'
                      ? `Il vous reste ${payment.amountRemaining.toLocaleString()} F CFA à régler pour débloquer entièrement la licence.`
                      : `You still owe ${payment.amountRemaining.toLocaleString()} F CFA to fully unlock the license.`}
                  </p>
                )}
              </div>
            )}

            {payment?.isFullyPaid && (
              <p className="text-xs text-slate-400 mt-2">{t.successRedirect}</p>
            )}
            <button
              onClick={() => navigate(dashboardPath)}
              className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black uppercase tracking-widest text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              {t.goToDashboard} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-2">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900">{t.errorTitle}</h2>
            <p className="text-sm text-rose-600 font-medium">{message}</p>
            <button
              onClick={() => navigate(dashboardPath)}
              className="mt-4 text-sm font-bold text-slate-500 hover:text-slate-700 underline"
            >
              {t.goToDashboard}
            </button>
          </div>
        )}

        {status === 'need_login' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-2">
              <LogIn className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900">{t.needLoginTitle}</h2>
            <p className="text-sm text-slate-500">{t.needLoginDesc}</p>
            <button
              onClick={() => navigate(`/${activeLang}/portail-ecole?next=${encodeURIComponent(`/${activeLang}/activation-licence`)}`)}
              className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black uppercase tracking-wider text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              {t.goToLogin} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'idle' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.idleTitle}</h1>
              <p className="text-sm text-slate-500 mt-2">{t.idleDesc}</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder={t.inputPlaceholder}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-center"
              />
              <button
                onClick={handlePromoCode}
                disabled={!promoCode.trim()}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black uppercase tracking-wider text-sm rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {t.btnSubmit} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
