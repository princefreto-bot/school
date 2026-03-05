import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getCycleByClass } from '../data/classes';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Finance() {
  const { students, settings } = useStore();
  const formatMoney = (value: number) => new Intl.NumberFormat('fr-FR').format(value) + ' ' + settings.currency;

  const cycleStats = useMemo(() => {
    const cycles = ['Primaire', 'Collège', 'Lycée'] as const;
    return cycles.map(cycle => {
      const cycleStudents = students.filter(s => getCycleByClass(s.classe) === cycle);
      const totalEcolage = cycleStudents.reduce((sum, s) => sum + s.ecolage, 0);
      const totalPaye = cycleStudents.reduce((sum, s) => sum + s.dejaPaye, 0);
      return { cycle, eleves: cycleStudents.length, ecolage: totalEcolage, paye: totalPaye, restant: totalEcolage - totalPaye, taux: totalEcolage > 0 ? Math.round((totalPaye / totalEcolage) * 100) : 0 };
    });
  }, [students]);

  const classStats = useMemo(() => {
    const classMap = new Map<string, { ecolage: number; paye: number; eleves: number }>();
    students.forEach(s => {
      const current = classMap.get(s.classe) || { ecolage: 0, paye: 0, eleves: 0 };
      classMap.set(s.classe, { ecolage: current.ecolage + s.ecolage, paye: current.paye + s.dejaPaye, eleves: current.eleves + 1 });
    });
    return Array.from(classMap.entries()).map(([classe, data]) => ({ classe, ...data, restant: data.ecolage - data.paye, taux: data.ecolage > 0 ? Math.round((data.paye / data.ecolage) * 100) : 0 })).sort((a, b) => b.taux - a.taux);
  }, [students]);

  const pieData = useMemo(() => cycleStats.map((stat, index) => ({ name: stat.cycle, value: stat.paye, color: COLORS[index] })), [cycleStats]);
  const retardPaiement = useMemo(() => students.filter(s => s.restant > 0 && s.dejaPaye < s.ecolage * 0.3).sort((a, b) => b.restant - a.restant).slice(0, 10), [students]);
  const totalStats = useMemo(() => {
    const totalEcolage = students.reduce((sum, s) => sum + s.ecolage, 0);
    const totalPaye = students.reduce((sum, s) => sum + s.dejaPaye, 0);
    return { totalEcolage, totalPaye, totalRestant: totalEcolage - totalPaye, tauxGlobal: totalEcolage > 0 ? Math.round((totalPaye / totalEcolage) * 100) : 0 };
  }, [students]);

  if (students.length === 0) return (<div className="flex flex-col items-center justify-center h-96 text-center"><DollarSign className="w-24 h-24 text-gray-300 mb-6" /><h2 className="text-2xl font-semibold text-gray-600 mb-2">Aucune donnée financière</h2><p className="text-gray-500">Importez des élèves pour voir les analyses financières.</p></div>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white"><div className="flex items-center gap-3"><DollarSign className="w-8 h-8 opacity-80" /><div><p className="text-sm opacity-80">Total Attendu</p><p className="text-xl font-bold">{formatMoney(totalStats.totalEcolage)}</p></div></div></div>
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white"><div className="flex items-center gap-3"><TrendingUp className="w-8 h-8 opacity-80" /><div><p className="text-sm opacity-80">Total Perçu</p><p className="text-xl font-bold">{formatMoney(totalStats.totalPaye)}</p></div></div></div>
        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white"><div className="flex items-center gap-3"><TrendingDown className="w-8 h-8 opacity-80" /><div><p className="text-sm opacity-80">Reste à Percevoir</p><p className="text-xl font-bold">{formatMoney(totalStats.totalRestant)}</p></div></div></div>
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white"><div className="flex items-center gap-3"><PieChartIcon className="w-8 h-8 opacity-80" /><div><p className="text-sm opacity-80">Taux Global</p><p className="text-xl font-bold">{totalStats.tauxGlobal}%</p></div></div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><h3 className="text-lg font-semibold mb-4">Revenus par Cycle</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name }) => name} labelLine={false}>{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip formatter={(value) => formatMoney(value as number)} /><Legend /></PieChart></ResponsiveContainer></div></div>
        <div className="card"><h3 className="text-lg font-semibold mb-4">Détail par Cycle</h3><div className="space-y-4">{cycleStats.map((stat, index) => (<div key={stat.cycle} className="p-4 bg-gray-50 rounded-lg"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} /><span className="font-medium">{stat.cycle}</span><span className="text-sm text-gray-500">({stat.eleves} élèves)</span></div><span className="font-bold">{stat.taux}%</span></div><div className="flex justify-between text-sm mb-2"><span className="text-green-600">Payé: {formatMoney(stat.paye)}</span><span className="text-red-600">Restant: {formatMoney(stat.restant)}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${stat.taux}%`, backgroundColor: COLORS[index] }} /></div></div>))}</div></div>
      </div>

      <div className="card"><h3 className="text-lg font-semibold mb-4">Comparaison par Classe</h3><div className="h-96"><ResponsiveContainer width="100%" height="100%"><BarChart data={classStats} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="classe" type="category" width={80} /><Tooltip formatter={(value, name) => [formatMoney(value as number), name === 'paye' ? 'Payé' : 'Restant']} /><Legend /><Bar dataKey="paye" name="Payé" fill="#10B981" stackId="a" /><Bar dataKey="restant" name="Restant" fill="#EF4444" stackId="a" /></BarChart></ResponsiveContainer></div></div>

      <div className="card"><div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-orange-500" /><h3 className="text-lg font-semibold">Retards de Paiement (moins de 30% payé)</h3></div>{retardPaiement.length === 0 ? <p className="text-center text-gray-500 py-8">Aucun retard de paiement détecté</p> : <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="text-left py-3 px-4 font-semibold text-gray-600">Élève</th><th className="text-left py-3 px-4 font-semibold text-gray-600">Classe</th><th className="text-right py-3 px-4 font-semibold text-gray-600">Écolage</th><th className="text-right py-3 px-4 font-semibold text-gray-600">Payé</th><th className="text-right py-3 px-4 font-semibold text-gray-600">Restant</th><th className="text-center py-3 px-4 font-semibold text-gray-600">Taux</th></tr></thead><tbody>{retardPaiement.map(student => (<tr key={student.id} className="border-b border-gray-100 hover:bg-red-50"><td className="py-3 px-4 font-medium">{student.nom} {student.prenom}</td><td className="py-3 px-4">{student.classe}</td><td className="py-3 px-4 text-right">{formatMoney(student.ecolage)}</td><td className="py-3 px-4 text-right text-green-600">{formatMoney(student.dejaPaye)}</td><td className="py-3 px-4 text-right text-red-600 font-bold">{formatMoney(student.restant)}</td><td className="py-3 px-4 text-center"><span className="badge badge-danger">{Math.round((student.dejaPaye / student.ecolage) * 100)}%</span></td></tr>))}</tbody></table></div>}</div>

      <div className="card"><h3 className="text-lg font-semibold mb-4">Prévision de Trésorerie</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-600">Si 50% des impayés règlent</p><p className="text-2xl font-bold text-blue-800">{formatMoney(totalStats.totalPaye + totalStats.totalRestant * 0.5)}</p></div><div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-green-600">Si 75% des impayés règlent</p><p className="text-2xl font-bold text-green-800">{formatMoney(totalStats.totalPaye + totalStats.totalRestant * 0.75)}</p></div><div className="bg-purple-50 p-4 rounded-lg"><p className="text-sm text-purple-600">Si 100% règlent</p><p className="text-2xl font-bold text-purple-800">{formatMoney(totalStats.totalEcolage)}</p></div></div></div>
    </div>
  );
}
