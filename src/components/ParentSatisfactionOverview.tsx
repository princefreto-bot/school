import React, { useEffect, useState } from 'react';
import { Heart, Loader2, MessageCircle, ThumbsUp, Meh, ThumbsDown } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { getAuthHeaders, parseResponse } from '../services/apiHelpers';

interface SatisfactionSummary {
  totalResponses: number;
  npsScore: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  monthlyTrend: { period: string; average: number; count: number }[];
  recentComments: { score: number; comment: string; createdAt: string }[];
}

const npsColor = (score: number | null) => {
  if (score === null) return 'text-slate-400';
  if (score >= 30) return 'text-emerald-500';
  if (score >= 0) return 'text-amber-500';
  return 'text-rose-500';
};

export const ParentSatisfactionOverview: React.FC = () => {
  const [data, setData] = useState<SatisfactionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/satisfaction/summary`, { headers: getAuthHeaders() });
        if (res.ok) setData(await parseResponse(res));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-[28px] flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="pro-card p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800 rounded-[28px]">
      <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-3 mb-5">
        <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
          <Heart className="w-5 h-5 text-rose-500" />
        </div>
        Satisfaction des Parents
      </h3>

      {data.totalResponses === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-sm font-bold text-slate-400">Aucune note reçue pour le moment.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-6 mb-6">
            <div>
              <p className={`text-4xl font-black tracking-tighter ${npsColor(data.npsScore)}`}>
                {data.npsScore !== null ? `${data.npsScore > 0 ? '+' : ''}${data.npsScore}` : '--'}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Score NPS</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <ThumbsUp className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{data.promoters}</p>
                <p className="text-[9px] font-bold text-emerald-600/70 uppercase">Promoteurs</p>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <Meh className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                <p className="text-sm font-black text-slate-600 dark:text-slate-300">{data.passives}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Passifs</p>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10">
                <ThumbsDown className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                <p className="text-sm font-black text-rose-700 dark:text-rose-400">{data.detractors}</p>
                <p className="text-[9px] font-bold text-rose-600/70 uppercase">Détracteurs</p>
              </div>
            </div>
          </div>

          {data.recentComments.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" /> Derniers commentaires
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {data.recentComments.map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black ${c.score >= 9 ? 'text-emerald-600' : c.score >= 7 ? 'text-amber-600' : 'text-rose-600'}`}>{c.score}/10</span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{c.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
