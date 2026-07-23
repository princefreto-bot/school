// ============================================================
// Panneau parent — Historique des paiements de licence + reçus PDF
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import { Receipt, Loader2, Download, CheckCircle, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';
import { getAuthHeaders } from '../services/apiHelpers';

interface Student {
    id: string;
    nom: string;
    prenom: string;
    classe: string;
}

interface LicensePayment {
    id: string;
    student_id: string;
    license_key: string;
    amount: number;
    tranche_number: number;
    is_final: boolean;
    paid_at: string;
    student: Student | null;
}

const fmtMoney = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' F CFA';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

function generateReceiptPdf(payment: LicensePayment) {
    const doc = new jsPDF({ unit: 'mm', format: 'a5' });
    const studentName = payment.student ? `${payment.student.prenom} ${payment.student.nom}` : 'Élève';
    const receiptNo = `RC-${payment.id.slice(0, 8).toUpperCase()}`;

    // Header
    doc.setFillColor(217, 119, 6); // amber
    doc.rect(0, 0, 148, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('DGHUBSCHOOL', 12, 10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Reçu de paiement — Licence Suivi Parent', 12, 16);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text(`N° ${receiptNo}`, 148 - 12, 10, { align: 'right' });
    doc.text(fmtDate(payment.paid_at), 148 - 12, 15, { align: 'right' });

    // Corps
    let y = 32;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Détails du paiement', 12, y);
    y += 3;
    doc.setDrawColor(217, 119, 6);
    doc.line(12, y, 148 - 12, y);
    y += 8;

    autoTable(doc, {
        startY: y,
        margin: { left: 12, right: 12 },
        theme: 'plain',
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2, textColor: [51, 65, 85] },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 45 },
            1: { textColor: [15, 23, 42] }
        },
        body: [
            ['Élève', `${studentName}${payment.student?.classe ? ' — ' + payment.student.classe : ''}`],
            ['Type', payment.is_final && payment.tranche_number === 0 ? 'Règlement complet' : `Tranche ${payment.tranche_number} sur 3`],
            ['Montant', fmtMoney(payment.amount)],
            ['Date', new Date(payment.paid_at).toLocaleString('fr-FR')],
            ['Clé de licence', payment.license_key],
            ['Statut', payment.is_final ? 'Licence entièrement soldée' : 'Paiement partiel enregistré']
        ]
    });

    // Footer
    y = (doc as any).lastAutoTable.finalY + 12;
    doc.setDrawColor(226, 232, 240);
    doc.line(12, y, 148 - 12, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('DGhubSchool — plateforme numérique de gestion scolaire.', 12, y);
    doc.text('contact@dghubschool.com  ·  WhatsApp +228 72 47 30 27  ·  www.dghubschool.com', 12, y + 4);
    doc.text('Ce reçu est généré automatiquement et fait foi du versement effectué via Chariow.', 12, y + 8);

    doc.save(`${receiptNo}_${studentName.replace(/\s+/g, '_')}.pdf`);
}

export const LicensePaymentsPanel: React.FC = () => {
    const [payments, setPayments] = useState<LicensePayment[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/license-payments/mine`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setPayments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('LicensePaymentsPanel load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Chargement des reçus...</span>
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 text-center">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Aucun paiement de licence enregistré</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">Vos reçus apparaîtront ici dès votre premier versement.</p>
            </div>
        );
    }

    // Grouper par élève
    const byStudent = new Map<string, LicensePayment[]>();
    payments.forEach(p => {
        const key = p.student_id;
        if (!byStudent.has(key)) byStudent.set(key, []);
        byStudent.get(key)!.push(p);
    });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Mes reçus de licence</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Historique des tranches réglées</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={load}
                    className="text-[11px] font-black text-amber-600 hover:text-amber-700 uppercase"
                >
                    Actualiser
                </button>
            </div>

            <div className="space-y-6">
                {[...byStudent.entries()].map(([sid, rows]) => {
                    const student = rows[0].student;
                    const total = rows.reduce((s, r) => s + r.amount, 0);
                    const isComplete = rows.some(r => r.is_final);
                    return (
                        <div key={sid}>
                            <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">
                                        {student ? `${student.prenom} ${student.nom}` : 'Élève'}
                                    </p>
                                    <p className="text-[11px] text-slate-500 font-medium uppercase">{student?.classe}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{fmtMoney(total)} <span className="text-[10px] text-slate-400">/ 2 100</span></p>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {isComplete ? 'Soldé' : 'Partiel'}
                                    </span>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {rows.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 py-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.is_final ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {p.is_final ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                                {p.tranche_number === 0 ? 'Règlement complet' : `Tranche ${p.tranche_number} / 3`} — {fmtMoney(p.amount)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {fmtDate(p.paid_at)} · Clé {p.license_key.slice(0, 8)}…
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => generateReceiptPdf(p)}
                                            className="flex items-center gap-1 text-[10px] font-black text-amber-600 hover:text-amber-700 border border-amber-200 hover:bg-amber-50 px-2 py-1 rounded-lg uppercase"
                                        >
                                            <Download className="w-3 h-3" /> Reçu
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
