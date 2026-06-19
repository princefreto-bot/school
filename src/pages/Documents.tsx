import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Student } from '../types';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';
import { DocumentScanner } from '../components/DocumentScanner';
import { 
  FileText, Search, User, Calendar, Download, Trash, Plus, 
  AlertCircle, CheckCircle, Shield, Award, Sparkles, Filter 
} from 'lucide-react';

interface StudentDocument {
  id: string;
  student_id: string;
  document_type: 'birth_certificate' | 'report_card' | 'certificate' | 'other';
  title: string;
  file_url: string;
  created_at: string;
}

export const Documents: React.FC = () => {
  const students = useStore((s) => s.students);
  const user = useStore((s) => s.user);
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Extraire les classes uniques pour les filtres
  const classes = [...new Set(students.map(s => s.classe))].sort();

  // Filtrer les élèves
  const filteredStudents = students.filter(s => {
    const matchesSearch = `${s.nom} ${s.prenom}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClasse = !filterClasse || s.classe === filterClasse;
    return matchesSearch && matchesClasse;
  });

  // Charger les documents de l'élève sélectionné
  const fetchStudentDocuments = async (studentId: string) => {
    setLoadingDocs(true);
    setDocuments([]);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/student/${studentId}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error("Impossible de charger les documents de l'élève.");
      }
      const data = await parseResponse(res);
      setDocuments(data);
    } catch (err: any) {
      console.error("fetchStudentDocuments Error:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDocuments(selectedStudent.id);
    }
  }, [selectedStudent]);

  // Gérer la soumission du scanner
  const handleScannerCapture = async (file: File, docType: string, title: string) => {
    if (!selectedStudent || !user || !user.schoolSlug) {
      alert("Session ou élève non valide.");
      return;
    }

    setSubmitting(true);
    setIsScannerOpen(false);
    setMessage(null);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('student_id', selectedStudent.id);
    formData.append('document_type', docType);
    formData.append('title', title);
    formData.append('school_slug', user.schoolSlug);

    // Récupérer le token parent_token pour l'auth, et omettre Content-Type
    const token = localStorage.getItem('parent_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(`${API_BASE_URL}/documents/scan`, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const result = await parseResponse(res);

      if (res.ok) {
        setMessage({ type: 'success', text: `Le document "${title}" a été enregistré avec succès. Une notification push a été envoyée aux parents.` });
        fetchStudentDocuments(selectedStudent.id);
      } else {
        throw new Error(result.error || "Une erreur est survenue lors de l'enregistrement.");
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Erreur de numérisation." });
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer un document
  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer définitivement le document "${docTitle}" ?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/documents/${docId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        setMessage({ type: 'success', text: "Le document a été supprimé avec succès." });
        if (selectedStudent) {
          fetchStudentDocuments(selectedStudent.id);
        }
      } else {
        const result = await parseResponse(res);
        throw new Error(result.error || "Une erreur est survenue lors de la suppression.");
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const getDocTypeBadge = (type: string) => {
    const badges: Record<string, { label: string, color: string }> = {
      birth_certificate: { label: "Acte de naissance", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
      report_card: { label: "Bulletin scolaire", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
      certificate: { label: "Attestation / Certificat", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
      other: { label: "Autre", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
    };
    return badges[type] || badges.other;
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto animate-slideUp">
      {/* ── HEADER ── */}
      <div className="relative pro-card p-8 overflow-hidden group bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-indigo-100 dark:border-indigo-900/30">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <FileText className="w-64 h-64 text-indigo-500" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500 text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                <Sparkles className="w-3.5 h-3.5" /> Numériseur Intelligent
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">
              Centre de <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-indigo-600">Documents</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Numérisez les dossiers de vos élèves (actes de naissance, bulletins, attestations) avec des filtres d'image haute performance (noir & blanc, couleur améliorée). Alertez instantanément les parents lors de chaque enregistrement.
            </p>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-slideUp ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <div className="text-xs font-bold leading-relaxed">{message.text}</div>
          <button onClick={() => setMessage(null)} className="ml-auto text-[10px] font-bold uppercase tracking-wider underline">Fermer</button>
        </div>
      )}

      {/* ── SPLIT PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Colonne Gauche : Liste des élèves */}
        <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 flex flex-col h-[70vh] lg:h-[75vh]">
          
          <div className="space-y-4 mb-6">
            <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">Registre Élèves</h3>
            
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm"
              />
            </div>

            {/* Filtre Classe */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterClasse}
                onChange={(e) => setFilterClasse(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 appearance-none cursor-pointer"
              >
                <option value="">Toutes les classes</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Liste Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredStudents.map((student) => {
              const active = selectedStudent?.id === student.id;
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between active:scale-[0.98] ${
                    active 
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 shadow-md' 
                      : 'border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm leading-snug">{student.prenom} {student.nom}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{student.classe} • {student.cycle}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${active ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {student.prenom.charAt(0).toUpperCase()}
                  </div>
                </button>
              );
            })}
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-bold">
                Aucun élève correspondant
              </div>
            )}
          </div>
        </div>

        {/* Colonne Droite : Fiche Élève et Historique des pièces */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 space-y-6">
              
              {/* Profil Tête */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-lg shadow-inner">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white leading-tight">{selectedStudent.prenom} {selectedStudent.nom}</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{selectedStudent.classe} • {selectedStudent.cycle}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsScannerOpen(true)}
                  disabled={submitting}
                  className="px-6 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Numériser une pièce
                </button>
              </div>

              {/* Loader documents */}
              {loadingDocs ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chargement de l'historique...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[28px] bg-slate-50/20 dark:bg-slate-800/5">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">Aucune pièce numérisée pour cet élève.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Cliquez sur "Numériser" pour ajouter son acte de naissance ou relevés.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Documents Archivés ({documents.length})</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documents.map((doc) => {
                      const badge = getDocTypeBadge(doc.document_type);
                      const filename = doc.file_url.split('/').pop();
                      const token = localStorage.getItem('parent_token');
                      const fileUrl = `${API_BASE_URL}/documents/file/${filename}?token=${token}`;
                      
                      return (
                        <div 
                          key={doc.id}
                          className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex flex-col justify-between hover:shadow-lg transition duration-300"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className={`px-2.5 py-1 border rounded-lg text-[9px] font-black uppercase tracking-wider ${badge.color}`}>
                                {badge.label}
                              </span>
                              
                              <button
                                onClick={() => handleDeleteDocument(doc.id, doc.title)}
                                className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 transition"
                                title="Supprimer"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>

                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-tight tracking-tight mt-1">{doc.title}</p>
                            
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Ajouté le {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {/* Image Thumbnail Preview */}
                            {(filename?.toLowerCase().endsWith('.png') || filename?.toLowerCase().endsWith('.jpg') || filename?.toLowerCase().endsWith('.jpeg')) && (
                              <a 
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 block relative w-full h-32 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-805 flex items-center justify-center group/thumb cursor-zoom-in"
                              >
                                <img 
                                  src={fileUrl} 
                                  alt={doc.title}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-slate-950/0 group-hover/thumb:bg-slate-950/30 transition-colors flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 duration-300">
                                  <span className="text-[10px] font-bold text-white bg-indigo-500/90 px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                    Agrandir l'image
                                  </span>
                                </div>
                              </a>
                            )}
                          </div>

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-4">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-xl text-[11px] font-black uppercase tracking-widest transition"
                            >
                              <Download className="w-3.5 h-3.5" /> Télécharger / Voir
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
            </div>
          ) : (
            <div className="pro-card p-12 text-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 flex flex-col items-center justify-center min-h-[40vh]">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-[20px] flex items-center justify-center mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white mb-2">Sélectionnez un élève</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold max-w-sm">
                Choisissez un élève dans la colonne de gauche pour accéder à son coffre-fort de documents et démarrer une numérisation.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL SCANNER OVERLAY */}
      {isScannerOpen && selectedStudent && (
        <DocumentScanner
          studentName={`${selectedStudent.prenom} ${selectedStudent.nom}`}
          onCapture={handleScannerCapture}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};
