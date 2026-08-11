import { API_BASE_URL } from '../config';

function getAuthHeaders() {
  const token = localStorage.getItem('parent_token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: getAuthHeaders() });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || `Erreur ${res.status}`);
  return data;
}

export const superAdminApi = {
  getSchools: () => request('/superadmin/schools'),
  getStats: () => request('/superadmin/stats'),
  createSchool: (form: any) => request('/superadmin/schools', { method: 'POST', body: JSON.stringify(form) }),
  approveSchool: (id: string, is_approved: boolean) => request(`/superadmin/schools/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ is_approved }) }),
  updateSchoolStatus: (id: string, status: string) => request(`/superadmin/schools/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteSchool: (id: string) => request(`/superadmin/schools/${id}`, { method: 'DELETE' }),
  impersonateSchool: (id: string) => request(`/superadmin/schools/${id}/impersonate`, { method: 'POST' }),

  getCreators: () => request('/superadmin/creators'),
  createCreator: (form: any) => request('/superadmin/creators', { method: 'POST', body: JSON.stringify(form) }),
  deleteCreator: (id: string) => request(`/superadmin/creators/${id}`, { method: 'DELETE' }),
  linkSchoolToCreator: (creatorId: string, schoolId: string) => request(`/superadmin/creators/${creatorId}/link`, { method: 'POST', body: JSON.stringify({ school_id: schoolId }) }),
  unlinkSchoolFromCreator: (creatorId: string, schoolId: string) => request(`/superadmin/creators/${creatorId}/link/${schoolId}`, { method: 'DELETE' }),

  getExpenses: () => request('/superadmin/expenses'),
  addExpense: (payload: { category: string; amount: number; period: string }) => request('/superadmin/expenses', { method: 'POST', body: JSON.stringify(payload) }),
  deleteExpense: (id: string) => request(`/superadmin/expenses/${id}`, { method: 'DELETE' }),

  getWithdrawals: () => request('/superadmin/withdrawals'),
  approveWithdrawal: (id: string, adminProofImageUrl?: string | null) => request(`/superadmin/withdrawals/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ adminProofImageUrl: adminProofImageUrl || null }) }),
  rejectWithdrawal: (id: string) => request(`/superadmin/withdrawals/${id}/reject`, { method: 'PATCH' }),
  uploadWithdrawalProof: (imageBase64: string) => request('/superadmin/withdrawals/upload-proof', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),

  // Phase 1 — Cashflow
  getCashflowTrend: (months = 12) => request(`/superadmin/cashflow/trend?months=${months}`),
  // Phase 2 — Auditeur
  getAuditFindings: () => request('/superadmin/auditor/findings'),
  // Phase 3 — Alertes
  getOverdueAlerts: () => request('/superadmin/alerts/overdue'),
  markAlertContacted: (schoolId: string, note?: string) => request(`/superadmin/alerts/${schoolId}/mark-contacted`, { method: 'POST', body: JSON.stringify({ note }) }),
  // Phase 4 — Pipeline
  getProspects: (stage?: string) => request(`/superadmin/prospects${stage ? `?stage=${stage}` : ''}`),
  createProspect: (payload: any) => request('/superadmin/prospects', { method: 'POST', body: JSON.stringify(payload) }),
  updateProspect: (id: string, payload: any) => request(`/superadmin/prospects/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  updateProspectStage: (id: string, stage: string) => request(`/superadmin/prospects/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  deleteProspect: (id: string) => request(`/superadmin/prospects/${id}`, { method: 'DELETE' }),

  // Handoff SSO — Classeur Intelligent de Personnes (data.dghubschool.com)
  getClasseurHandoffCode: (): Promise<{ code: string; expiresAt: string }> =>
    request('/superadmin/classeur/handoff-token'),
};

export function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-TG').format(n || 0) + ' FCFA';
}
