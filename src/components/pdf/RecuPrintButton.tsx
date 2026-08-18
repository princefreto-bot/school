// ============================================================
// RecuPrintButton — bouton réutilisable qui imprime / exporte en PDF
// le reçu de paiement premium (RecuPaiementPDF) via react-to-print.
// Récupère automatiquement le logo et les infos de l'établissement
// depuis les paramètres (store). Drop-in : garde le style d'appel.
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useStore } from '../../store/useStore';
import { RecuPaiementPDF } from './RecuPaiementPDF';
import { Student, Payment, StudentExpense } from '../../types';
import { expensesApi } from '../../services/expensesApi';

interface RecuPrintButtonProps {
  student: Student;
  /** Transaction précise à documenter (défaut : dernier versement). */
  payment?: Payment;
  className?: string;
  title?: string;
  children: React.ReactNode;
  /** Format papier de l'impression. Défaut : A4. */
  format?: 'A4' | 'A5';
}

export const RecuPrintButton: React.FC<RecuPrintButtonProps> = ({
  student, payment, className, title, children, format = 'A4',
}) => {
  const {
    schoolName, schoolLogo, schoolAddress, schoolTelephone, schoolEmail,
    schoolWebsite, schoolAutorisation,
    schoolYear, schoolCurrency, schoolStamp, parents, user,
  } = useStore();

  const parentName = student.parentId
    ? (parents || []).find((p) => p.id === student.parentId)?.nom
    : undefined;

  const printRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [expenses, setExpenses] = useState<StudentExpense[]>([]);

  const doPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Recu_${student.nom}_${student.prenom}_${student.classe}`.replace(/\s+/g, '_'),
    pageStyle: `
      @page { size: ${format} portrait; margin: 0; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  useEffect(() => {
    if (armed && nonce) doPrint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setExpenses(await expensesApi.getStudentExpenses(student.id));
    } catch (err) {
      console.error('Erreur chargement dépenses pour le reçu:', err);
      setExpenses([]);
    }
    setArmed(true);
    setNonce((n) => n + 1);
  };

  return (
    <>
      <button type="button" onClick={handleClick} className={className} title={title}>
        {children}
      </button>

      {/* Conteneur d'impression hors écran */}
      <div className="hidden">
        <div ref={printRef}>
          {armed && (
            <RecuPaiementPDF
              student={student}
              payment={payment}
              parentName={parentName}
              schoolYear={schoolYear}
              currency={schoolCurrency || 'FCFA'}
              cashierName={user?.nom}
              stamp={schoolStamp}
              expenses={expenses}
              employer={{
                name: schoolName,
                logo: schoolLogo,
                address: schoolAddress,
                telephone: schoolTelephone,
                email: schoolEmail,
                website: schoolWebsite || undefined,
                autorisation: schoolAutorisation || undefined,
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default RecuPrintButton;
