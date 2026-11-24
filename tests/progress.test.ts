import { describe, expect, it } from 'vitest';
import { OBJECTIVES, readCheckpoint } from '../src/game/progress';

describe('rescue progression', () => {
  it('leads through clues to finding and escorting Krembo', () => {
    expect(OBJECTIVES).toHaveLength(6);
    expect(OBJECTIVES[4].title).toContain('קרמבו');
    expect(OBJECTIVES[3].dialogue).toContain('ימינה, אל הגינה');
    expect(OBJECTIVES[4].hint).toContain('הסימון המהבהב');
    expect(OBJECTIVES[5].title).toContain('לוו');
    expect(new Set(OBJECTIVES.map((objective) => objective.area)).size).toBe(4);
  });

  it('accepts only valid unfinished checkpoints', () => {
    for (let stage = 0; stage <= 4; stage++) expect(readCheckpoint(JSON.stringify({ stage }))).toBe(stage);
    for (const value of [null, '', '{', '{}', '{"stage":-1}', '{"stage":5}', '{"stage":1.5}', '{"stage":"2"}']) expect(readCheckpoint(value)).toBeNull();
  });
});