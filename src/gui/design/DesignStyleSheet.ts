import { DESIGN_CLASS } from './DesignClasses';
import { DESIGN_TOKENS } from './DesignTokens';

/** Id of the `<style>` element the design programme is installed as. */
const STYLE_ELEMENT_ID = 'automata-design';

/**
 * Builds the whole design programme as a CSS stylesheet.
 *
 * The tokens are emitted once as custom properties on `:root`; every rule below
 * refers to them, so a token change moves the whole interface at once.
 *
 * @returns The stylesheet text.
 */
export function buildDesignStyleSheet(): string {
  const { COLOR, FONT, SPACE, MEASURE, BORDER_WIDTH } = DESIGN_TOKENS;

  return `
:root {
  --ca-void: ${COLOR.VOID};
  --ca-panel: ${COLOR.PANEL};
  --ca-veil: ${COLOR.VEIL};
  --ca-ink: ${COLOR.INK};
  --ca-ink-dim: ${COLOR.INK_DIM};
  --ca-ink-faint: ${COLOR.INK_FAINT};
  --ca-rule: ${COLOR.RULE};
  --ca-accent: ${COLOR.ACCENT};
  --ca-border: ${BORDER_WIDTH} solid ${COLOR.RULE};
  --ca-hair: ${SPACE.HAIR};
  --ca-tight: ${SPACE.TIGHT};
  --ca-step: ${SPACE.STEP};
  --ca-wide: ${SPACE.WIDE};
  --ca-tracking: ${FONT.TRACKING};
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ca-void);
  color: var(--ca-ink);
  font-family: ${FONT.FAMILY};
  font-size: ${FONT.SIZE_BODY};
  line-height: ${FONT.LINE_HEIGHT};
}

canvas {
  display: block;
  border: var(--ca-border);
}

.${DESIGN_CLASS.SCREEN} {
  position: fixed;
  inset: 0;
  z-index: 10;
  box-sizing: border-box;
  padding: var(--ca-wide) var(--ca-step);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ca-tight);
  overflow-y: auto;
  background: var(--ca-void);
  color: var(--ca-ink);
}

.${DESIGN_CLASS.SCREEN_VEIL} {
  background: var(--ca-veil);
}

.${DESIGN_CLASS.TITLE} {
  margin: 0;
  font-size: ${FONT.SIZE_CANON};
  font-weight: normal;
  letter-spacing: var(--ca-tracking);
}

.${DESIGN_CLASS.HEADING} {
  margin: 0;
  font-size: ${FONT.SIZE_HEADING};
  font-weight: normal;
  letter-spacing: var(--ca-tracking);
  color: var(--ca-ink-dim);
}

.${DESIGN_CLASS.TEXT} {
  margin: 0;
}

.${DESIGN_CLASS.ORNAMENT} {
  margin: var(--ca-tight) 0;
  font-size: ${FONT.SIZE_MICRO};
  line-height: 1;
  letter-spacing: 0.1em;
  color: var(--ca-ink-faint);
  white-space: pre;
  user-select: none;
}

.${DESIGN_CLASS.STACK} {
  display: flex;
  flex-direction: column;
  gap: var(--ca-tight);
}

.${DESIGN_CLASS.ROW} {
  display: flex;
  align-items: center;
  gap: var(--ca-tight);
}

label.${DESIGN_CLASS.ROW} {
  cursor: pointer;
}

.${DESIGN_CLASS.LIST} {
  margin: 0;
  padding: 0;
  min-height: 1.5rem;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--ca-hair);
  white-space: pre;
}

.${DESIGN_CLASS.BUTTON} {
  font: inherit;
  letter-spacing: var(--ca-tracking);
  text-transform: uppercase;
  color: var(--ca-ink);
  background: transparent;
  border: var(--ca-border);
  padding: var(--ca-tight) var(--ca-step);
  cursor: pointer;
}

.${DESIGN_CLASS.BUTTON}:hover:not(:disabled),
.${DESIGN_CLASS.BUTTON}:focus-visible {
  color: var(--ca-accent);
  border-color: var(--ca-accent);
  outline: none;
}

.${DESIGN_CLASS.BUTTON}:disabled {
  color: var(--ca-ink-faint);
  border-color: var(--ca-ink-faint);
  cursor: not-allowed;
}

.${DESIGN_CLASS.SELECT} {
  font: inherit;
  color: var(--ca-ink);
  background: var(--ca-void);
  border: var(--ca-border);
  padding: var(--ca-hair) var(--ca-tight);
  cursor: pointer;
}

.${DESIGN_CLASS.SELECT}:focus-visible {
  border-color: var(--ca-accent);
  outline: none;
}

.${DESIGN_CLASS.FIELD} {
  display: flex;
  align-items: center;
  gap: var(--ca-tight);
  font-size: ${FONT.SIZE_MICRO};
  letter-spacing: var(--ca-tracking);
  text-transform: uppercase;
  color: var(--ca-ink-dim);
}

.${DESIGN_CLASS.CHECK} {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
  font: inherit;
  color: var(--ca-ink-dim);
  background: none;
  border: none;
  cursor: pointer;
}

.${DESIGN_CLASS.CHECK}::before {
  content: '[ ]';
}

.${DESIGN_CLASS.CHECK}:checked {
  color: var(--ca-accent);
}

.${DESIGN_CLASS.CHECK}:checked::before {
  content: '[X]';
}

.${DESIGN_CLASS.CHECK}:hover:not(:disabled),
.${DESIGN_CLASS.CHECK}:focus-visible {
  color: var(--ca-accent);
  outline: none;
}

.${DESIGN_CLASS.CHECK}:disabled {
  color: var(--ca-ink-faint);
  cursor: not-allowed;
}

.${DESIGN_CLASS.BAR} {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--ca-step);
  padding: var(--ca-tight) var(--ca-step);
  background: var(--ca-panel);
  border: var(--ca-border);
  color: var(--ca-ink);
  font-size: ${FONT.SIZE_MICRO};
  letter-spacing: var(--ca-tracking);
  text-transform: uppercase;
}

.${DESIGN_CLASS.BAR_TOP} {
  top: var(--ca-step);
}

.${DESIGN_CLASS.BAR_BOTTOM} {
  bottom: var(--ca-step);
}

.${DESIGN_CLASS.READOUT} {
  min-width: ${MEASURE.READOUT};
  text-align: center;
}

.${DESIGN_CLASS.SWATCH} {
  display: inline-block;
  width: ${MEASURE.SWATCH};
  height: ${MEASURE.SWATCH};
}
`;
}

/**
 * Installs the design programme into the document, once.
 *
 * Called before the first screen is shown; a second call is a no-op, so
 * rebuilding the controller does not stack stylesheets.
 */
export function installDesignStyleSheet(): void {
  if (document.getElementById(STYLE_ELEMENT_ID) !== null) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = buildDesignStyleSheet();
  document.head.appendChild(style);
}
