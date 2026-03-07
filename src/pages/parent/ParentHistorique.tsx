import React, { useEffect, useState } from 'react';
import { parentApi } from '../../services/parentApi';
import { Clock, Download, Loader2, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ParentHistorique: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAllPayments = async () => {
            try {
                // On récupère d'abord le dashboard pour avoir la liste des enfants
                const dash = await parentApi.getDashboard();
                const children = dash.students || [];

                // Puis on récupère l'historique pour chaque enfant
                const allPayPromises = children.map((c: any) => parentApi.getPayments(c.id));
                const results = await Promise.all(allPayPromises);

                const merged = results.flatMap((res: any) =>
                    res.payments.map((p: any) => ({
                        ...p,
                        studentName: `${res.student.prenom} ${res.student.nom}`,
                        classe: res.student.classe
                    }))
                ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setPayments(merged);
            } catch (err: any) {
                setError("Impossible de charger l'historique des paiements.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllPayments();
    }, []);

    const downloadReceipt = (payment: any) => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text('Reçu de Paiement', 20, 20);
        doc.setFontSize(12);
        doc.text(`Élève: ${payment.studentName}`, 20, 40);
        doc.text(`Classe: ${payment.classe}`, 20, 50);
        doc.text(`Date: ${format(new Date(payment.date), 'dd/MM/yyyy')}`, 20, 60);
        doc.text(`Montant payé: ${payment.montant.toLocaleString()} FCFA`, 20, 70);
        doc.text(`N° de reçu: ${payment.recu}`, 20, 80);
        if (payment.note) {
            doc.text(`Note: ${payment.note}`, 20, 90);
        }

        doc.save(`Recu_${payment.recu}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p>Chargement de votre historique...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-800">Historique des paiements</h2>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Enfant</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Montant</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600">N° Reçu</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        Aucun paiement enregistré pour l'instant.
                                    </td>
                                </tr>
                            ) : (
                                payments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {format(new Date(payment.date), 'dd MMMM yyyy HH:mm', { locale: fr })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                            {payment.studentName}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                                            {payment.montant.toLocaleString()} FCFA
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                            {payment.recu}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => downloadReceipt(payment)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-2 text-sm font-medium"
                                            >
                                                <Download className="w-4 h-4" />
                                                PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
