// ============================================================
// STORE ZUSTAND — État global de l'application
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, User, AppPage, Payment, Parent } from '../types';
import { API_BASE_URL } from '../config';
import { getEcolage, getCycle } from '../data/classConfig';
import { v4 as uuid } from '../utils/uuid';

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
          return true;
        }

        return false;
      },
      logout: () => {
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
        set({ students: [...get().students, student] });
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
        set({ students });
      },
      deleteStudent: (id) =>
        set({ students: get().students.filter((s) => s.id !== id) }),
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
        set({ students });
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
