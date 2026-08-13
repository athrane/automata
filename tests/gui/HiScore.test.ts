import { HiScore } from '../../src/gui/HiScore';
import type { HiScoreEntry } from '../../src/gui/HiScoreEntry';

describe('HiScore', () => {
  describe('create', () => {
    it('creates an instance with an empty entry list', () => {
      // Arrange / Act
      const hiScore = HiScore.create();

      // Assert
      expect(hiScore.getEntries()).toHaveLength(0);
    });
  });

  describe('addEntry', () => {
    it('adds a single entry', () => {
      // Arrange
      const hiScore = HiScore.create();
      const entry: HiScoreEntry = { name: 'Alice', score: 42 };

      // Act
      hiScore.addEntry(entry);

      // Assert
      expect(hiScore.getEntries()).toHaveLength(1);
      expect(hiScore.getEntries()[0]).toEqual(entry);
    });

    it('sorts entries in descending score order', () => {
      // Arrange
      const hiScore = HiScore.create();

      // Act
      hiScore.addEntry({ name: 'Bob', score: 10 });
      hiScore.addEntry({ name: 'Alice', score: 50 });
      hiScore.addEntry({ name: 'Carol', score: 30 });

      // Assert
      const entries = hiScore.getEntries();
      expect(entries[0]?.score).toBe(50);
      expect(entries[1]?.score).toBe(30);
      expect(entries[2]?.score).toBe(10);
    });

    it('retains at most 10 entries', () => {
      // Arrange
      const hiScore = HiScore.create();

      // Act
      for (let i = 0; i < 12; i += 1) {
        hiScore.addEntry({ name: `Player ${i}`, score: i });
      }

      // Assert
      expect(hiScore.getEntries()).toHaveLength(10);
    });

    it('drops the lowest score when the cap is exceeded', () => {
      // Arrange
      const hiScore = HiScore.create();

      for (let i = 1; i <= 10; i += 1) {
        hiScore.addEntry({ name: `Player ${i}`, score: i });
      }

      // Act — add a score higher than the current lowest (score 1)
      hiScore.addEntry({ name: 'Newcomer', score: 100 });

      // Assert
      const scores = hiScore.getEntries().map((e) => e.score);
      expect(scores).not.toContain(1);
      expect(scores).toContain(100);
    });
  });

  describe('getEntries', () => {
    it('returns a copy so mutating the result does not affect the list', () => {
      // Arrange
      const hiScore = HiScore.create();
      hiScore.addEntry({ name: 'Alice', score: 10 });

      // Act
      const entries = hiScore.getEntries() as HiScoreEntry[];
      entries.push({ name: 'Injected', score: 999 });

      // Assert
      expect(hiScore.getEntries()).toHaveLength(1);
    });
  });
});
