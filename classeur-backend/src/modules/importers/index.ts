import { parseCsv } from './csv';
import { extractImageText } from './image';
import { parseJson } from './json';
import { extractPdfText } from './pdf';
import { parseXlsx } from './xlsx';

export type TabularSourceType = 'import_xlsx' | 'import_csv' | 'import_json';
export type DocumentSourceType = 'import_pdf' | 'import_image';
export type ImportSourceType = TabularSourceType | DocumentSourceType;

const EXTENSION_MAP: Record<string, ImportSourceType> = {
    xlsx: 'import_xlsx',
    xls: 'import_xlsx',
    csv: 'import_csv',
    json: 'import_json',
    pdf: 'import_pdf',
    jpg: 'import_image',
    jpeg: 'import_image',
    png: 'import_image',
    webp: 'import_image',
};

export function detectSourceType(filename: string): ImportSourceType | null {
    const ext = filename.toLowerCase().split('.').pop() || '';
    return EXTENSION_MAP[ext] || null;
}

export function isDocumentSourceType(type: ImportSourceType): type is DocumentSourceType {
    return type === 'import_pdf' || type === 'import_image';
}

/** Fichiers tabulaires : une ligne par personne, traitement synchrone (rapide). */
export function parseTabularFile(buffer: Buffer, sourceType: TabularSourceType): Record<string, any>[] {
    switch (sourceType) {
        case 'import_xlsx':
            return parseXlsx(buffer);
        case 'import_csv':
            return parseCsv(buffer);
        case 'import_json':
            return parseJson(buffer);
    }
}

/** PDF/image : un seul bloc de texte par document, traitement différé (OCR potentiellement
 *  lent) via le tick cron dédié — jamais dans la requête HTTP d'upload. */
export async function extractDocumentText(buffer: Buffer, sourceType: DocumentSourceType): Promise<{ text: string; confidence: number | null }> {
    if (sourceType === 'import_pdf') {
        const text = await extractPdfText(buffer);
        return { text, confidence: null };
    }
    const { text, confidence } = await extractImageText(buffer);
    return { text, confidence };
}
