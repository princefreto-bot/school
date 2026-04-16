import { useState, useMemo, useRef } from 'react';
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
import { uploadStudentPhoto } from '../services/photoService';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  Receipt,
  ChevronDown,
  Phone,
  History,
  Camera,
  MoreVertical,
  X
} from 'lucide-react';
import { useEffect } from 'react';

// ==========================================
// COMPOSANT MENU ACTIONS
// ==========================================
/**
 * Composant pour gérer le menu déroulant des actions d'un élève
 * Permet d'alléger l'interface en gardant l'écran propre
 */
const StudentActionMenu = ({ 
  student, 
  onEdit, 
  onDelete, 
  onHistory,
  onWhatsApp,
  onReceipt,
  onCard 
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition border border-transparent hover:border-gray-200 shadow-sm bg-white"
        title="Plus d'options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
          <button onClick={() => { setIsOpen(false); onEdit(student); }} className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-3">
            <Edit2 className="w-4 h-4 text-orange-500" /> Modifier l'élève
          </button>
          <button onClick={() => { setIsOpen(false); onHistory(student); }} className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-3">
            <History className="w-4 h-4 text-purple-500" /> Fiche complète (Hist)
          </button>
          <div className="h-px bg-gray-100 my-1"></div>
          <button onClick={() => { setIsOpen(false); onReceipt(student); }} className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-3">
            <Receipt className="w-4 h-4 text-blue-500" /> Reçu de paiement PDF
          </button>
          <button onClick={() => { setIsOpen(false); onCard(student); }} className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-3">
            <FileText className="w-4 h-4 text-slate-500" /> Fiche Scolaire PDF
          </button>
          <button onClick={() => { setIsOpen(false); onWhatsApp(student); }} className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-3">
            <Phone className="w-4 h-4 text-green-500" /> Envoyer WhatsApp
          </button>
          <div className="h-px bg-gray-100 my-1"></div>
          <button onClick={() => { setIsOpen(false); onDelete(student); }} className="w-full text-left px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
};

export const StudentManagement = () => {
  const { students, settings, addStudent, updateStudent, deleteStudent, addPayment } = useStore();
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterCycle, setFilterCycle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
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

  const handleSaveStudent = async (data: Partial<Student>) => {
    let finalData = { ...data };

    if (editingStudent) {
      // Si la photo est un nouveau base64 (commence par data:image), on l'uploade
      if (data.photoUrl && data.photoUrl.startsWith('data:image')) {
        const uploadedUrl = await uploadStudentPhoto(editingStudent.id, data.photoUrl);
        if (uploadedUrl) {
          finalData.photoUrl = uploadedUrl;
        }
        // Sinon on garde le base64 en local (fallback offline)
      }
      updateStudent(editingStudent.id, finalData);
    } else {
      // Nouvel élève : on crée d'abord (pour avoir l'ID), puis on uploade la photo
      const tempPhoto = finalData.photoUrl;
      finalData.photoUrl = undefined; // On sauvegarde d'abord sans photo
      addStudent({
        ...finalData,
        id: generateId(),
        paiements: (finalData.dejaPaye || 0) > 0 ? [{
          id: generateId(),
          date: new Date().toISOString(),
          montant: finalData.dejaPaye || 0,
          methode: 'Espèces',
          reference: 'Paiement initial'
        }] : []
      } as Student);

      // Si photo base64, on la stocke localement d'abord
      // L'upload réel se fera lors de la prochaine modification (quand l'ID est stable)
      if (tempPhoto && tempPhoto.startsWith('data:image')) {
        // Recéperer l'ID qui vient d'être créé — on passe par une mise à jour immédiate
        // en gardant le base64 pour l'affichage local
        const newStudentList = useStore.getState().students;
        const newStudent = newStudentList.find(
          s => s.nom === finalData.nom && s.prenom === finalData.prenom && s.classe === finalData.classe
        );
        if (newStudent) {
          const uploadedUrl = await uploadStudentPhoto(newStudent.id, tempPhoto);
          updateStudent(newStudent.id, { photoUrl: uploadedUrl || tempPhoto });
        }
      }
    }
    setShowModal(false);
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
                          {/* AVATAR CLIQUABLE pour assigner la photo */}
                          <button
                            onClick={() => { setSelectedStudent(student); setShowPhotoModal(true); }}
                            className="relative group flex-shrink-0"
                            title={student.photoUrl ? 'Changer la photo' : 'Assigner une photo passeport'}
                          >
                            {student.photoUrl ? (
                              <img
                                src={student.photoUrl}
                                alt={student.nom}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow group-hover:opacity-80 transition"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:opacity-70 transition ${
                                student.sexe === 'M' ? 'bg-blue-500' : 'bg-pink-500'
                              }`}>
                                {student.nom.charAt(0)}{student.prenom.charAt(0)}
                              </div>
                            )}
                            {/* Badge caméra au survol */}
                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                            {/* Point vert si photo existe */}
                            {student.photoUrl && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 rounded-full border-2 border-white" />
                            )}
                          </button>
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
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* ACTION PRIMAIRE 1 : Payer */}
                          <button
                            onClick={() => { setSelectedStudent(student); setShowPaymentModal(true); }}
                            className="px-2.5 py-1.5 text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition flex items-center gap-1.5 font-semibold text-xs whitespace-nowrap shadow-sm"
                            title="Ajouter paiement"
                          >
                            <Plus className="w-3.5 h-3.5" /> Payer
                          </button>

                          {/* ACTION PRIMAIRE 2 : Photo */}
                          <button
                            onClick={() => { setSelectedStudent(student); setShowPhotoModal(true); }}
                            className={`p-1.5 rounded-lg transition border shadow-sm ${
                              student.photoUrl
                                ? 'text-teal-600 bg-teal-50 border-teal-200 hover:bg-teal-100'
                                : 'text-gray-400 border-dashed border-gray-300 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-300 bg-white'
                            }`}
                            title={student.photoUrl ? 'Changer la photo' : 'Assigner une photo'}
                          >
                            <Camera className="w-4 h-4" />
                          </button>

                          {/* MENU DÉROULANT POUR LE RESTE (Historique, Reçu, Modifier, Supprimer...) */}
                          <StudentActionMenu
                            student={student}
                            onEdit={(s: Student) => { setEditingStudent(s); setShowModal(true); }}
                            onDelete={handleDelete}
                            onHistory={(s: Student) => { setSelectedStudent(s); setShowHistoryModal(true); }}
                            onWhatsApp={openWhatsApp}
                            onReceipt={(s: Student) => generateReceipt(s, settings)}
                            onCard={(s: Student) => generateStudentCard(s, settings)}
                          />

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
          onSave={handleSaveStudent}
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

      {/* Photo Modal */}
      {showPhotoModal && selectedStudent && (
        <PhotoModal
          student={selectedStudent}
          onClose={() => setShowPhotoModal(false)}
          onSave={async (photoBase64) => {
            const uploadedUrl = await uploadStudentPhoto(selectedStudent.id, photoBase64);
            updateStudent(selectedStudent.id, { photoUrl: uploadedUrl || photoBase64 });
            setShowPhotoModal(false);
          }}
          onDelete={() => {
            updateStudent(selectedStudent.id, { photoUrl: undefined });
            setShowPhotoModal(false);
          }}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && selectedStudent && (
        <HistoryModal
          student={selectedStudent}
          onClose={() => setShowHistoryModal(false)}
          onChangePhoto={() => {
            setShowHistoryModal(false);
            setShowPhotoModal(true);
          }}
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
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nom: student?.nom || '',
    prenom: student?.prenom || '',
    classe: student?.classe || 'CP1',
    telephone: student?.telephone || '',
    sexe: student?.sexe || 'M',
    redoublant: student?.redoublant || false,
    ecoleProvenance: student?.ecoleProvenance || '',
    dejaPaye: student?.dejaPaye || 0,
    adsn: student?.adsn || '',
    statutElv: student?.statutElv || 'NOUVEAU',
    dateNaissance: student?.dateNaissance || '',
    photoUrl: student?.photoUrl || ''
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(f => ({ ...f, photoUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

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
      recu: student?.recu || `REC-${Date.now()}`,
      photoUrl: formData.photoUrl || undefined
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

          {/* Photo passeport */}
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-24 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-400 transition bg-gray-50 flex-shrink-0"
              onClick={() => photoInputRef.current?.click()}
            >
              {formData.photoUrl ? (
                <img src={formData.photoUrl} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] text-center font-medium">Photo<br/>passeport</span>
                </div>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700">Photo passeport (optionnel)</p>
              <p>Format recommandé : JPG ou PNG, fond blanc.</p>
              <p>Cette photo apparaîtra sur le bulletin et la carte scolaire.</p>
              {formData.photoUrl && (
                <button
                  type="button"
                  onClick={() => setFormData(f => ({ ...f, photoUrl: '' }))}
                  className="text-red-500 hover:underline text-xs"
                >Supprimer la photo</button>
              )}
            </div>
          </div>

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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro ADSN</label>
              <input
                type="text"
                value={formData.adsn}
                onChange={(e) => setFormData({ ...formData, adsn: e.target.value })}
                placeholder="Ex: 123456"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Naissance</label>
              <input
                type="date"
                value={formData.dateNaissance}
                onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut Élève</label>
              <select
                value={formData.statutElv}
                onChange={(e) => setFormData({ ...formData, statutElv: e.target.value as 'NOUVEAU'|'ANCIEN'|'REDOUBLANT' })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="NOUVEAU">Nouveau</option>
                <option value="ANCIEN">Ancien</option>
                <option value="REDOUBLANT">Redoublant</option>
              </select>
            </div>
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

// ============================================================
// FICHE DÉTAILLÉE — Historique + Photo + Infos complètes
// ============================================================
const HistoryModal = ({ student, onClose, onChangePhoto }: {
  student: Student;
  onClose: () => void;
  onChangePhoto?: () => void;
}) => {
  const status = student.restant === 0 ? 'SOLDÉ' : `${((student.dejaPaye / (student.ecolage || 1)) * 100).toFixed(0)}%`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold">Fiche élève</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">

          {/* SECTION PHOTO + IDENTITÉ */}
          <div className="p-6 pb-0 flex gap-5 items-start">

            {/* Photo passeport */}
            <button
              onClick={onChangePhoto}
              className="relative group flex-shrink-0"
              title="Cliquer pour changer la photo"
            >
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt="Photo élève"
                  className="rounded-xl object-cover border-2 border-gray-200 shadow-md group-hover:opacity-80 transition"
                  style={{ width: 80, height: 100 }}
                />
              ) : (
                <div
                  className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-1 group-hover:border-teal-400 group-hover:bg-teal-50 transition"
                  style={{ width: 80, height: 100 }}
                >
                  <Camera className="w-7 h-7 text-gray-300 group-hover:text-teal-400 transition" />
                  <span className="text-[10px] text-gray-400 group-hover:text-teal-500 font-semibold text-center leading-tight px-1">Ajouter photo</span>
                </div>
              )}
              {/* Overlay au survol */}
              {student.photoUrl && (
                <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
              {/* Badge vert si photo */}
              {student.photoUrl && (
                <div className="absolute -bottom-1 -right-1 bg-teal-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">📸</div>
              )}
            </button>

            {/* Infos identité */}
            <div className="flex-1">
              <h3 className="text-xl font-black text-gray-900">{student.nom} {student.prenom}</h3>
              <p className="text-sm text-gray-500 font-medium">{student.classe} • {student.sexe === 'M' ? 'Masculin' : 'Féminin'}{student.redoublant ? ' • Redoublant' : ''}</p>
              {student.dateNaissance && <p className="text-xs text-gray-400 mt-0.5">Né(e) le {student.dateNaissance}</p>}
              {student.adsn && <p className="text-xs text-gray-400">Matricule : <span className="font-bold text-gray-600">{student.adsn}</span></p>}
              {student.telephone && <p className="text-xs text-gray-400">Tél. parent : <span className="font-bold text-gray-600">{student.telephone}</span></p>}
              {student.ecoleProvenance && <p className="text-xs text-gray-400">Provenance : {student.ecoleProvenance}</p>}
              {!student.photoUrl && (
                <button
                  onClick={onChangePhoto}
                  className="mt-2 text-xs font-semibold text-teal-600 hover:text-teal-500 flex items-center gap-1"
                >
                  <Camera className="w-3 h-3" /> Assigner une photo passeport
                </button>
              )}
            </div>
          </div>

          {/* SECTION SCOLARITÉ */}
          <div className="px-6 pt-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-3">Scolarité</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Écolage</p>
                  <p className="font-bold text-gray-800">{formatMontant(student.ecolage)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Payé</p>
                  <p className="font-bold text-green-600">{formatMontant(student.dejaPaye)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Restant</p>
                  <p className={`font-bold ${student.restant === 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {student.restant === 0 ? 'SOLDÉ' : formatMontant(student.restant)}
                  </p>
                </div>
              </div>
              {/* Barre de progression */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progression paiement</span>
                  <span className="font-bold">{status}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (student.dejaPaye / (student.ecolage || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION HISTORIQUE */}
          <div className="px-6 pt-4 pb-6">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Historique des paiements</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {!student.paiements || student.paiements.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">Aucun paiement enregistré</p>
              ) : (
                student.paiements.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-bold text-green-600 text-sm">{formatMontant(p.montant)}</p>
                      <p className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString('fr-FR')} • {p.methode}</p>
                      {p.reference && <p className="text-xs text-gray-400">Réf: {p.reference}</p>}
                    </div>
                    <span className="text-xs text-gray-300 font-bold">#{i + 1}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};


// ============================================================
// PHOTO MODAL — Assigner / modifier la photo passeport d'un élève
// ============================================================
interface PhotoModalProps {
  student: Student;
  onClose: () => void;
  onSave: (photoBase64: string) => Promise<void>;
  onDelete: () => void;
}

const PhotoModal = ({ student, onClose, onSave, onDelete }: PhotoModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(student.photoUrl || '');
  const [saving, setSaving] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview || !preview.startsWith('data:image')) return;
    setSaving(true);
    try { await onSave(preview); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Photo passeport</h2>
            <p className="text-sm text-gray-500">{student.nom} {student.prenom} — {student.classe}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">

          {/* Zone prévisualisation / upload */}
          <div
            onClick={() => inputRef.current?.click()}
            className="relative mx-auto cursor-pointer group"
            style={{ width: 180, height: 210 }}
          >
            {preview ? (
              <>
                <img
                  src={preview}
                  alt="Aperçu"
                  className="w-full h-full object-cover rounded-xl border-2 border-teal-400 shadow-md"
                />
                {/* Overlay au survol */}
                <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                  <Camera className="w-8 h-8 text-white" />
                  <span className="text-white text-sm font-semibold">Changer</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3 hover:border-teal-400 hover:bg-teal-50 transition">
                <Camera className="w-10 h-10 text-gray-300 group-hover:text-teal-400 transition" />
                <div className="text-center px-4">
                  <p className="text-sm font-semibold text-gray-500">Cliquer pour choisir</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG • Fond blanc recommandé</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          <p className="text-center text-xs text-gray-400">
            La photo apparaîtra sur le bulletin scolaire et la carte d'identité scolaire.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          {preview && preview.startsWith('data:image') && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-300 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Enregistrer la photo
                </>
              )}
            </button>
          )}
          {student.photoUrl && (
            <button
              onClick={onDelete}
              className="w-full py-2 text-red-500 hover:bg-red-50 font-medium text-sm rounded-xl transition"
            >
              Supprimer la photo
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 hover:bg-gray-50 text-sm rounded-xl transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

