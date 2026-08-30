import { formatBracketed, formatPrompted } from '../../../src/gui/design/AsciiOrnament';

describe('formatBracketed', () => {
  it('wraps an uppercased label in ASCII brackets', () => {
    // Arrange / Act / Assert
    expect(formatBracketed('Automata')).toBe('[ AUTOMATA ]');
  });

  it('leaves an already uppercase label unchanged apart from the brackets', () => {
    // Arrange / Act / Assert
    expect(formatBracketed('GAME OVER')).toBe('[ GAME OVER ]');
  });
});

describe('formatPrompted', () => {
  it('marks an uppercased label with the prompt character', () => {
    // Arrange / Act / Assert
    expect(formatPrompted('Hi-Score')).toBe('> HI-SCORE');
  });

  it('marks an empty label with the prompt character alone', () => {
    // Arrange / Act / Assert
    expect(formatPrompted('')).toBe('> ');
  });
});
