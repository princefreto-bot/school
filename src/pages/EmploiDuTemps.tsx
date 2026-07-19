// ============================================================
// PAGE EMPLOI DU TEMPS — Grille hebdomadaire par classe
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useStore } from '../store/useStore';
import { CLASS_CONFIG } from '../data/classConfig';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';
import {
  Calendar, Loader2, Plus, X, AlertTriangle, Download, Sparkles, Trash2
} from 'lucide-react';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const JOUR_INDEX: Record<string, number> = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 };

interface Slot {
  id: string;
  classe: string;
  matiere_id: string | null;
  enseignant_nom: string | null;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  matiere?: { nom: string; categorie: string } | null;
}

const fmtTime = (t: string) => (t || '').slice(0, 5);

export const EmploiDuTemps: React.FC = () => {
  const matieres = useStore((s) => s.matieres);
  const [classe, setClasse] = useState(CLASS_CONFIG[0]?.name || '');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formJour, setFormJour] = useState('Lundi');
  const [formMatiereId, setFormMatiereId] = useState('');
  const [formEnseignant, setFormEnseignant] = useState('');
  const [formDebut, setFormDebut] = useState('08:00');
  const [formFin, setFormFin] = useState('09:00');
  const [formSalle, setFormSalle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/timetable?classe=${encodeURIComponent(classe)}`, { headers: getAuthHeaders() });
      if (res.ok) setSlots(await parseResponse(res));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (classe) loadSlots(); }, [classe]);

  const grid = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const j of JOURS) map[j] = [];
    for (const s of slots) {
      const jourName = JOURS.find((j) => JOUR_INDEX[j] === s.jour_semaine);
      if (jourName) map[jourName].push(s);
    }
    for (const j of JOURS) map[j].sort((a, b) => fmtTime(a.heure_debut).localeCompare(fmtTime(b.heure_debut)));
    return map;
  }, [slots]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (formFin <= formDebut) {
      setErrorMsg("L'heure de fin doit être après l'heure de début.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/timetable`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          classe,
          matiereId: formMatiereId || null,
          enseignantNom: formEnseignant.trim() || null,
          jourSemaine: JOUR_INDEX[formJour],
          heureDebut: formDebut,
          heureFin: formFin,
          salle: formSalle.trim() || null
        })
      });
      const data = await parseResponse(res);
      if (res.ok) {
        setShowForm(false);
        setFormMatiereId('');
        setFormEnseignant('');
        setFormSalle('');
        await loadSlots();
      } else {
        setErrorMsg(data.error || "Erreur lors de l'ajout du créneau.");
      }
    } catch (err) {
      setErrorMsg('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/timetable/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.ok) await loadSlots();
    } catch (err) {
      // silencieux, l'utilisateur peut réessayer
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text(`Emploi du Temps — ${classe}`, 14, 15);

    const maxRows = Math.max(1, ...JOURS.map((j) => grid[j].length));
    const body: string[][] = [];
    for (let i = 0; i < maxRows; i++) {
      body.push(JOURS.map((j) => {
        const s = grid[j][i];
        if (!s) return '';
        const parts = [`${fmtTime(s.heure_debut)}-${fmtTime(s.heure_fin)}`, s.matiere?.nom || ''];
        if (s.enseignant_nom) parts.push(s.enseignant_nom);
        if (s.salle) parts.push(`(${s.salle})`);
        return parts.filter(Boolean).join('\n');
      }));
    }

    autoTable(doc, {
      startY: 20,
      head: [JOURS],
      body,
      styles: { fontSize: 8, cellPadding: 3, valign: 'top' },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Emploi_du_temps_${classe.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto animate-slideUp">
      {/* ── HEADER ── */}
      <div className="relative pro-card p-8 overflow-hidden group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <Calendar className="w-64 h-64 text-indigo-500" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Sparkles className="w-3.5 h-3.5" /> Emploi du temps
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-indigo-600">Planning</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Les conflits d'horaires (classe ou enseignant déjà occupé) sont détectés automatiquement à l'ajout.
          </p>
        </div>
      </div>

      {/* ── SÉLECTEUR CLASSE + ACTIONS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <select
          value={classe}
          onChange={(e) => setClasse(e.target.value)}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-64"
        >
          {CLASS_CONFIG.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Ajouter un créneau
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase rounded-xl transition active:scale-95"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* ── FORMULAIRE AJOUT ── */}
      {showForm && (
        <form onSubmit={handleAddSlot} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Jour</label>
              <select value={formJour} onChange={(e) => setFormJour(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                {JOURS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Début</label>
              <input type="time" value={formDebut} onChange={(e) => setFormDebut(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Fin</label>
              <input type="time" value={formFin} onChange={(e) => setFormFin(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs" />
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Matière</label>
              <select value={formMatiereId} onChange={(e) => setFormMatiereId(e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                <option value="">—</option>
                {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Salle</label>
              <input type="text" value={formSalle} onChange={(e) => setFormSalle(e.target.value)} placeholder="Ex: B12" className="w-full p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs" />
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Enseignant</label>
            <input type="text" value={formEnseignant} onChange={(e) => setFormEnseignant(e.target.value)} placeholder="Nom de l'enseignant" className="w-full md:w-80 p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition active:scale-95 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ajouter
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-xs uppercase rounded-xl transition">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* ── GRILLE ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 min-w-[900px]">
              {JOURS.map((j) => (
                <div key={j} className="border-r last:border-r-0 border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest text-center py-3 border-b border-slate-100 dark:border-slate-800">
                    {j}
                  </div>
                  <div className="p-2 space-y-2 min-h-[200px]">
                    {grid[j].length === 0 ? (
                      <p className="text-[10px] text-slate-300 dark:text-slate-700 text-center py-4">—</p>
                    ) : (
                      grid[j].map((s) => (
                        <div key={s.id} className="group relative bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-2.5">
                          <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">{fmtTime(s.heure_debut)} – {fmtTime(s.heure_fin)}</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{s.matiere?.nom || 'Sans matière'}</p>
                          {s.enseignant_nom && <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{s.enseignant_nom}</p>}
                          {s.salle && <p className="text-[9px] text-slate-400">Salle {s.salle}</p>}
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:text-rose-600 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
