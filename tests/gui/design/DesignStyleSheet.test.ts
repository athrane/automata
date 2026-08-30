import { DESIGN_CLASS } from '../../../src/gui/design/DesignClasses';
import { buildDesignStyleSheet } from '../../../src/gui/design/DesignStyleSheet';
import { DESIGN_TOKENS } from '../../../src/gui/design/DesignTokens';

describe('buildDesignStyleSheet', () => {
  it('emits every design token as a custom property value', () => {
    // Arrange / Act
    const css = buildDesignStyleSheet();

    // Assert
    expect(css).toContain(`--ca-void: ${DESIGN_TOKENS.COLOR.VOID}`);
    expect(css).toContain(`--ca-ink: ${DESIGN_TOKENS.COLOR.INK}`);
    expect(css).toContain(`--ca-accent: ${DESIGN_TOKENS.COLOR.ACCENT}`);
    expect(css).toContain(`--ca-tracking: ${DESIGN_TOKENS.FONT.TRACKING}`);
    expect(css).toContain(DESIGN_TOKENS.FONT.FAMILY);
  });

  it('defines a rule for every class screens are allowed to use', () => {
    // Arrange / Act
    const css = buildDesignStyleSheet();

    // Assert
    for (const className of Object.values(DESIGN_CLASS)) {
      expect(css).toContain(`.${className}`);
    }
  });

  it('draws a checkbox as an ASCII box', () => {
    // Arrange / Act
    const css = buildDesignStyleSheet();

    // Assert
    expect(css).toContain("content: '[ ]'");
    expect(css).toContain("content: '[X]'");
  });
});
