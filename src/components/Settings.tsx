import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Save, School, FileText, Bell, Percent } from 'lucide-react';

export const Settings = () => {
  const { settings, updateSettings, user } = useStore();
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
          <p className="font-semibold">Accès refusé</p>
          <p className="text-sm mt-1">Seuls les administrateurs peuvent accéder aux paramètres.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-500">Configuration de l'application</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de l'école */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600" />
            Informations de l'école
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'école
              </label>
              <input
                type="text"
                value={formData.nomEcole}
                onChange={(e) => setFormData({ ...formData, nomEcole: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année scolaire
              </label>
              <input
                type="text"
                value={formData.anneScolaire}
                onChange={(e) => setFormData({ ...formData, anneScolaire: e.target.value })}
                placeholder="2024-2025"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <input
                type="text"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Messages personnalisés */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Messages personnalisés pour PDF
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Message de remerciement (élèves soldés)
                </span>
              </label>
              <textarea
                rows={3}
                value={formData.messageRemerciement}
                onChange={(e) => setFormData({ ...formData, messageRemerciement: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Message de rappel (élèves non soldés)
                </span>
              </label>
              <textarea
                rows={3}
                value={formData.messageRappel}
                onChange={(e) => setFormData({ ...formData, messageRappel: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Paramètres de paiement */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-purple-600" />
            Paramètres de paiement
          </h2>
          
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seuil de validation 2ème tranche (%)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Pourcentage minimum payé pour valider la 2ème tranche
            </p>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max="100"
                value={formData.seuilDeuxiemeTranche}
                onChange={(e) => setFormData({ ...formData, seuilDeuxiemeTranche: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="font-bold text-lg text-purple-600 w-16 text-right">
                {formData.seuilDeuxiemeTranche}%
              </span>
            </div>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Règle actuelle:</strong> Un élève ayant payé ≥{formData.seuilDeuxiemeTranche}% de son écolage 
                obtient le badge "2ème Tranche Validée" sur son reçu.
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            Informations sur les tarifs
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Primaire</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>CP1, CP2, CE1, CE2, CM1: <strong>50 000 FCFA</strong></li>
                <li>CI, CI 1, CI 2, CM2: <strong>55 000 FCFA</strong></li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Collège</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>6EME, 5EME, 4EME: <strong>60 000 FCFA</strong></li>
                <li>3EME: <strong>70 000 FCFA</strong></li>
              </ul>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Lycée</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>2nde S, 2nde A4: <strong>75 000 FCFA</strong></li>
                <li>1er A4, 1er D: <strong>85 000 FCFA</strong></li>
                <li>Tle A4, Tle D: <strong>95 000 FCFA</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end gap-4">
          {saved && (
            <p className="text-green-600 font-medium py-2">
              ✓ Paramètres enregistrés !
            </p>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
          >
            <Save className="w-5 h-5" />
            Enregistrer les paramètres
          </button>
        </div>
      </form>
    </div>
  );
};
