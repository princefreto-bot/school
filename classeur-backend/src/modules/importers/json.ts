export function parseJson(buffer: Buffer): Record<string, any>[] {
    const text = buffer.toString('utf-8');
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
    throw new Error("Le fichier JSON doit contenir un objet ou un tableau d'objets.");
}
