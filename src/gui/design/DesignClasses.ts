/**
 * Every CSS class the design programme defines.
 *
 * Screens reference these constants instead of literal class names, so the
 * stylesheet built by {@link buildDesignStyleSheet} and the markup that uses it
 * cannot drift apart.
 */
export const DESIGN_CLASS = {
  /** Full-page screen overlay on the opaque void. */
  SCREEN: 'ca-screen',
  /** Modifier: a screen that lets the simulation grid show through. */
  SCREEN_VEIL: 'ca-screen--veil',
  /** The single title of a screen. */
  TITLE: 'ca-title',
  /** A section heading. */
  HEADING: 'ca-heading',
  /** A block of body text. */
  TEXT: 'ca-text',
  /** Automaton-generated ASCII ornament row. */
  ORNAMENT: 'ca-ornament',
  /** Vertical stack of controls. */
  STACK: 'ca-stack',
  /** Horizontal run of controls. */
  ROW: 'ca-row',
  /** Unstyled list, one entry per line. */
  LIST: 'ca-list',
  /** Push button. */
  BUTTON: 'ca-button',
  /** Drop-down. */
  SELECT: 'ca-select',
  /** Checkbox drawn as `[ ]` / `[X]`. */
  CHECK: 'ca-check',
  /** Label of a drop-down. */
  FIELD: 'ca-field',
  /** Overlay bar pinned to an edge of the viewport. */
  BAR: 'ca-bar',
  /** Modifier: bar pinned to the top edge. */
  BAR_TOP: 'ca-bar--top',
  /** Modifier: bar pinned to the bottom edge. */
  BAR_BOTTOM: 'ca-bar--bottom',
  /** Fixed-width readout inside an overlay bar. */
  READOUT: 'ca-readout',
  /** Player colour swatch. */
  SWATCH: 'ca-swatch',
} as const;
