import { describe, it, expect } from 'vitest';
import { getNextClass } from '../classConfig';

describe('getNextClass (rentrée / promotion)', () => {
  it('fait progresser les classes sans ambiguïté', () => {
    expect(getNextClass('CM2')).toBe('6EME');
    expect(getNextClass('4EME')).toBe('3EME');
    expect(getNextClass('2nde S')).toBe('1er D');
    expect(getNextClass('1er A4')).toBe('Tle A4');
  });

  it('laisse le choix manuel quand la suite dépend de la filière', () => {
    expect(getNextClass('3EME')).toBeNull();
  });

  it('ne propose rien après la terminale ou pour une classe inconnue', () => {
    expect(getNextClass('Tle D')).toBeNull();
    expect(getNextClass('Classe inconnue')).toBeNull();
  });
});
