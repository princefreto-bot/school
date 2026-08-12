import { parseCsv } from './csv';
import { parseJson } from './json';
import { parseXlsx } from './xlsx';

export type ImportSourceType = 'import_xlsx' | 'import_csv' | 'import_json';

const EXTENSION_MAP: Record<string, ImportSourceType> = {
    xlsx: 'import_xlsx',
    xls: 'import_xlsx',
    csv: 'import_csv',
    json: 'import_json',
};

export function detectSourceType(filename: string): ImportSourceType | null {
    const ext = filename.toLowerCase().split('.').pop() || '';
    return EXTENSION_MAP[ext] || null;
}

export function parseFile(buffer: Buffer, sourceType: ImportSourceType): Record<string, any>[] {
    switch (sourceType) {
        case 'import_xlsx':
            return parseXlsx(buffer);
        case 'import_csv':
            return parseCsv(buffer);
        case 'import_json':
            return parseJson(buffer);
    }
}
