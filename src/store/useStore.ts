// ============================================================
// STORE ZUSTAND — État global de l'application
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, User, AppPage, Payment, Parent, AppSettings, Presence, ActivityLog, CycleSchedule, Announcement, AnnouncementRead, Matiere, ClasseMatiere, Note, PeriodeType } from '../types';
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
  schoolStamp: string | null;       // Sceau de l'école
  setSchoolStamp: (stamp: string | null) => void;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  connectedParentsCount: number;
  setConnectedParentsCount: (count: number) => void;
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
  fetchUnreadMessages: () => Promise<void>;
  login: (username: string, password: string, schoolSlug?: string) => Promise<boolean>;
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
  updateAllSettings: (settings: {
    appName?: string,
    schoolName?: string,
    schoolYear?: string,
    schoolLogo?: string | null,
    schoolStamp?: string | null,
    messageRemerciement?: string,
    messageRappel?: string
  }) => Promise<void>;
  settings: AppSettings;
  updateSettings: (settings: AppSettings) => void;

  // Présences
  presences: Presence[];
  addPresence: (presence: Presence) => void;
  getPresencesToday: () => Presence[];
  getSortiesToday: () => Presence[];
  isAlreadyPresent: (eleveId: string) => boolean;
  hasAlreadyExited: (eleveId: string) => boolean;

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
  lastSyncTimestamp: number;
  setLastSyncTimestamp: (t: number) => void;
  clearCloudPresences: () => Promise<boolean>;
  clearCloudActivityLogs: () => Promise<boolean>;
  clearCloudStudents: () => Promise<boolean>;
  fetchPublicSettings: () => Promise<void>;

  // Horaires par cycle
  cycleSchedules: CycleSchedule[];
  setCycleSchedules: (schedules: CycleSchedule[]) => void;
  getHeureLimite: (cycle: string) => string;

  // Annonces
  announcements: Announcement[];
  addAnnouncement: (a: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  announcementReads: AnnouncementRead[];
  markAnnouncementRead: (announcementId: string, parentId: string) => void;
  remindAnnouncementLater: (announcementId: string, parentId: string) => void;
  getUnreadAnnouncements: (parentId: string, classes?: string[]) => Announcement[];

  // ── MODULE 2 : ACADÉMIQUE & NOTES ──
  currentPeriode: PeriodeType;
  setCurrentPeriode: (p: PeriodeType) => void;
  matieres: Matiere[];
  setMatieres: (m: Matiere[]) => void;
  addMatiere: (m: Matiere) => void;
  updateMatiere: (id: string, m: Partial<Matiere>) => void;
  deleteMatiere: (id: string) => void;

  classeMatieres: ClasseMatiere[];
  setClasseMatieres: (cm: ClasseMatiere[]) => void;
  addClasseMatiere: (cm: ClasseMatiere) => void;
  updateClasseMatiere: (id: string, cm: Partial<ClasseMatiere>) => void;
  deleteClasseMatiere: (id: string) => void;

  notes: Note[];
  setNotes: (n: Note[]) => void;
  upsertNote: (note: Note) => void;
  upsertNotes: (notes: Note[]) => void;
  deleteNote: (id: string) => void;

  // Thème
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;
  lastReportMonth: string | null;
  setLastReportMonth: (month: string) => void;
}

// Authentification gérée par Supabase

const computeStatus = (restant: number, ecolage: number) => {
  if (restant <= 0) return 'Soldé' as const;
  const paye = ecolage - restant;
  const taux = paye / ecolage;
  if (taux >= 0.7) return 'Partiel' as const;
  return 'Non soldé' as const;
};

// Déduplication des élèves (Nom + Prénom + Classe)
const deduplicateStudents = (list: Student[]): Student[] => {
  const seen = new Map<string, Student>();
  list.forEach(s => {
    // Clé unique basée sur l'identité (normalisée)
    const key = `${(s.nom || '').trim()} ${(s.prenom || '').trim()} ${(s.classe || '').trim()}`.toUpperCase();
    if (!seen.has(key)) {
      seen.set(key, s);
    } else {
      // Si doublon, on garde celui qui a le plus de paiements ou le plus récent
      const existing = seen.get(key)!;
      const existingPaiements = existing.historiquesPaiements?.length || 0;
      const currentPaiements = s.historiquesPaiements?.length || 0;
      if (currentPaiements > existingPaiements) {
        seen.set(key, s);
      }
    }
  });
  return Array.from(seen.values());
};

// Réparation des données (cycle, écolage, restant, status)
const repairStudent = (s: Student): Student => {
  const correctCycle = getCycle(s.classe);
  const correctEcolage = getEcolage(s.classe);
  const correctRestant = Math.max(0, correctEcolage - s.dejaPaye);
  const correctStatus = computeStatus(correctRestant, correctEcolage);

  if (s.cycle !== correctCycle || s.ecolage !== correctEcolage || s.restant !== correctRestant || s.status !== correctStatus) {
    return {
      ...s,
      cycle: correctCycle,
      ecolage: correctEcolage,
      restant: correctRestant,
      status: correctStatus,
      updatedAt: new Date().toISOString()
    };
  }
  return s;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Identité ─────────────────────────────────────────
      appName: 'EduFinance',
      setAppName: (name) => set({ appName: name }),
      schoolLogo: null,
      setSchoolLogo: (logo) => set({ schoolLogo: logo }),
      schoolStamp: null,
      setSchoolStamp: (stamp) => set({ schoolStamp: stamp }),

      // ── Thème ──────────────────────────────────────────
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      lastReportMonth: null,
      setLastReportMonth: (lastReportMonth) => set({ lastReportMonth }),

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
      login: async (username, password, schoolSlug) => {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telephone: username, password, schoolSlug })
          });

          const text = await res.text();
          let result: any;
          try {
            result = JSON.parse(text);
          } catch (parseErr) {
            console.error('Login response not JSON:', text);
            throw new Error('Réponse API invalide');
          }

          // Gérer les erreurs spécifiques multi-tenant
          if (res.status === 402 && result.error === 'trial_expired') {
            throw new Error(`TRIAL_EXPIRED:${result.school_name || 'votre école'}`);
          }
          if (res.status === 403) {
            throw new Error(result.error || 'Accès refusé.');
          }

          if (res.ok && result.token) {
            localStorage.setItem('parent_token', result.token);
            const loggedUser: User = {
              id: result.user.id,
              username: result.user.telephone,
              role: result.user.role,
              nom: result.user.nom,
              telephone: result.user.telephone,
              // ⚡ Informations multi-tenant
              schoolSlug: result.user.school_slug || undefined,
              schoolName: result.user.school_name || undefined,
            };

            // Déterminer la page de redirection selon le rôle
            let targetPage: AppPage = 'dashboard';
            if (loggedUser.role === 'superadmin') targetPage = 'superadmin_dashboard';
            else if (loggedUser.role === 'parent') targetPage = 'parent_dashboard';
            else if (loggedUser.role === 'superviseur') targetPage = 'scan_presence';

            // Si l'école est en période d'essai, stocker la date de fin
            if (result.user.trial_ends_at) {
              localStorage.setItem('trial_ends_at', result.user.trial_ends_at);
              localStorage.setItem('school_status', result.user.school_status || 'trial');
            }

            // ⚠️ CRITIQUE : Vider intégralement le cache local de l'école précédente 
            // pour garantir une architecture SaaS 100% isolée.
            set({
              students: [],
              parents: [],
              presences: [],
              activityLogs: [],
              links: [],
              announcements: [],
              announcementReads: [],
              matieres: [],
              classeMatieres: [],
              notes: [],
              schoolLogo: null,
              schoolStamp: null,
              schoolName: 'Établissement',
            });

            set({ user: loggedUser, isAuthenticated: true, currentPage: targetPage });
            get().addActivityLog(createActivityLog(loggedUser.nom, loggedUser.role, 'connexion', 'Connexion API réussie'));
            if (loggedUser.role !== 'superadmin') get().fetchAllFromBackend();
            return true;
          }
        } catch (err: any) {
          // Re-lancer les erreurs spécifiques pour les afficher à l'utilisateur
          if (err.message?.startsWith('TRIAL_EXPIRED:') || err.message?.includes('suspendu') || err.message?.includes('Accès')) {
            throw err;
          }
          console.error("Erreur login backend, essai local...", err);
        }

        // Fallback local
        if (username === 'admin' && password === 'admin123') {
          const loggedUser: User = { id: 'admin', username: 'admin', role: 'admin', nom: 'Admin Local' };
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
        set({
          user: null, 
          isAuthenticated: false, 
          currentPage: 'dashboard',
          students: [],
          parents: [],
          presences: [],
          activityLogs: [],
          links: [],
          announcements: [],
          announcementReads: [],
          matieres: [],
          classeMatieres: [],
          notes: []
        });
      },

      // ── Navigation ───────────────────────────────────────
      currentPage: 'dashboard',
      setCurrentPage: (page) => {
        const u = get().user;
        // SuperAdmin : accès uniquement aux pages superadmin
        if (u?.role === 'superadmin') {
          const allowed: AppPage[] = ['superadmin_dashboard', 'superadmin_schools', 'superadmin_billing'];
          if (!allowed.includes(page)) {
            set({ currentPage: 'superadmin_dashboard' });
            return;
          }
        } else if (u?.role === 'parent') {
          const allowed: AppPage[] = ['parent_dashboard', 'parent_historique', 'parent_recus', 'parent_badges', 'chat', 'annonces'];
          if (!allowed.includes(page)) {
            set({ currentPage: 'parent_dashboard' });
            return;
          }
        } else if (u?.role === 'superviseur') {
          const allowed: AppPage[] = ['scan_presence', 'scan_sortie', 'carte_scolaire'];
          if (!allowed.includes(page)) {
            set({ currentPage: 'scan_presence' });
            return;
          }
        }
        set({ currentPage: page });
      },

      // ── Élèves ───────────────────────────────────────────
      students: [],
      setStudents: (students) => set({ students: deduplicateStudents(students.map(repairStudent)) }),
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
          }).then(() => set({ lastSyncTimestamp: Date.now() }));
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
          }).then(() => set({ lastSyncTimestamp: Date.now() }));
        });
      },
      deleteStudent: async (id) => {
        const u = get().user;
        if (u) {
          const student = get().students.find(s => s.id === id);
          get().addActivityLog(createActivityLog(u.nom, u.role, 'suppression', `Suppression : ${student ? student.prenom + ' ' + student.nom : id}`));
        }
        set({
          students: get().students.filter((s) => s.id !== id),
          lastSyncTimestamp: Date.now() // Bloque le polling entrant pendant 60s
        });

        try {
          const { getAuthHeaders } = await import('../services/apiHelpers');
          await fetch(`${API_BASE_URL}/sync/student/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
        } catch (err) {
          console.error('Failed to delete student from cloud:', err);
        }
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
          }).then(() => set({ lastSyncTimestamp: Date.now() }));
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

      updateAllSettings: async (newSettings) => {
        console.log('💾 [Store] Saving all settings to cloud...', Object.keys(newSettings));
        set(newSettings);
        try {
          const { syncToBackend } = await import('../services/backendSync');
          const result = await syncToBackend(get());
          if (result) {
            console.log('✅ [Store] All settings synced successfully!');
          }
        } catch (err) {
          console.error('❌ [Store] Error syncing settings:', err);
        }
      },
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
          }).then(() => set({ lastSyncTimestamp: Date.now() }));
        });
      },
      getPresencesToday: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().presences.filter(p => p.date === today && (p.type === 'ENTREE' || !p.type));
      },
      getSortiesToday: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().presences.filter(p => p.date === today && p.type === 'SORTIE');
      },
      isAlreadyPresent: (eleveId: string) => {
        const today = new Date().toISOString().split('T')[0];
        return get().presences.some(p => p.eleveId === eleveId && p.date === today && (p.type === 'ENTREE' || !p.type));
      },
      hasAlreadyExited: (eleveId: string) => {
        const today = new Date().toISOString().split('T')[0];
        return get().presences.some(p => p.eleveId === eleveId && p.date === today && p.type === 'SORTIE');
      },

      // ── Horaires par cycle ──────────────────────────────────
      cycleSchedules: [
        { cycle: 'Primaire', heureLimite: '07:30' },
        { cycle: 'Collège', heureLimite: '07:45' },
        { cycle: 'Lycée', heureLimite: '08:00' },
      ],
      setCycleSchedules: (schedules) => {
        set({ cycleSchedules: schedules });
        // Sync to backend
        import('../services/backendSync').then(({ syncToBackend }) => {
          syncToBackend(get()).then(() => set({ lastSyncTimestamp: Date.now() }));
        });
      },
      getHeureLimite: (cycle: string) => {
        const schedule = get().cycleSchedules.find(s => s.cycle === cycle);
        return schedule?.heureLimite || '08:00';
      },

      // ── Annonces ────────────────────────────────────────────
      announcements: [],
      addAnnouncement: async (data) => {
        const announcement: Announcement = {
          ...data,
          id: uuid(),
          createdAt: new Date().toISOString(),
        };
        // Mise à jour locale immédiate
        set({ announcements: [announcement, ...get().announcements] });

        // Appel backend dédié → sauvegarde Supabase + Push à tous les parents
        try {
          const { BACKEND_URL } = await import('../config');
          const { getAuthHeaders } = await import('../services/apiHelpers');
          const res = await fetch(`${BACKEND_URL}/api/announcements`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              id: announcement.id,
              titre: announcement.titre,
              message: announcement.message,
              cible: announcement.cible,
              importance: announcement.importance,
              createdBy: announcement.createdBy,
              createdAt: announcement.createdAt,
            }),
          });
          const result = await res.json();
          if (result.success) {
            console.log(`✅ Annonce publiée : ${result.notificationsSent}/${result.totalParents} notifications push envoyées`);
          } else {
            console.warn('⚠️ Problème publication annonce:', result.error);
          }
        } catch (err) {
          console.error('❌ Erreur envoi annonce backend:', err);
        }

        // Sync global pour garder la cohérence
        import('../services/backendSync').then(({ syncToBackend }) => {
          syncToBackend(get()).then(() => set({ lastSyncTimestamp: Date.now() }));
        });
      },
      deleteAnnouncement: async (id) => {
        set({
          announcements: get().announcements.filter(a => a.id !== id),
          announcementReads: get().announcementReads.filter(r => r.announcementId !== id),
        });
        set({ lastSyncTimestamp: Date.now() }); // Bloque le polling entrant
        try {
          const { BACKEND_URL } = await import('../config');
          const { getAuthHeaders } = await import('../services/apiHelpers');
          await fetch(`${BACKEND_URL}/api/announcements/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
        } catch (err) {
          console.error('❌ Erreur suppression annonce backend:', err);
        }
      },
      announcementReads: [],
      markAnnouncementRead: (announcementId, parentId) => {
        const existing = get().announcementReads.find(
          r => r.announcementId === announcementId && r.parentId === parentId
        );
        if (existing) {
          // Mettre à jour
          set({
            announcementReads: get().announcementReads.map(r =>
              r.announcementId === announcementId && r.parentId === parentId
                ? { ...r, readAt: new Date().toISOString(), remindAt: undefined }
                : r
            ),
          });
        } else {
          set({
            announcementReads: [
              ...get().announcementReads,
              { announcementId, parentId, readAt: new Date().toISOString() },
            ],
          });
        }
        import('../services/backendSync').then(({ syncToBackend }) => {
          syncToBackend({ announcementReads: get().announcementReads }).then(() => set({ lastSyncTimestamp: Date.now() }));
        });
      },
      remindAnnouncementLater: (announcementId, parentId) => {
        const remindAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // +24h
        const existing = get().announcementReads.find(
          r => r.announcementId === announcementId && r.parentId === parentId
        );
        if (existing) {
          set({
            announcementReads: get().announcementReads.map(r =>
              r.announcementId === announcementId && r.parentId === parentId
                ? { ...r, remindAt, readAt: '' }
                : r
            ),
          });
        } else {
          set({
            announcementReads: [
              ...get().announcementReads,
              { announcementId, parentId, readAt: '', remindAt },
            ],
          });
        }
      },
      getUnreadAnnouncements: (parentId, classes) => {
        const now = new Date().toISOString();
        const reads = get().announcementReads;
        return get().announcements.filter(a => {
          // Filtrer par cible (toutes ou classe spécifique)
          if (a.cible !== 'all' && classes && !classes.includes(a.cible)) return false;
          // Vérifier si lu
          const read = reads.find(r => r.announcementId === a.id && r.parentId === parentId);
          if (!read) return true; // jamais ouvert
          if (read.readAt) return false; // marqué comme lu
          // Si remindAt et que le moment n'est pas encore arrivé, ne pas afficher
          if (read.remindAt && read.remindAt > now) return false;
          return true; // le rappel est passé, réafficher
        });
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
      lastSyncTimestamp: 0,
      setLastSyncTimestamp: (t) => set({ lastSyncTimestamp: t }),
      fetchAllFromBackend: async () => {
        const user = get().user;
        if (!user || user.role === 'parent') return;
        if (get().isSyncing) return; // Éviter les appels concurrents

        // Éviter de fetch si on vient de faire une sync (cooldown 55s)
        const now = Date.now();
        if (now - get().lastSyncTimestamp < 55000) {
          console.log('⏳ [Sync] Fetch skipped (cooldown active)');
          return;
        }

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
              const repairedStudents = deduplicateStudents(data.students.map(repairStudent));
              set({
                students: repairedStudents,
                presences: data.presences || [],
                activityLogs: data.activityLogs || [],
                links: data.links || []
              });

              if (data.appSettings) {
                set({
                  appName: data.appSettings.appName,
                  schoolName: data.appSettings.schoolName,
                  schoolYear: data.appSettings.schoolYear,
                  schoolLogo: data.appSettings.schoolLogo !== undefined ? data.appSettings.schoolLogo : get().schoolLogo,
                  schoolStamp: data.appSettings.schoolStamp !== undefined ? data.appSettings.schoolStamp : get().schoolStamp,
                  messageRemerciement: data.appSettings.messageRemerciement,
                  messageRappel: data.appSettings.messageRappel,
                  ...(data.appSettings.cycleSchedules ? { cycleSchedules: data.appSettings.cycleSchedules } : {}),
                });
              }
              // Annonces et reads venant du cloud
              if (Array.isArray(data.announcements)) {
                set({ announcements: data.announcements });
              }
              if (Array.isArray(data.announcementReads)) {
                set({ announcementReads: data.announcementReads });
              }
              // Récupération des données académiques (Même méthode que pour les élèves)
              if (Array.isArray(data.matieres)) {
                const hasCloud = data.matieres.length > 0;
                const hasLocal = get().matieres.length > 0;
                if (hasCloud || !hasLocal) {
                  set({ matieres: data.matieres });
                }
              }
              if (Array.isArray(data.classeMatieres)) {
                const hasCloud = data.classeMatieres.length > 0;
                const hasLocal = get().classeMatieres.length > 0;
                if (hasCloud || !hasLocal) {
                  set({ classeMatieres: data.classeMatieres });
                }
              }
              if (Array.isArray(data.notes)) {
                const cloudNotes = data.notes.map((n: Note) => ({
                  ...n,
                  noteClasse: n.noteClasse !== null && n.noteClasse !== undefined ? Number(n.noteClasse) : null,
                  noteDevoir: n.noteDevoir !== null && n.noteDevoir !== undefined ? Number(n.noteDevoir) : null,
                  noteCompo: n.noteCompo !== null && n.noteCompo !== undefined ? Number(n.noteCompo) : null,
                }));

                // Fusion intelligente : on garde les notes locales qui ne sont pas dans le cloud 
                // (peut-être de nouvelles saisies) et on met à jour les existantes.
                const localNotes = get().notes;

                // Si le cloud est vide et qu'on a déjà des données locales, on ne vide PAS tout
                // sauf si c'est la première sync (isAuthenticated vient de passer à true)
                if (cloudNotes.length > 0) {
                  // On crée une map des notes cloud pour un accès rapide
                  const cloudMap = new Map();
                  cloudNotes.forEach((n: Note) => {
                    const key = `${n.eleveId}-${n.matiereId}-${n.periode}`;
                    cloudMap.set(key, n);
                  });

                  // On fusionne : le cloud prime pour les doublons, 
                  // mais on garde les locales uniques (WIP)
                  const mergedNotes = [...cloudNotes];
                  localNotes.forEach(ln => {
                    const key = `${ln.eleveId}-${ln.matiereId}-${ln.periode}`;
                    if (!cloudMap.has(key)) {
                      mergedNotes.push(ln);
                    }
                  });

                  set({ notes: mergedNotes });
                } else if (localNotes.length === 0) {
                  set({ notes: cloudNotes });
                }
              }
              console.log(`✅ Cloud data synchronized: ${repairedStudents.length} students loaded and repaired.`);
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
      },
      clearCloudStudents: async () => {
        try {
          const { getAuthHeaders } = await import('../services/apiHelpers');
          const res = await fetch(`${API_BASE_URL}/sync/students`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          if (res.ok) {
            set({ students: [] });
            return true;
          }
          return false;
        } catch (err) {
          console.error('Failed to clear students:', err);
          return false;
        }
      },
      fetchPublicSettings: async () => {
        console.log('🌐 [Settings] Fetching public settings...');
        try {
          const res = await fetch(`${API_BASE_URL}/settings`);
          if (res.ok) {
            const data = await res.json();
            console.log('🌐 [Settings] Data received:', data);
            if (data) {
              set({
                appName: data.appName || get().appName,
                schoolName: data.schoolName || get().schoolName,
                schoolYear: data.schoolYear || get().schoolYear,
                schoolLogo: data.schoolLogo !== undefined ? data.schoolLogo : get().schoolLogo,
                schoolStamp: data.schoolStamp !== undefined ? data.schoolStamp : get().schoolStamp
              });
              console.log('✅ [Settings] App state updated with cloud settings.');
            }
          } else {
            console.warn('⚠️ [Settings] Fetch failed with status:', res.status);
          }
        } catch (err) {
          console.error('❌ [Settings] Fatal error fetching settings:', err);
        }
      },

      // ── M2 : ACADÉMIQUE & NOTES ──
      currentPeriode: 'TRIMESTRE 1',
      setCurrentPeriode: (p) => set({ currentPeriode: p }),
      matieres: [],
      setMatieres: (m) => set({ matieres: m }),
      addMatiere: (m) => {
        set(s => ({ matieres: [...s.matieres, m] }));
        import('../services/backendSync').then(({ syncToBackend }) =>
          syncToBackend({ matieres: get().matieres }).then(() => set({ lastSyncTimestamp: Date.now() }))
        );
      },
      updateMatiere: (id, m) => {
        set(s => ({ matieres: s.matieres.map(x => x.id === id ? { ...x, ...m } : x) }));
        import('../services/backendSync').then(({ syncToBackend }) =>
          syncToBackend({ matieres: get().matieres }).then(() => set({ lastSyncTimestamp: Date.now() }))
        );
      },
      deleteMatiere: async (id) => {
        set(s => ({
          matieres: s.matieres.filter(x => x.id !== id),
          lastSyncTimestamp: Date.now()
        }));
        try {
          const { getAuthHeaders } = await import('../services/apiHelpers');
          await fetch(`${API_BASE_URL}/sync/matiere/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
        } catch (err) {
          console.error('Failed to delete matiere from cloud:', err);
        }
      },

      classeMatieres: [],
      setClasseMatieres: (cm) => set({ classeMatieres: cm }),
      addClasseMatiere: (cm) => {
        set(s => ({ classeMatieres: [...s.classeMatieres, cm] }));
        import('../services/backendSync').then(({ syncToBackend }) =>
          syncToBackend({ classeMatieres: get().classeMatieres }).then(() => set({ lastSyncTimestamp: Date.now() }))
        );
      },
      updateClasseMatiere: (id, cm) => {
        set(s => ({ classeMatieres: s.classeMatieres.map(x => x.id === id ? { ...x, ...cm } : x) }));
        import('../services/backendSync').then(({ syncToBackend }) =>
          syncToBackend({ classeMatieres: get().classeMatieres }).then(() => set({ lastSyncTimestamp: Date.now() }))
        );
      },
      deleteClasseMatiere: async (id) => {
        set(s => ({
          classeMatieres: s.classeMatieres.filter(x => x.id !== id),
          lastSyncTimestamp: Date.now()
        }));
        try {
          const { getAuthHeaders } = await import('../services/apiHelpers');
          await fetch(`${API_BASE_URL}/sync/classe-matiere/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
        } catch (err) {
          console.error('Failed to delete classeMatiere from cloud:', err);
        }
      },

      notes: [],
      setNotes: (n) => set({ notes: n }),
      upsertNote: (n) => get().upsertNotes([n]),
      upsertNotes: (batch) => {
        set(s => {
          let currentNotes = [...s.notes];
          batch.forEach(n => {
            const idx = currentNotes.findIndex(x => x.eleveId === n.eleveId && x.matiereId === n.matiereId && x.periode === n.periode);
            if (idx >= 0) {
              currentNotes[idx] = n;
            } else {
              currentNotes.push(n);
            }
          });
          return { notes: currentNotes };
        });
        import('../services/backendSync').then(({ syncToBackend }) =>
          syncToBackend({ notes: get().notes }).then(() => set({ lastSyncTimestamp: Date.now() }))
        );
      },
      deleteNote: async (id) => {
        set(s => ({
          notes: s.notes.filter(x => x.id !== id),
          lastSyncTimestamp: Date.now()
        }));
        try {
          const { getAuthHeaders } = await import('../services/apiHelpers');
          await fetch(`${API_BASE_URL}/sync/note/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
        } catch (err) {
          console.error('Failed to delete note from cloud:', err);
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
        cycleSchedules: state.cycleSchedules || [],
        announcements: state.announcements || [],
        announcementReads: state.announcementReads || [],
        currentPeriode: state.currentPeriode || 'TRIMESTRE 1',
        matieres: state.matieres || [],
        classeMatieres: state.classeMatieres || [],
        notes: state.notes || [],
        lastReportMonth: state.lastReportMonth,
        currentPage: state.currentPage,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        // Auto-réparation au chargement du storage local
        if (state) {
          if (state.students && state.students.length > 0) {
            state.students = state.students.map(repairStudent);
          }

          // Sécurité — Empêcher la re-connexion automatique de switcher un parent sur l'admin
          if (state.user?.role === 'parent') {
            const allowed: AppPage[] = ['parent_dashboard', 'parent_historique', 'parent_recus', 'parent_badges', 'chat', 'annonces'];
            if (!allowed.includes(state.currentPage)) {
              state.currentPage = 'parent_dashboard';
            }
          } else if (state.user?.role === 'superviseur') {
            const allowed: AppPage[] = ['scan_presence', 'scan_sortie', 'carte_scolaire'];
            if (!allowed.includes(state.currentPage)) {
              state.currentPage = 'scan_presence';
            }
          }
        }
        console.log('🔄 [Storage] Rehydrated. Current Logo:', state?.schoolLogo ? 'Present (Base64)' : 'None');
      },
    }
  )
);
