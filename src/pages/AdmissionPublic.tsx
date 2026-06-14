import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, School, User, Phone, Calendar, Send, Compass } from 'lucide-react';
import { API_BASE_URL } from '../config';

export const AdmissionPublic: React.FC = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<{slug: string, name: string, logo_url: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form states
  const [selectedSchool, setSelectedSchool] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState('M');
  const [dateNaissance, setDateNaissance] = useState('');
  const [classe, setClasse] = useState('');
  const [telephoneParent, setTelephoneParent] = useState('');
  const [ecoleProvenance, setEcoleProvenance] = useState('');

  useEffect(() => {
    // Fetch active schools
    fetch(`${API_BASE_URL}/schools`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSchools(data);
      })
      .catch(err => console.error("Error fetching schools:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedSchool) {
      setError("Veuillez sélectionner un établissement.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/admissions/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_slug: selectedSchool,
          nom,
          prenom,
          sexe,
          date_naissance: dateNaissance,
          classe,
          telephone_parent: telephoneParent,
          ecole_provenance: ecoleProvenance
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80 text-slate-800 flex items-center justify-center font-['Poppins'] p-4 md:p-8 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-200/50 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <button 
            onClick={() => navigate('/login')} 
            className="flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour</span>
          </button>
          <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 font-extrabold uppercase text-[10px] tracking-widest px-3 py-1 rounded-full border border-amber-500/20">
            Demande d'Admission
          </div>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-4 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Demande envoyée !</h1>
            <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
              Votre dossier a été soumis avec succès à l'établissement. L'administration va l'étudier et vous contactera prochainement.
            </p>
            <button 
              onClick={() => navigate('/login')} 
              className="mt-6 px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-slate-800 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Portail d'Admission</h1>
              <p className="text-slate-500 text-xs md:text-sm mt-1">Soumettez votre dossier en ligne pour étude de candidature.</p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl text-xs md:text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Étape 1 : Choisir l'école */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Établissement ciblé *</label>
                <div className="relative">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-amber-500 rounded-2xl text-xs md:text-sm font-bold text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                    value={selectedSchool} 
                    onChange={(e) => setSelectedSchool(e.target.value)} 
                    required
                  >
                    <option value="" disabled>-- Sélectionnez l'école --</option>
                    {schools.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Étape 2 : Nom & Prénom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nom de l'élève *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Ex: SOW" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-amber-500 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                      value={nom} 
                      onChange={(e) => setNom(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Prénom de l'élève *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Ex: Ibrahima" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-amber-500 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                      value={prenom} 
                      onChange={(e) => setPrenom(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Étape 3 : Genre & Date Naissance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Sexe *</label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                      <input 
                        type="radio" 
                        name="sexe" 
                        value="M" 
                        checked={sexe === 'M'} 
                        onChange={() => setSexe('M')} 
                        className="accent-amber-500" 
                      />
                      <span className="text-xs font-bold text-slate-700">Masculin</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50 transition-colors">
                      <input 
                        type="radio" 
                        name="sexe" 
                        value="F" 
                        checked={sexe === 'F'} 
                        onChange={() => setSexe('F')} 
                        className="accent-amber-500" 
                      />
                      <span className="text-xs font-bold text-slate-700">Féminin</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Date de naissance</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="JJ/MM/AAAA" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-amber-500 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                      value={dateNaissance} 
                      onChange={(e) => setDateNaissance(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Étape 4 : Classe demandée & Téléphone parent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Classe demandée *</label>
                  <div className="relative">
                    <Compass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Ex: 6ème, CP1, Terminale S" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-amber-500 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                      value={classe} 
                      onChange={(e) => setClasse(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Téléphone parent *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="tel" 
                      placeholder="Ex: +228 90 00 00 00" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-amber-500 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                      value={telephoneParent} 
                      onChange={(e) => setTelephoneParent(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Étape 5 : École de provenance */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Dernier établissement fréquenté</label>
                <input 
                  type="text" 
                  placeholder="Ex: Complexe Scolaire Le Flamboyant" 
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-amber-500 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                  value={ecoleProvenance} 
                  onChange={(e) => setEcoleProvenance(e.target.value)} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-4 bg-amber-500 text-slate-900 font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/10 hover:bg-amber-400 active:scale-[0.98] transition flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? "Envoi en cours..." : "Soumettre ma demande d'admission"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
