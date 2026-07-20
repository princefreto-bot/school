import * as XLSX from 'xlsx';
import { Student } from '../types';

// Même forme que draftNotes dans SaisieNotes.tsx (Record<string, Record<string, string>>)
export type DraftNoteValues = Record<string, string>;

type SaisieMode = 'matieres' | 'moyenne_generale';

export const exportNotesTemplate = (
  students: Student[],
  draftNotes: Record<string, DraftNoteValues>,
  classe: string,
  matiereLabel: string,
  saisieMode: SaisieMode
): void => {
  const sorted = [...students].sort((a, b) => a.nom.localeCompare(b.nom));

  const data = saisieMode === 'moyenne_generale'
    ? sorted.map(s => ({
        'MATRICULE': s.adsn || '',
        'NOM': s.nom,
        'PRÉNOM': s.prenom,
        'MOYENNE GÉNÉRALE (/20)': draftNotes[s.id]?.noteCompo || ''
      }))
    : sorted.map(s => ({
        'MATRICULE': s.adsn || '',
        'NOM': s.nom,
        'PRÉNOM': s.prenom,
        'INTERRO (/20)': draftNotes[s.id]?.noteClasse || '',
        'DEVOIR (/20)': draftNotes[s.id]?.noteDevoir || '',
        'COMPO (/20)': draftNotes[s.id]?.noteCompo || ''
      }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Notes');

  worksheet['!cols'] = saisieMode === 'moyenne_generale'
    ? [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 22 }]
    : [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];

  const safeClasse = classe.replace(/[^\w-]/g, '_');
  const safeMatiere = matiereLabel.replace(/[^\w-]/g, '_');
  XLSX.writeFile(workbook, `notes_${safeClasse}_${safeMatiere}.xlsx`);
};

export interface NotesImportResult {
  updates: Record<string, DraftNoteValues>;
  matchedCount: number;
  errors: string[];
}

const parseNoteValue = (raw: unknown, label: string, rowLabel: string, errors: string[]): string => {
  if (raw === undefined || raw === null || raw === '') return '';
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
  if (isNaN(num)) {
    errors.push(`${rowLabel} : valeur "${raw}" invalide pour ${label} (ignorée).`);
    return '';
  }
  if (num < 0 || num > 20) {
    errors.push(`${rowLabel} : ${label} = ${num} hors de la plage 0-20 (ignorée).`);
    return '';
  }
  return String(num);
};

/**
 * Ne fait AUCUN appel réseau : parse le fichier et renvoie des valeurs de
 * brouillon à fusionner dans l'état existant de SaisieNotes.tsx. L'utilisateur
 * revoit et enregistre lui-même (bouton "Enregistrer"), comme pour une saisie
 * manuelle — pas d'écriture directe en base depuis l'import.
 */
export const importNotesFromExcel = (
  file: File,
  classStudents: Student[],
  saisieMode: SaisieMode
): Promise<NotesImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const byMatricule = new Map<string, Student>();
        const byNomPrenom = new Map<string, Student>();
        classStudents.forEach(s => {
          if (s.adsn) byMatricule.set(s.adsn.trim().toLowerCase(), s);
          byNomPrenom.set(`${s.nom.trim().toLowerCase()}|${s.prenom.trim().toLowerCase()}`, s);
        });

        const updates: Record<string, DraftNoteValues> = {};
        const errors: string[] = [];
        let matchedCount = 0;

        rows.forEach((row, idx) => {
          const rowLabel = `Ligne ${idx + 2}`;
          const matricule = String(row['MATRICULE'] || '').trim();
          const nom = String(row['NOM'] || '').trim();
          const prenom = String(row['PRÉNOM'] || '').trim();

          let student: Student | undefined;
          if (matricule) student = byMatricule.get(matricule.toLowerCase());
          if (!student && nom && prenom) student = byNomPrenom.get(`${nom.toLowerCase()}|${prenom.toLowerCase()}`);

          if (!student) {
            if (matricule || nom) {
              errors.push(`${rowLabel} : élève "${nom} ${prenom}" (matricule "${matricule}") introuvable dans cette classe (ignorée).`);
            }
            return;
          }

          if (saisieMode === 'moyenne_generale') {
            const noteCompo = parseNoteValue(row['MOYENNE GÉNÉRALE (/20)'], 'Moyenne générale', rowLabel, errors);
            updates[student.id] = { noteClasse: '', noteDevoir: '', noteCompo };
          } else {
            const noteClasse = parseNoteValue(row['INTERRO (/20)'], 'Interro', rowLabel, errors);
            const noteDevoir = parseNoteValue(row['DEVOIR (/20)'], 'Devoir', rowLabel, errors);
            const noteCompo = parseNoteValue(row['COMPO (/20)'], 'Composition', rowLabel, errors);
            updates[student.id] = { noteClasse, noteDevoir, noteCompo };
          }
          matchedCount++;
        });

        resolve({ updates, matchedCount, errors });
      } catch (err) {
        reject(new Error("Erreur lors de la lecture du fichier Excel. Vérifiez qu'il suit le format du modèle téléchargé."));
      }
    };

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsArrayBuffer(file);
  });
};
