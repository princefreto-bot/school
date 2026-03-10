// ============================================================
// STORE ZUSTAND — État global de l'application
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, User, AppPage, Payment, Parent, AppSettings, Presence, ActivityLog } from '../types';
import { API_BASE_URL } from '../config';
import { getEcolage, getCycle } from '../data/classConfig';
import { v4 as uuid } from '../utils/uuid';
import { createActivityLog } from '../utils/activityLogger';

export interface AppState {
  // Identité de l'app
  appName: string;
  setAppName: (name: string) => void;
  schoolLogo: string | null;        // base64 de l'image PNG
  setSchoolLogo: (logo: string | null) => void;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  connectedParentsCount: number;
  setConnectedParentsCount: (count: number) => void;
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
  fetchUnreadMessages: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Navigation
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;

  // Élèves
  students: Student[];
  setStudents: (students: Student[]) => void;
  addStudent: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'cycle' | 'status' | 'restant' | 'historiquesPaiements' | 'ecolage'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addPayment: (studentId: string, payment: Omit<Payment, 'id' | 'studentId'>) => void;

  // Parents
  parents: Parent[];
  setParents: (parents: Parent[]) => void;

  // UI
  selectedStudent: Student | null;
  setSelectedStudent: (student: Student | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterClasse: string;
  setFilterClasse: (c: string) => void;
  filterCycle: string;
  setFilterCycle: (c: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;

  // Paramètres
  schoolName: string;
  setSchoolName: (name: string) => void;
  schoolYear: string;
  setSchoolYear: (year: string) => void;
  messageRemerciement: string;
  setMessageRemerciement: (m: string) => void;
  messageRappel: string;
  setMessageRappel: (m: string) => void;
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;

  // Présences
  presences: Presence[];
  addPresence: (presence: Presence) => void;
  getPresencesToday: () => Presence[];
  isAlreadyPresent: (eleveId: string) => boolean;

  // Logs d'activité
  activityLogs: ActivityLog[];
  addActivityLog: (log: ActivityLog) => void;

  // Reçus vérifiables
  receiptCounter: number;
  incrementReceiptCounter: () => string;

  // Synchronisation Cloud
  links: any[];
  setLinks: (links: any[]) => void;
  fetchAllFromBackend: () => Promise<void>;
  isSyncing: boolean;
  setIsSyncing: (s: boolean) => void;
  clearCloudPresences: () => Promise<boolean>;
  clearCloudActivityLogs: () => Promise<boolean>;
}

// Authentification gérée par Supabase

const computeStatus = (restant: number, ecolage: number) => {
  if (restant <= 0) return 'Soldé' as const;
  const paye = ecolage - restant;
  const taux = paye / ecolage;
  if (taux >= 0.7) return 'Partiel' as const;
  return 'Non soldé' as const;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Identité ─────────────────────────────────────────
      appName: 'EduFinance',
      setAppName: (name) => set({ appName: name }),
      schoolLogo: null,
      setSchoolLogo: (logo) => set({ schoolLogo: logo }),

      // ── Auth ──────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      connectedParentsCount: 0,
      setConnectedParentsCount: (count) => set({ connectedParentsCount: count }),
      unreadMessages: 0,
      setUnreadMessages: (count) => set({ unreadMessages: count }),
      fetchUnreadMessages: async () => {
        try {
          const { chatApi } = await import('../services/chatApi');
          const count = await chatApi.getUnreadCount();
          set({ unreadMessages: count });
        } catch (err) {
          console.error('Failed to fetch unread messages:', err);
        }
      },
      login: async (username, password) => {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telephone: username, password })
          });

          // parse with same helper as other services
          const text = await res.text();
          let result: any;
          try {
            result = JSON.parse(text);
          } catch (parseErr) {
            console.error('Login response not JSON:', text);
            throw new Error('Réponse API invalide');
          }

          if (res.ok && result.token) {
            localStorage.setItem('parent_token', result.token);
            const loggedUser: User = {
              id: result.user.id,
              username: result.user.telephone,
              role: result.user.role,
              nom: result.user.nom,
              telephone: result.user.telephone
            };

            // Déterminer la page de redirection
            let targetPage: AppPage = 'dashboard';
            if (loggedUser.role === 'parent') targetPage = 'parent_dashboard';

            set({ user: loggedUser, isAuthenticated: true, currentPage: targetPage });
            get().addActivityLog(createActivityLog(loggedUser.nom, loggedUser.role, 'connexion', 'Connexion API réussie'));

            // Sync data immediately after login
            get().fetchAllFromBackend();

            return true;
          }

          // if we reached this point, login failed on server
        } catch (err) {
          console.error("Erreur login backend, essai local...", err);
        }

        // Fallback local pour admin classique si serveur off (debug)
        if (username === 'admin' && password === 'admin123') {
          const loggedUser: User = { id: 'admin', username: 'admin', role: 'admin', nom: 'Admin Local' };
          // On essaie de garder un token générique pour les appels API locaux si besoin
          set({ user: loggedUser, isAuthenticated: true, currentPage: 'dashboard' });
          get().addActivityLog(createActivityLog('Admin Local', 'admin', 'connexion', 'Connexion locale réussie'));
          return true;
        }

        return false;
      },
      logout: () => {
        const u = get().user;
        if (u) {
          get().addActivityLog(createActivityLog(u.nom, u.role, 'connexion', 'Déconnexion'));
        }
        localStorage.removeItem('parent_token');
        set({ user: null, isAuthenticated: false, currentPage: 'dashboard' });
      },

      // ── Navigation ───────────────────────────────────────
      currentPage: 'dashboard',
      setCurrentPage: (page) => set({ currentPage: page }),

      // ── Élèves ───────────────────────────────────────────
      students: [],
      setStudents: (students) => set({ students }),
      addStudent: (data) => {
        const ecolage = getEcolage((data as { classe: string }).classe);
        const restant = ecolage - ((data as { dejaPaye?: number }).dejaPaye || 0);
        const studentId = `${data.nom}_${data.prenom}_${data.classe}`.toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_');

        const student: Student = {
          ...data,
          id: studentId,
          ecolage,
          restant,
          cycle: getCycle(data.classe),
          status: computeStatus(restant, ecolage),
          historiquesPaiements: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const u = get().user;
        if (u) get().addActivityLog(createActivityLog(u.nom, u.role, 'autre', `Ajout de l'élève : ${data.prenom} ${data.nom}`));

        set({ students: [...get().students, student] });

        // Background sync
        import('../services/backendSync').then(({ syncToBackend }) => {
          syncToBackend({
            students: get().students,
            presences: get().presences,
            activityLogs: get().activityLogs
          });
        });
      },
      updateStudent: (id, updates) => {
        const students = get().students.map((s) => {
          if (s.id !== id) return s;
          const updated = { ...s, ...updates, updatedAt: new Date().toISOString() };
          if (updates.classe) {
            updated.ecolage = getEcolage(updates.classe);
            updated.cycle = getCycle(updates.classe);
          }
          if (updates.dejaPaye !== undefined || updates.classe) {
            updated.restant = updated.ecolage - updated.dejaPaye;
          }
          updated.status = computeStatus(updated.restant, updated.ecolage);
          return updated;
        });

        const u = get().user;
        if (u) {
          const student = get().students.find(s => s.id === id);
          get().addActivityLog(createActivityLog(u.nom, u.role, 'modification_eleve', `Modification : ${student ? student.prenom + ' ' + student.nom : id}`));
        }

        set({ students });

        // Background sync
        import('../services/backendSync').then(({ syncToBackend }) => {
          syncToBackend({
            students: get().students,
            presences: get().presences,
            activityLogs: get().activityLogs
          });
        });
      },
      deleteStudent: (id) => {
        const u = get().user;
        if (u) {
          const student = get().students.find(s => s.id === id);
          get().addActivityLog(createActivityLog(u.nom, u.role, 'suppression', `Suppression : ${student ? student.prenom + ' ' + student.nom : id}`));
        }
        set({ students: get().students.filter((s) => s.id !== id) });

        // Background sync
        import('../services/backendSync').then(({ syncToBackend }) => {
          syncToBackend({
            students: get().students,
            presences: get().presences,
            activityLogs: get().activityLogs
          });
        });
      },
      addPayment: (studentId, paymentData) => {
        const students = get().students.map((s) => {
          if (s.id !== studentId) return s;
          const payment: Payment = { id: uuid(), studentId, ...paymentData };
          const newDejaPaye = s.dejaPaye + paymentData.montant;
          const newRestant = Math.max(0, s.ecolage - newDejaPaye);
          return {
            ...s,
            dejaPaye: newDejaPaye,
            restant: newRestant,
            status: computeStatus(newRestant, s.ecolage),
            historiquesPaiements: [...s.historiquesPaiements, payment],
            updatedAt: new Date().toISOString(),
          };
        });

        const u = get().user;
        if (u) {
          const student = get().students.find(s => s.id === studentId);
          get().addActivityLog(createActivityLog(u.nom, u.role, 'paiement', `Paiement : ${paymentData.montant} FCFA pour ${student ? student.prenom + ' ' + student.nom : studentId}`));
        }

        set({ students });

        // Background sync
        import('../services/backendSync').then(({ syncToBackend }) => {
          syncToBackend({
            students: get().students,
            presences: get().presences,
            activityLogs: get().activityLogs
          });
        });
      },

      // ── Parents ──────────────────────────────────────────
      parents: [],
      setParents: (parents) => set({ parents }),

      // ── UI ───────────────────────────────────────────────
      selectedStudent: null,
      setSelectedStudent: (student) => set({ selectedStudent: student }),
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      filterClasse: '',
      setFilterClasse: (c) => set({ filterClasse: c }),
      filterCycle: '',
      setFilterCycle: (c) => set({ filterCycle: c }),
      filterStatus: '',
      setFilterStatus: (s) => set({ filterStatus: s }),

      // ── Paramètres ───────────────────────────────────────
      schoolName: 'Établissement Scolaire',
      setSchoolName: (name) => set({ schoolName: name }),
      schoolYear: '2024-2025',
      setSchoolYear: (year) => set({ schoolYear: year }),
      messageRemerciement:
        "Nous vous remercions sincèrement pour votre ponctualité dans le règlement de la scolarité. Votre soutien contribue au bon fonctionnement de notre établissement.",
      setMessageRemerciement: (m) => set({ messageRemerciement: m }),
      messageRappel:
        "Nous vous rappelons cordialement que le règlement du solde de scolarité est attendu. Veuillez régulariser votre situation dans les meilleurs délais.",
      setMessageRappel: (m) => set({ messageRappel: m }),
      settings: {
        seuilDeuxiemeTranche: 70,
        schoolName: 'Établissement Scolaire',
        schoolYear: '2024-2025',
        messageRemerciement: "Nous vous remercions sincèrement pour votre ponctualité dans le règlement de la scolarité. Votre soutien contribue au bon fonctionnement de notre établissement.",
        messageRappel: "Nous vous rappelons cordialement que le règlement du solde de scolarité est attendu. Veuillez régulariser votre situation dans les meilleurs délais.",
        currency: 'FCFA',
        nomEcole: 'Établissement Scolaire',
        anneScolaire: '2024-2025',
        adresse: 'Adresse de l\'établissement',
        telephone: '+229 XX XX XX XX',
        email: 'contact@ecole.ci',
        badgeParentResponsable: 'Parent Responsable',
        badge2emeTranche: '2ème Tranche Validée'
      },
      updateSettings: (newSettings) => set({ settings: newSettings }),

      // ── Présences ─────────────────────────────────────────
      presences: [],
      addPresence: (presence) => {
        set({ presences: [presence, ...get().presences] });
        // Background sync
        import('../services/backendSync').then(({ syncToBackend }) => {
          syncToBackend({
            students: get().students,
            presences: get().presences,
            activityLogs: get().activityLogs
          });
        });
      },
      getPresencesToday: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().presences.filter(p => p.date === today);
      },
      isAlreadyPresent: (eleveId: string) => {
        const today = new Date().toISOString().split('T')[0];
        return get().presences.some(p => p.eleveId === eleveId && p.date === today);
      },

      // ── Logs d'activité ────────────────────────────────────
      activityLogs: [],
      addActivityLog: (log) => set({ activityLogs: [log, ...get().activityLogs].slice(0, 500) }),

      // ── Compteur reçus ─────────────────────────────────────
      receiptCounter: 0,
      incrementReceiptCounter: () => {
        const next = get().receiptCounter + 1;
        const year = new Date().getFullYear();
        const code = `REC-${year}-${String(next).padStart(6, '0')}`;
        set({ receiptCounter: next });
        return code;
      },

      // ── Synchronisation Cloud ───────────────────────────
      links: [],
      setLinks: (links) => set({ links }),
      isSyncing: false,
      setIsSyncing: (s) => set({ isSyncing: s }),
      fetchAllFromBackend: async () => {
        const user = get().user;
        if (!user || user.role === 'parent') return; // parents use parentApi, not bulk sync

        set({ isSyncing: true });
        try {
          const { fetchFromBackend } = await import('../services/backendSync');
          const data = await fetchFromBackend();

          if (data && Array.isArray(data.students)) {
            // Priority to cloud data if it is not empty, 
            // OR if local data is empty (new device)
            const hasCloudStudents = data.students.length > 0;
            const hasLocalStudents = get().students.length > 0;

            if (hasCloudStudents || !hasLocalStudents) {
              set({
                students: data.students,
                presences: data.presences || [],
                activityLogs: data.activityLogs || [],
                links: data.links || []
              });
              console.log(`✅ Cloud data synchronized: ${data.students.length} students loaded.`);
            }
          }
        } catch (err) {
          console.error('Failed to sync from cloud:', err);
        } finally {
          set({ isSyncing: false });
        }
      },
      clearCloudPresences: async () => {
        try {
          const { getAuthHeaders } = await import('../services/apiHelpers');
          const res = await fetch(`${API_BASE_URL}/sync/presences`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          if (res.ok) {
            set({ presences: [] });
            return true;
          }
          return false;
        } catch (err) {
          console.error('Failed to clear presences:', err);
          return false;
        }
      },
      clearCloudActivityLogs: async () => {
        try {
          const { getAuthHeaders } = await import('../services/apiHelpers');
          const res = await fetch(`${API_BASE_URL}/sync/logs`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          if (res.ok) {
            set({ activityLogs: [] });
            return true;
          }
          return false;
        } catch (err) {
          console.error('Failed to clear logs:', err);
          return false;
        }
      }
    }),
    {
      name: 'edufinance-storage',
      partialize: (state) => ({
        students: state.students,
        schoolName: state.schoolName,
        schoolYear: state.schoolYear,
        messageRemerciement: state.messageRemerciement,
        messageRappel: state.messageRappel,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        appName: state.appName,
        schoolLogo: state.schoolLogo,
        parents: state.parents || [],
        presences: state.presences || [],
        activityLogs: (state.activityLogs || []).slice(0, 500),
        receiptCounter: state.receiptCounter || 0,
      }),
      onRehydrateStorage: () => (state) => {
        // Auto-réparation : recalcule cycle + écolage + restant + status
        // pour corriger les données importées avec une ancienne normalisation
        if (state && state.students.length > 0) {
          const repaired = state.students.map((s) => {
            const correctCycle = getCycle(s.classe);
            const correctEcolage = getEcolage(s.classe);
            const correctRestant = Math.max(0, correctEcolage - s.dejaPaye);
            const correctStatus = computeStatus(correctRestant, correctEcolage);
            if (s.cycle !== correctCycle || s.ecolage !== correctEcolage) {
              return {
                ...s,
                cycle: correctCycle,
                ecolage: correctEcolage,
                restant: correctRestant,
                status: correctStatus,
              };
            }
            return s;
          });
          state.students = repaired;

        }
      },
    }
  )
);
