import { createWorker } from 'tesseract.js';

const OCR_TIMEOUT_MS = 90_000;

export interface OcrResult {
    text: string;
    confidence: number; // 0-100
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
    ]);
}

/** OCR pur JS (tesseract.js, pas de binaire natif) — volontairement borné dans le temps :
 *  un document illisible ne doit jamais faire tourner le worker indéfiniment. */
export async function extractImageText(buffer: Buffer): Promise<OcrResult> {
    const worker = await createWorker('fra');
    try {
        const { data } = await withTimeout(worker.recognize(buffer), OCR_TIMEOUT_MS, "Délai de reconnaissance optique dépassé.");
        const text = (data.text || '').trim();
        if (!text) {
            throw new Error('Aucun texte détecté sur cette image.');
        }
        return { text, confidence: data.confidence };
    } finally {
        await worker.terminate();
    }
}
