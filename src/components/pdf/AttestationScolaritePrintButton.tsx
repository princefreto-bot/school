// ============================================================
// AttestationScolaritePrintButton — bouton réutilisable qui imprime /
// exporte en PDF l'attestation de scolarité (AttestationScolaritePDF)
// via react-to-print. Même mécanique que RecuPrintButton.
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useStore } from '../../store/useStore';
import { AttestationScolaritePDF } from './AttestationScolaritePDF';
import { Student } from '../../types';

interface AttestationScolaritePrintButtonProps {
  student: Student;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

export const AttestationScolaritePrintButton: React.FC<AttestationScolaritePrintButtonProps> = ({
  student, className, title, children,
}) => {
  const {
    schoolName, schoolLogo, schoolAddress, schoolTelephone, schoolEmail,
    schoolYear, schoolStamp, countryName, countryMotto, ministereName,
    directorName, directorTitle, officialSeal, directorSignature,
  } = useStore();

  const printRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [nonce, setNonce] = useState(0);

  const doPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Attestation_Scolarite_${student.nom}_${student.prenom}`.replace(/\s+/g, '_'),
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
            <AttestationScolaritePDF
              student={student}
              schoolYear={schoolYear}
              countryName={countryName}
              countryMotto={countryMotto}
              ministereName={ministereName}
              directorName={directorName}
              directorTitle={directorTitle}
              stamp={schoolStamp}
              officialSeal={officialSeal}
              directorSignature={directorSignature}
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

export default AttestationScolaritePrintButton;
