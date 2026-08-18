// ============================================================
// RecuBulkPrintButton — imprime en une seule tâche d'impression
// le reçu premium de chaque élève d'une liste (un reçu par page).
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useStore } from '../../store/useStore';
import { RecuPaiementPDF } from './RecuPaiementPDF';
import { Student, StudentExpense } from '../../types';
import { expensesApi } from '../../services/expensesApi';

interface RecuBulkPrintButtonProps {
  students: Student[];
  className?: string;
  title?: string;
  children: React.ReactNode;
  format?: 'A4' | 'A5';
}

export const RecuBulkPrintButton: React.FC<RecuBulkPrintButtonProps> = ({
  students, className, title, children, format = 'A4',
}) => {
  const {
    schoolName, schoolLogo, schoolAddress, schoolTelephone, schoolEmail,
    schoolWebsite, schoolAutorisation,
    schoolYear, schoolCurrency, schoolStamp, parents, user,
  } = useStore();

  const printRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [expensesByStudent, setExpensesByStudent] = useState<Record<string, StudentExpense[]>>({});

  const doPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Recus_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page { size: ${format} portrait; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page-break { page-break-after: always; break-after: page; }
      }
    `,
  });

  useEffect(() => {
    if (armed && nonce) doPrint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const results = await Promise.all(
        students.map((s) => expensesApi.getStudentExpenses(s.id).catch(() => []))
      );
      const map: Record<string, StudentExpense[]> = {};
      students.forEach((s, i) => { map[s.id] = results[i]; });
      setExpensesByStudent(map);
    } catch (err) {
      console.error('Erreur chargement dépenses pour les reçus:', err);
      setExpensesByStudent({});
    }
    setArmed(true);
    setNonce((n) => n + 1);
  };

  const employer = {
    name: schoolName,
    logo: schoolLogo,
    address: schoolAddress,
    telephone: schoolTelephone,
    email: schoolEmail,
    website: schoolWebsite || undefined,
    autorisation: schoolAutorisation || undefined,
  };

  return (
    <>
      <button type="button" onClick={handleClick} className={className} title={title} disabled={students.length === 0}>
        {children}
      </button>

      <div className="hidden">
        <div ref={printRef}>
          {armed && students.map((s) => {
            const parentName = s.parentId ? (parents || []).find((p) => p.id === s.parentId)?.nom : undefined;
            return (
              <div key={s.id} className="page-break" style={{ pageBreakAfter: 'always' }}>
                <RecuPaiementPDF
                  student={s}
                  parentName={parentName}
                  schoolYear={schoolYear}
                  currency={schoolCurrency || 'FCFA'}
                  cashierName={user?.nom}
                  stamp={schoolStamp}
                  expenses={expensesByStudent[s.id]}
                  employer={employer}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default RecuBulkPrintButton;
