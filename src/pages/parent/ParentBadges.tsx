import React, { useEffect, useState } from 'react';
import { parentApi } from '../../services/parentApi';
import { Award, ShieldCheck, Zap, Star, Loader2, AlertCircle } from 'lucide-react';

export const ParentBadges: React.FC = () => {
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const result = await parentApi.getBadges();
                setBadges(result.badges || []);
            } catch (err: any) {
                setError("Impossible de charger vos badges.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBadges();
    }, []);

    // On garde la structure visuelle originale mais on l'alimente avec les données du backend
    const getIcon = (code: string) => {
        switch (code) {
            case 'welcome': return <ShieldCheck className="w-8 h-8" />;
            case 'half_paid': return <Zap className="w-8 h-8" />;
            case 'fully_paid': return <Star className="w-8 h-8" />;
            default: return <Award className="w-8 h-8" />;
        }
    };

    const getColor = (code: string) => {
        switch (code) {
            case 'welcome': return 'bg-blue-100 text-blue-600';
            case 'half_paid': return 'bg-amber-100 text-amber-500';
            case 'fully_paid': return 'bg-emerald-100 text-emerald-500';
            default: return 'bg-purple-100 text-purple-600';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p>Chargement de vos succès...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-800">Mes badges</h2>
            </div>

            <p className="text-slate-500">
                Débloquez ces badges en fonction de votre engagement et de vos paiements.
            </p>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {badges.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                        Aucun badge débloqué pour le moment.
                    </div>
                ) : (
                    badges.map((badge) => (
                        <div
                            key={badge.id}
                            className="bg-white rounded-2xl shadow-sm border border-emerald-200 p-6 flex flex-col items-center text-center transition-all hover:shadow-md"
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${badge.icon_color || getColor(badge.code)}`}>
                                {getIcon(badge.code)}
                            </div>

                            <h3 className="font-bold text-lg mb-2 text-slate-800">
                                {badge.label}
                            </h3>

                            <p className="text-sm text-slate-500 flex-grow">
                                {badge.description}
                            </p>

                            {badge.student_prenom && (
                                <p className="text-xs text-blue-600 mt-2 font-medium">Lé à : {badge.student_prenom}</p>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-100 w-full">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 w-full justify-center">
                                    Obtenu le {new Date(badge.earned_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
