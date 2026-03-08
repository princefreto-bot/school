// ============================================================
// CARTE SCOLAIRE — Génération de cartes avec QR Code
// ============================================================
import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { QRCodeSVG } from 'qrcode.react';
import {
    CreditCard, Search, Download, Printer, User, X, ChevronDown
} from 'lucide-react';

// ── Composant carte scolaire ─────────────────────────────────
const CarteEleve: React.FC<{
    nom: string; prenom: string; classe: string; id: string; sexe: string;
    schoolName: string; schoolYear: string; schoolLogo: string | null;
}> = ({ nom, prenom, classe, id, sexe, schoolName, schoolYear, schoolLogo }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const el = cardRef.current;
        if (!el) return;
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`
      <html><head><title>Carte - ${prenom} ${nom}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
        @media print { body { background: white; } }
      </style></head>
      <body>${el.outerHTML}</body></html>
    `);
        w.document.close();
        setTimeout(() => { w.print(); }, 300);
    };

    return (
        <div className="space-y-3">
            <div
                ref={cardRef}
                className="relative w-[340px] h-[210px] rounded-2xl overflow-hidden shadow-xl"
                style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2645 50%, #1e40af 100%)',
                    fontFamily: 'Inter, Arial, sans-serif',
                }}
            >
                {/* Décoration top */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                {/* Contenu */}
                <div className="relative z-10 h-full flex flex-col p-4">
                    {/* En-tête */}
                    <div className="flex items-center gap-2 mb-3">
                        {schoolLogo ? (
                            <img src={schoolLogo} alt="Logo" className="w-8 h-8 rounded-lg bg-white/90 p-0.5 object-contain" />
                        ) : (
                            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div>
                            <p className="text-white text-[10px] font-bold uppercase tracking-wider">{schoolName}</p>
                            <p className="text-blue-300 text-[8px]">Carte scolaire {schoolYear}</p>
                        </div>
                    </div>

                    {/* Corps */}
                    <div className="flex-1 flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white/30 flex items-center justify-center text-white text-xl font-bold shrink-0">
                            {prenom.charAt(0)}{nom.charAt(0)}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 text-white space-y-1">
                            <p className="text-sm font-bold truncate">{prenom} {nom}</p>
                            <div className="flex items-center gap-3 text-[10px] text-blue-200">
                                <span>📚 {classe}</span>
                                <span>{sexe === 'M' ? '👦' : '👧'} {sexe}</span>
                            </div>
                            <p className="text-[9px] text-blue-300 font-mono mt-1">ID: {id.slice(0, 12)}</p>
                        </div>

                        {/* QR Code */}
                        <div className="bg-white p-1.5 rounded-lg shrink-0">
                            <QRCodeSVG
                                value={id}
                                size={56}
                                level="M"
                                bgColor="white"
                                fgColor="#1e3a5f"
                            />
                        </div>
                    </div>

                    {/* Pied */}
                    <div className="mt-2 border-t border-white/10 pt-1.5 flex items-center justify-between">
                        <p className="text-[7px] text-blue-400">Scanner pour détails de l'élève</p>
                        <p className="text-[7px] text-blue-400 font-bold">YZOMACAMB</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 items-center">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimer
                </button>
            </div>
        </div>
    );
};

// ── Page principale ──────────────────────────────────────────
export const CarteScolaire: React.FC = () => {
    const students = useStore((s) => s.students);
    const schoolName = useStore((s) => s.schoolName);
    const schoolYear = useStore((s) => s.schoolYear);
    const schoolLogo = useStore((s) => s.schoolLogo);

    const [search, setSearch] = useState('');
    const [selectedClasse, setSelectedClasse] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

    const classes = [...new Set(students.map(s => s.classe))].sort();

    const filtered = students.filter(s => {
        const matchSearch = !search || `${s.prenom} ${s.nom} ${s.id}`.toLowerCase().includes(search.toLowerCase());
        const matchClasse = !selectedClasse || s.classe === selectedClasse;
        return matchSearch && matchClasse;
    });

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Cartes Scolaires</h2>
                        <p className="text-indigo-200 text-sm">Générer et imprimer les cartes des élèves</p>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un élève..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <select
                        value={selectedClasse}
                        onChange={(e) => setSelectedClasse(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none sm:w-48"
                    >
                        <option value="">Toutes les classes</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Grille des cartes */}
            {selectedStudent ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-gray-800">Carte scolaire</h3>
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="text-gray-400 hover:text-gray-600 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex justify-center">
                        {(() => {
                            const s = students.find(st => st.id === selectedStudent);
                            if (!s) return null;
                            return (
                                <CarteEleve
                                    nom={s.nom}
                                    prenom={s.prenom}
                                    classe={s.classe}
                                    id={s.id}
                                    sexe={s.sexe}
                                    schoolName={schoolName}
                                    schoolYear={schoolYear}
                                    schoolLogo={schoolLogo}
                                />
                            );
                        })()}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <p className="text-xs text-gray-500 mb-3">{filtered.length} élève(s) trouvé(s)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                        {filtered.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStudent(s.id)}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {s.prenom.charAt(0)}{s.nom.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{s.prenom} {s.nom}</p>
                                    <p className="text-xs text-gray-500">{s.classe}</p>
                                </div>
                                <CreditCard className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
