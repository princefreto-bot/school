// ============================================================
// StatementPrintButton — imprime/exporte un état comptable
// (StatementPDF) avec le logo et les infos de l'établissement
// tirés automatiquement des paramètres.
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useStore } from '../../store/useStore';
import { StatementPDF, StatementSection } from './StatementPDF';

interface StatementPrintButtonProps {
  title: string;
  subtitle?: string;
  sections: StatementSection[];
  finalTotal?: { label: string; amount: number };
  documentTitle: string;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export const StatementPrintButton: React.FC<StatementPrintButtonProps> = ({
  title, subtitle, sections, finalTotal, documentTitle, className, disabled, children,
}) => {
  const { schoolName, schoolLogo, schoolAddress, schoolTelephone, schoolEmail, schoolCurrency } = useStore();

  const printRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [nonce, setNonce] = useState(0);

  const doPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
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
      <button type="button" onClick={handleClick} className={className} disabled={disabled}>
        {children}
      </button>

      <div className="hidden">
        <div ref={printRef}>
          {armed && (
            <StatementPDF
              title={title}
              subtitle={subtitle}
              sections={sections}
              finalTotal={finalTotal}
              currency={schoolCurrency || 'FCFA'}
              generatedAt={new Date().toLocaleDateString('fr-FR')}
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

export default StatementPrintButton;
