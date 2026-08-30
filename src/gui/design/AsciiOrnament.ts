import { DESIGN_CLASS } from './DesignClasses';
import { DESIGN_TOKENS } from './DesignTokens';
import { generateAutomatonRows } from './ElementaryAutomaton';

/**
 * Wraps a label in ASCII brackets, the programme's marker for a title.
 *
 * @param text - The label to wrap.
 * @returns The label as `[ TEXT ]`, uppercased.
 */
export function formatBracketed(text: string): string {
  return `[ ${text.toUpperCase()} ]`;
}

/**
 * Prefixes a label with the programme's prompt marker, used for section headings.
 *
 * @param text - The label to mark.
 * @returns The label as `> TEXT`, uppercased.
 */
export function formatPrompted(text: string): string {
  return `> ${text.toUpperCase()}`;
}

/**
 * Builds a divider: one row of an elementary cellular automaton, drawn in ASCII.
 *
 * The row is taken after {@link DESIGN_TOKENS.ORNAMENT.GENERATIONS} generations
 * of the ornament rule, so a divider is a slice of a real automaton rather than
 * a decorative graphic.
 *
 * @returns A `div` carrying the ornament row, ready to append.
 */
export function createAsciiDivider(): HTMLElement {
  const rows = generateAutomatonRows(
    DESIGN_TOKENS.ORNAMENT.COLUMNS,
    DESIGN_TOKENS.ORNAMENT.GENERATIONS,
    DESIGN_TOKENS.ORNAMENT.RULE_NUMBER,
  );

  const divider = document.createElement('div');
  divider.className = DESIGN_CLASS.ORNAMENT;
  divider.textContent = rows[rows.length - 1];

  return divider;
}
