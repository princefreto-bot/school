// ============================================================
// ListeNominativePrintButton — bouton réutilisable qui imprime /
// exporte en PDF la liste nominative des élèves d'une classe
// (ListeNominativePDF) via react-to-print. Même mécanique que
// RecuPrintButton pour le reçu de paiement.
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useStore } from '../../store/useStore';
import { ListeNominativePDF } from './ListeNominativePDF';
import { Student } from '../../types';

interface ListeNominativePrintButtonProps {
  students: Student[];
  classe: string;
  cycle?: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

export const ListeNominativePrintButton: React.FC<ListeNominativePrintButtonProps> = ({
  students, classe, cycle, className, title, children,
}) => {
  const {
    schoolName, schoolLogo, schoolAddress, schoolTelephone, schoolEmail,
    schoolYear, schoolStamp, countryName, countryMotto, ministereName, directorName,
  } = useStore();

  const printRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [nonce, setNonce] = useState(0);

  const doPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Liste_Nominative_${classe}`.replace(/\s+/g, '_'),
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  useEffect(() => {
    if (armed && nonce) doPrint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setArmed(true);
    setNonce((n) => n + 1);
  };

  return (
    <>
      <button type="button" onClick={handleClick} className={className} title={title}>
        {children}
      </button>

      <div className="hidden">
        <div ref={printRef}>
          {armed && (
            <ListeNominativePDF
              students={students}
              classe={classe}
              cycle={cycle}
              schoolYear={schoolYear}
              countryName={countryName}
              countryMotto={countryMotto}
              ministereName={ministereName}
              directorName={directorName}
              stamp={schoolStamp}
              employer={{
                name: schoolName,
                logo: schoolLogo,
                address: schoolAddress,
                telephone: schoolTelephone,
                email: schoolEmail,
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ListeNominativePrintButton;
