// ============================================================
// FICHE DÉTAILLÉE D'UN ÉLÈVE — Modale complète
// ============================================================
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Student, ExpenseLabel, StudentExpense } from '../types';
import { RecuPrintButton } from './pdf/RecuPrintButton';
import { expensesApi } from '../services/expensesApi';
import {
  X, Download, MessageCircle, Clock, CheckCircle,
  AlertTriangle, User, Phone, School, CreditCard,
  TrendingUp, FileText, Camera, Loader2, ShoppingBag, Plus, Trash2
} from 'lucide-react';

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const fmtDate  = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

interface Props { student: Student; onClose: () => void }

export const StudentDetail: React.FC<Props> = ({ student, onClose }) => {
  const schoolName          = useStore((s) => s.schoolName);
  const schoolYear          = useStore((s) => s.schoolYear);
  const messageRemerciement = useStore((s) => s.messageRemerciement);
  const messageRappel       = useStore((s) => s.messageRappel);
  const schoolLogo          = useStore((s) => s.schoolLogo);
  const schoolStamp         = useStore((s) => s.schoolStamp);

  const [tab, setTab] = useState<'infos' | 'historique' | 'depenses'>('infos');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Dépenses élève (Maillots, Excursion...) ──────────────────
  const [expenses, setExpenses] = useState<StudentExpense[]>([]);
  const [labels, setLabels] = useState<ExpenseLabel[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newLabelId, setNewLabelId] = useState('');
  const [newLabelText, setNewLabelText] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState('');
  const [payingExpenseId, setPayingExpenseId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payingBusy, setPayingBusy] = useState(false);

  const loadExpenses = React.useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const [exp, lbl] = await Promise.all([
        expensesApi.getStudentExpenses(student.id),
        expensesApi.getLabels(),
      ]);
      setExpenses(exp);
      setLabels(lbl);
    } catch (err) {
      console.error('Erreur chargement dépenses élève:', err);
    } finally {
      setLoadingExpenses(false);
    }
  }, [student.id]);

  useEffect(() => {
    if (tab === 'depenses' && expenses.length === 0 && !loadingExpenses) {
      loadExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleAddExpense = async () => {
    setExpenseError('');
    const amount = Number(newAmount);
    if (!amount || amount <= 0) { setExpenseError('Montant invalide.'); return; }
    if (!newLabelId && !newLabelText.trim()) { setExpenseError('Choisissez ou saisissez un libellé.'); return; }

    setSavingExpense(true);
    try {
      const created = await expensesApi.createStudentExpense(student.id, {
        labelId: newLabelId || undefined,
        label: newLabelId ? undefined : newLabelText.trim(),
        amount,
      });
      setExpenses((prev) => [created, ...prev]);
      setShowAddExpense(false);
      setNewLabelId('');
      setNewLabelText('');
      setNewAmount('');
    } catch (err: any) {
      setExpenseError(err?.error || 'Erreur lors de l\'ajout de la dépense.');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    try {
      await expensesApi.deleteStudentExpense(student.id, expenseId);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } catch (err) {
      console.error('Erreur suppression dépense:', err);
    }
  };

  const handlePayExpense = async (expenseId: string) => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    setPayingBusy(true);
    try {
      const updated = await expensesApi.payStudentExpense(student.id, expenseId, amount);
      setExpenses((prev) => prev.map((e) => (e.id === expenseId ? updated : e)));
      setPayingExpenseId(null);
      setPayAmount('');
    } catch (err) {
      console.error('Erreur paiement dépense:', err);
    } finally {
      setPayingBusy(false);
    }
  };

  const taux     = student.ecolage > 0 ? Math.round((student.dejaPaye / student.ecolage) * 100) : 0;
  const isSolde  = student.restant <= 0;
  const isPartiel = !isSolde && taux >= 70;

  const phone  = (student.telephone || '').replace(/\D/g, '');
  const waMsg  = isSolde
    ? `Bonjour, parent de ${student.prenom} ${student.nom} (${student.classe}). ${messageRemerciement} — ${schoolName}`
    : `Bonjour, parent de ${student.prenom} ${student.nom} (${student.classe}). Restant : ${fmtMoney(student.restant)}. ${messageRappel} — ${schoolName}`;

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Convertir en Base64
    const reader = new FileReader();
    reader.onloadstart = () => setIsUploading(true);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const { API_BASE_URL } = await import('../config');
        const { getAuthHeaders } = await import('../services/apiHelpers');

        const res = await fetch(`${API_BASE_URL}/students/upload-photo/${student.id}`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });

        const data = await res.json();
        if (data.success && data.photoUrl) {
          // Mettre à jour le store global
          const currentStudents = useStore.getState().students;
          const updated = currentStudents.map(s => 
            s.id === student.id ? { ...s, photoUrl: data.photoUrl } : s
          );
          useStore.setState({ students: updated });
          alert('✅ Photo mise à jour !');
        } else {
          alert('❌ Erreur: ' + (data.error || 'Inconnue'));
        }
      } catch (err) {
        console.error('Upload Error:', err);
        alert('❌ Erreur lors de l\'envoi de la photo.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={handleCameraClick}>
              {student.photoUrl ? (
                <img src={student.photoUrl} alt="Photo" className="w-16 h-16 rounded-full object-cover border-2 border-slate-700 shadow-lg transition-all group-hover:brightness-50" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex flex-col items-center justify-center text-slate-400 shrink-0 transition-all group-hover:bg-slate-700">
                  <User className="w-6 h-6 opacity-50" />
                </div>
              )}
              
              {/* Overlay Caméra */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>

              {/* Input caché */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
                onChange={handlePhotoCapture}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{student.prenom} {student.nom}</h2>
              <p className="text-slate-400 text-sm mt-0.5">{student.classe} · {student.cycle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badge statut */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          {isSolde ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
              <CheckCircle className="w-3.5 h-3.5" /> Parent Responsable · Élève Soldé
            </span>
          ) : isPartiel ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-300">
              ✓ 2ᵉ Tranche Validée (≥70%)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
              <AlertTriangle className="w-3.5 h-3.5" /> Non Soldé · Rappel requis
            </span>
          )}

          {/* Barre de progression */}
          <div className="flex-1 flex items-center gap-2 ml-auto">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-32">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${taux}%`,
                  background: isSolde ? '#16a34a' : isPartiel ? '#f59e0b' : taux >= 30 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <span className="text-xs font-bold text-gray-600">{taux}%</span>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-100">
          {(['infos', 'historique', 'depenses'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'infos' ? 'Informations' : t === 'historique' ? `Historique (${student.historiquesPaiements.length})` : 'Dépenses'}
            </button>
          ))}
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-5">

          {tab === 'infos' && (
            <div className="space-y-5">
              {/* Infos personnelles */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Informations personnelles
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Matricule', value: student.adsn || 'Non assigné' },
                    { label: 'Nom complet', value: `${student.prenom} ${student.nom}` },
                    { label: 'Date de naissance', value: student.dateNaissance ? new Date(student.dateNaissance).toLocaleDateString('fr-FR') : '—' },
                    { label: 'Sexe', value: student.sexe === 'M' ? 'Masculin' : 'Féminin' },
                    { label: 'Redoublant', value: student.redoublant ? 'Oui' : 'Non' },
                    { label: 'N° Reçu', value: student.recu || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scolarité */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5" /> Scolarité
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Classe', value: student.classe },
                    { label: 'Cycle', value: student.cycle },
                    { label: 'École de provenance', value: student.ecoleProvenance || 'N/A' },
                    { label: 'Année scolaire', value: schoolYear },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Contact parent
                </h3>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
                  <p className="text-sm font-semibold text-gray-900 font-mono">{student.telephone}</p>
                </div>
              </div>

              {/* Situation financière */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Situation financière
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Écolage</p>
                    <p className="text-sm font-bold text-gray-900">{new Intl.NumberFormat('fr-FR').format(student.ecolage)}</p>
                    <p className="text-xs text-gray-400">FCFA</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-600 mb-1">Payé</p>
                    <p className="text-sm font-bold text-emerald-700">{new Intl.NumberFormat('fr-FR').format(student.dejaPaye)}</p>
                    <p className="text-xs text-emerald-500">FCFA</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${isSolde ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <p className={`text-xs mb-1 ${isSolde ? 'text-emerald-600' : 'text-red-500'}`}>Restant</p>
                    {isSolde ? (
                      <p className="text-sm font-bold text-emerald-700">SOLDÉ</p>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-red-700">{new Intl.NumberFormat('fr-FR').format(student.restant)}</p>
                        <p className="text-xs text-red-400">FCFA</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Prévision */}
                <div className="mt-3 bg-amber-50 rounded-xl p-3 flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="text-xs text-amber-700">
                    <span className="font-semibold">Taux de paiement : {taux}%</span>
                    {!isSolde && (
                      <span className="ml-2 text-amber-500">
                        · Manque {fmtMoney(student.restant)} pour solder
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'historique' && (
            <div>
              {student.historiquesPaiements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                  <Clock className="w-10 h-10 mb-3 opacity-30" />
                  <p className="font-medium text-sm">Aucun paiement enregistré manuellement</p>
                  <p className="text-xs mt-1">Le montant initial vient de l'import Excel.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {student.historiquesPaiements.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-emerald-700">
                            +{new Intl.NumberFormat('fr-FR').format(p.montant)} FCFA
                          </span>
                          {p.recu && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> Reçu #{p.recu}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{fmtDate(p.date)}</span>
                          {p.note && <span className="italic">· {p.note}</span>}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Total des paiements manuels</span>
                    <span className="font-bold text-emerald-700">
                      {fmtMoney(student.historiquesPaiements.reduce((a, p) => a + p.montant, 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'depenses' && (
            <div>
              {loadingExpenses ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Dépenses liées à l'élève (Maillots, Excursion...) — distinctes de l'écolage, à payer par le parent.
                    </p>
                    <button
                      onClick={() => { setShowAddExpense((v) => !v); setExpenseError(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors shrink-0 ml-3"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter
                    </button>
                  </div>

                  {showAddExpense && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Libellé</label>
                        <select
                          value={newLabelId}
                          onChange={(e) => { setNewLabelId(e.target.value); if (e.target.value) setNewLabelText(''); }}
                          className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="">— Choisir dans le catalogue —</option>
                          {labels.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                        {!newLabelId && (
                          <input
                            type="text"
                            value={newLabelText}
                            onChange={(e) => setNewLabelText(e.target.value)}
                            placeholder="Ou saisir un nouveau libellé (ex: Maillots)"
                            className="w-full mt-2 p-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                          />
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Montant (FCFA)</label>
                        <input
                          type="number"
                          min={1}
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      {expenseError && <p className="text-xs text-red-500">{expenseError}</p>}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowAddExpense(false)}
                          className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleAddExpense}
                          disabled={savingExpense}
                          className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-60"
                        >
                          {savingExpense ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                      </div>
                    </div>
                  )}

                  {expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                      <ShoppingBag className="w-10 h-10 mb-3 opacity-30" />
                      <p className="font-medium text-sm">Aucune dépense enregistrée pour cet élève</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {expenses.map((exp) => {
                        const remaining = exp.amount - exp.amountPaid;
                        const isPaid = remaining <= 0;
                        return (
                          <div key={exp.id} className="bg-gray-50 rounded-xl px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{exp.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {fmtMoney(exp.amountPaid)} payé sur {fmtMoney(exp.amount)}
                                  {!isPaid && <span className="text-red-500"> · Reste {fmtMoney(remaining)}</span>}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                    <CheckCircle className="w-3 h-3" /> Soldé
                                  </span>
                                ) : payingExpenseId === exp.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      autoFocus
                                      min={1}
                                      max={remaining}
                                      value={payAmount}
                                      onChange={(e) => setPayAmount(e.target.value)}
                                      className="w-24 p-1.5 border border-gray-200 rounded-lg text-xs"
                                      placeholder={String(remaining)}
                                    />
                                    <button
                                      onClick={() => handlePayExpense(exp.id)}
                                      disabled={payingBusy}
                                      className="px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 disabled:opacity-60"
                                    >
                                      OK
                                    </button>
                                    <button
                                      onClick={() => { setPayingExpenseId(null); setPayAmount(''); }}
                                      className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setPayingExpenseId(exp.id); setPayAmount(String(remaining)); }}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                                  >
                                    Payer
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Total des dépenses</span>
                        <span className="font-bold text-gray-900">
                          {fmtMoney(expenses.reduce((a, e) => a + e.amount, 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions footer */}
        <div className="border-t border-gray-100 p-4 flex flex-wrap gap-2 bg-gray-50 rounded-b-2xl">
          <RecuPrintButton
            student={student}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm"
            title="Imprimer / exporter le reçu de paiement"
          >
            <Download className="w-4 h-4" /> Reçu PDF
          </RecuPrintButton>
          <a
            href={`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors ml-auto"
          >
            <X className="w-4 h-4" /> Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
