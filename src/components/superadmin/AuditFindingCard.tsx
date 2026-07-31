import React from 'react';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { SuperAdminBadge } from './SuperAdminBadge';

export interface AuditFinding {
  rule: string;
  severity: 'danger' | 'warning' | 'info';
  schoolId: string;
  schoolName: string;
  detail: string;
}

const RULE_LABELS: Record<string, string> = {
  status_approval_mismatch: 'Statut / approbation incohérents',
  trial_expired: 'Essai expiré',
  over_quota: 'Hors quota élèves',
  no_billing_evidence: 'Aucune preuve de paiement',
};

const SEVERITY_ICON: Record<AuditFinding['severity'], React.ReactNode> = {
  danger: <AlertOctagon className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
};

const SEVERITY_TONE: Record<AuditFinding['severity'], 'danger' | 'warning' | 'neutral'> = {
  danger: 'danger',
  warning: 'warning',
  info: 'neutral',
};

export const AuditFindingCard: React.FC<{ finding: AuditFinding }> = ({ finding }) => (
  <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-start justify-between gap-4">
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <p className="text-white font-bold text-sm">{finding.schoolName}</p>
        <SuperAdminBadge tone={SEVERITY_TONE[finding.severity]} icon={SEVERITY_ICON[finding.severity]}>
          {RULE_LABELS[finding.rule] || finding.rule}
        </SuperAdminBadge>
      </div>
      <p className="text-slate-400 text-xs">{finding.detail}</p>
    </div>
  </div>
);
