import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Student, Payment } from '../types';
import { CLASSES_BY_CYCLE as CLASSES } from '../data/classConfig';
import { 
  getStatusPaiement, 
  getStatusLabel, 
  getStatusColor, 
  formatMontant,
  generateWhatsAppLink,
  generateId,
  getCycleFromClasse,
  getEcolageFromClasse
} from '../utils/helpers';
import { generateReceipt, generateStudentCard } from '../utils/pdfService';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  Receipt,
  X,
  ChevronDown,
  Phone,
  History
} from 'lucide-react';

export const StudentManagement = () => {
  const { students, settings, addStudent, updateStudent, deleteStudent, addPayment } = useStore();
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterCycle, setFilterCycle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const allClasses = [...CLASSES.Primaire, ...CLASSES.Collège, ...CLASSES.Lycée];

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = search === '' || 
        `${s.nom} ${s.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
        s.telephone.includes(search);
      
      const matchClasse = filterClasse === '' || s.classe === filterClasse;
      const matchCycle = filterCycle === '' || s.cycle === filterCycle;
      
      const status = getStatusPaiement(s, settings.seuilDeuxiemeTranche);
      const matchStatus = filterStatus === '' || 
        (filterStatus === 'solde' && status === 'solde') ||
        (filterStatus === 'non_solde' && status !== 'solde');
      
      return matchSearch && matchClasse && matchCycle && matchStatus;
    });
  }, [students, search, filterClasse, filterCycle, filterStatus, settings.seuilDeuxiemeTranche]);

  const handleDelete = (student: Student) => {
    if (confirm(`Supprimer l'élève ${student.nom} ${student.prenom} ?`)) {
      deleteStudent(student.id);
    }
  };

  const openWhatsApp = (student: Student) => {
    const status = getStatusPaiement(student, settings.seuilDeuxiemeTranche);
    let message = `Bonjour,\n\nConcernant l'élève ${student.nom} ${student.prenom} (${student.classe}):\n\n`;
    
    if (status === 'solde') {
      message += `✅ ${settings.messageRemerciement}`;
    } else {
      message += `Frais de scolarité: ${formatMontant(student.ecolage)}\n`;
      message += `Déjà payé: ${formatMontant(student.dejaPaye)}\n`;
      message += `Reste à payer: ${formatMontant(student.restant)}\n\n`;
      message += settings.messageRappel;
    }
    
    message += `\n\n${settings.nomEcole}`;
    
    window.open(generateWhatsAppLink(student.telephone, message), '_blank');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Élèves</h1>
          <p className="text-gray-500">{students.length} élèves enregistrés</p>
        </div>
        <button
          onClick={() => { setEditingStudent(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter un élève
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterCycle}
            onChange={(e) => setFilterCycle(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les cycles</option>
            <option value="Primaire">Primaire</option>
            <option value="Collège">Collège</option>
            <option value="Lycée">Lycée</option>
          </select>

          <select
            value={filterClasse}
            onChange={(e) => setFilterClasse(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les classes</option>
            {allClasses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous statuts</option>
            <option value="solde">Soldés</option>
            <option value="non_solde">Non soldés</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Élève</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Classe</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Téléphone</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 text-sm">Écolage</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 text-sm">Payé</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-600 text-sm">Restant</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">Statut</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    {students.length === 0 
                      ? "Aucun élève. Importez un fichier Excel ou ajoutez manuellement."
                      : "Aucun résultat pour ces critères de recherche."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const status = getStatusPaiement(student, settings.seuilDeuxiemeTranche);
                  return (
                    <tr key={student.id} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            student.sexe === 'M' ? 'bg-blue-500' : 'bg-pink-500'
                          }`}>
                            {student.nom.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{student.nom} {student.prenom}</p>
                            <p className="text-xs text-gray-400">
                              {student.sexe === 'M' ? 'Masculin' : 'Féminin'}
                              {student.redoublant && ' • Redoublant'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm">{student.classe}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{student.telephone}</td>
                      <td className="py-3 px-4 text-right text-sm">{formatMontant(student.ecolage)}</td>
                      <td className="py-3 px-4 text-right text-sm text-green-600 font-medium">
                        {formatMontant(student.dejaPaye)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        {student.restant === 0 ? (
                          <span className="text-green-600 font-medium">SOLDÉ</span>
                        ) : (
                          <span className="text-red-500">{formatMontant(student.restant)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setSelectedStudent(student); setShowPaymentModal(true); }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Ajouter paiement"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setSelectedStudent(student); setShowHistoryModal(true); }}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Historique"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generateReceipt(student, settings)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Reçu PDF"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => generateStudentCard(student, settings)}
                            className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                            title="Fiche complète"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openWhatsApp(student)}
                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition"
                            title="Envoyer WhatsApp"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingStudent(student); setShowModal(true); }}
                            className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <StudentModal
          student={editingStudent}
          onClose={() => setShowModal(false)}
          onSave={(data) => {
            if (editingStudent) {
              updateStudent(editingStudent.id, data);
            } else {
              addStudent({
                ...data,
                id: generateId(),
                paiements: (data.dejaPaye || 0) > 0 ? [{
                  id: generateId(),
                  date: new Date().toISOString(),
                  montant: data.dejaPaye,
                  methode: 'Espèces',
                  reference: 'Paiement initial'
                }] : []
              } as Student);
            }
            setShowModal(false);
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <PaymentModal
          student={selectedStudent}
          onClose={() => setShowPaymentModal(false)}
          onSave={(payment) => {
            addPayment(selectedStudent.id, payment);
            setShowPaymentModal(false);
          }}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && selectedStudent && (
        <HistoryModal
          student={selectedStudent}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
};

// Student Modal Component
interface StudentModalProps {
  student: Student | null;
  onClose: () => void;
  onSave: (data: Partial<Student>) => void;
}

const StudentModal = ({ student, onClose, onSave }: StudentModalProps) => {
  const allClasses = [...CLASSES.Primaire, ...CLASSES.Collège, ...CLASSES.Lycée];
  
  const [formData, setFormData] = useState({
    nom: student?.nom || '',
    prenom: student?.prenom || '',
    classe: student?.classe || 'CP1',
    telephone: student?.telephone || '',
    sexe: student?.sexe || 'M',
    redoublant: student?.redoublant || false,
    ecoleProvenance: student?.ecoleProvenance || '',
    dejaPaye: student?.dejaPaye || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ecolage = getEcolageFromClasse(formData.classe);
    const restant = Math.max(0, ecolage - formData.dejaPaye);
    
    onSave({
      ...formData,
      sexe: formData.sexe as 'M' | 'F',
      ecolage,
      restant,
      cycle: getCycleFromClasse(formData.classe),
      recu: student?.recu || `REC-${Date.now()}`
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">
            {student ? 'Modifier l\'élève' : 'Ajouter un élève'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                required
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
              <div className="relative">
                <select
                  value={formData.classe}
                  onChange={(e) => setFormData({ ...formData, classe: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  {allClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sexe</label>
              <select
                value={formData.sexe}
                onChange={(e) => setFormData({ ...formData, sexe: e.target.value as 'M' | 'F' })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone parent</label>
            <input
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="+228 90 00 00 00"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">École de provenance</label>
            <input
              type="text"
              value={formData.ecoleProvenance}
              onChange={(e) => setFormData({ ...formData, ecoleProvenance: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="redoublant"
              checked={formData.redoublant}
              onChange={(e) => setFormData({ ...formData, redoublant: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="redoublant" className="text-sm text-gray-700">Redoublant</label>
          </div>

          {!student && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant déjà payé</label>
              <input
                type="number"
                min="0"
                value={formData.dejaPaye}
                onChange={(e) => setFormData({ ...formData, dejaPaye: parseInt(e.target.value) || 0 })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
            >
              {student ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Payment Modal
interface PaymentModalProps {
  student: Student;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}

const PaymentModal = ({ student, onClose, onSave }: PaymentModalProps) => {
  const [montant, setMontant] = useState(student.restant);
  const [methode, setMethode] = useState<Payment['methode']>('Espèces');
  const [reference, setReference] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: generateId(),
      studentId: student.id,
      date: new Date().toISOString(),
      montant: Math.min(montant, student.restant),
      methode,
      reference: reference || `PAY-${Date.now()}`,
      recu: `REC-${Date.now()}`
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Nouveau paiement</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium">{student.nom} {student.prenom}</p>
            <p className="text-sm text-gray-500">{student.classe}</p>
            <p className="text-sm mt-2">
              Reste à payer: <span className="font-bold text-red-500">{formatMontant(student.restant)}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
              <input
                type="number"
                required
                min="1"
                max={student.restant}
                value={montant}
                onChange={(e) => setMontant(parseInt(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Méthode de paiement</label>
              <select
                value={methode}
                onChange={(e) => setMethode(e.target.value as Payment['methode'])}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Espèces">Espèces</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Virement">Virement bancaire</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence (optionnel)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="N° de reçu ou référence"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// History Modal
const HistoryModal = ({ student, onClose }: { student: Student; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Historique des paiements</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium">{student.nom} {student.prenom}</p>
            <p className="text-sm text-gray-500">{student.classe}</p>
            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <p className="text-gray-500">Écolage</p>
                <p className="font-bold">{formatMontant(student.ecolage)}</p>
              </div>
              <div>
                <p className="text-gray-500">Payé</p>
                <p className="font-bold text-green-600">{formatMontant(student.dejaPaye)}</p>
              </div>
              <div>
                <p className="text-gray-500">Restant</p>
                <p className="font-bold text-red-500">
                  {student.restant === 0 ? 'SOLDÉ' : formatMontant(student.restant)}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-60">
            {!student.paiements || student.paiements.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucun paiement enregistré</p>
            ) : (
              <div className="space-y-3">
                {student.paiements.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-600">{formatMontant(p.montant)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(p.date).toLocaleDateString('fr-FR')} • {p.methode}
                      </p>
                      {p.reference && (
                        <p className="text-xs text-gray-400">Réf: {p.reference}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">#{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
