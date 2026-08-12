import Papa from 'papaparse';

export function parseCsv(buffer: Buffer): Record<string, any>[] {
    const text = buffer.toString('utf-8');
    const result = Papa.parse<Record<string, any>>(text, { header: true, skipEmptyLines: true });
    return result.data;
}
