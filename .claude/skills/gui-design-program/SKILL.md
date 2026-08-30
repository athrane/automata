---
name: gui-design-program
description: "The ASCII/cellular-automaton design programme every automata screen and overlay must follow. Use when building, changing, or reviewing anything under src/gui — a screen, an overlay, a button, a label, a colour, a spacing, or the ASCII ornament. Load before writing any DOM-producing GUI code."
---

# Skill: GUI Design Programme

The game is a cellular automaton. Its interface is built from the same material:
characters on a grid, live or dead, black or lit. This programme is binding for
every pixel the player sees.

---

## When to Use This Skill

- Adding or changing a screen or overlay under `src/gui/screens/`
- Adding any control: button, drop-down, checkbox, label, list, readout
- Choosing a colour, size, spacing, border, or piece of ornament
- Reviewing a GUI change for design compliance

---

## The Programme

### 1. One typeface, monospace

Everything is set in `DESIGN_TOKENS.FONT.FAMILY`. The character cell is the unit
of the layout. Columns are aligned by padding strings (`padStart` / `padEnd`),
never by tables or absolute positions.

### 2. Void, ink, one accent

Black ground, three levels of grey-white ink, and a single accent — the human
player's red. The accent marks exactly one thing at a time: the current choice,
the hovered control, the focused control. Player colours appear only as cell
colours and scoreboard swatches; they are data, not decoration.

### 3. Hairline structure

Structure is drawn with 1px borders and empty space. No rounded corners, no
shadows, no gradients, no animation other than the simulation's own pulse.

### 4. State is a character, never colour alone

A selected option reads `[X]`, an empty one `[ ]`. A heading is prefixed `>`. A
title is wrapped `[ TITLE ]`. Colour only reinforces what a character already
says, so the interface survives being read in one channel.

### 5. Ornament is generated, never drawn

Every divider is one row of an elementary cellular automaton
(`generateAutomatonRows`), rendered as `#` and `.`. Ornament is a slice of a
real automaton or it does not exist. No images, no icons, no emoji.

### 6. Uppercase and tracked for chrome, plain for content

Titles, headings, buttons, labels, and overlay bars are uppercase with
`--ca-tracking`. Player-facing content — names, rule descriptions, scores —
stays as authored.

### 7. Four spacing steps

`HAIR`, `TIGHT`, `STEP`, `WIDE`. Nothing between them, nothing outside them.

---

## Where the Programme Lives

| File | Holds |
|------|-------|
| `src/gui/design/DesignTokens.ts` | Every colour, size, spacing, border, ornament parameter |
| `src/gui/design/DesignClasses.ts` | `DESIGN_CLASS` — the only class names screens may use |
| `src/gui/design/DesignStyleSheet.ts` | Builds the stylesheet from the tokens; installed once by `GameController` |
| `src/gui/design/ElementaryAutomaton.ts` | Pure automaton row generator behind the ornament |
| `src/gui/design/AsciiOrnament.ts` | `createAsciiDivider`, `formatBracketed`, `formatPrompted` |

---

## How to Build a Screen

```typescript
const root = document.createElement('div');
root.className = DESIGN_CLASS.SCREEN;

const title = document.createElement('h1');
title.textContent = formatBracketed('Configure');   // [ CONFIGURE ]
title.className = DESIGN_CLASS.TITLE;
root.appendChild(title);

root.appendChild(createAsciiDivider());             // #.#.#.#.#.#.#.#

const heading = document.createElement('p');
heading.textContent = formatPrompted('Level');      // > LEVEL
heading.className = DESIGN_CLASS.HEADING;
root.appendChild(heading);

const button = document.createElement('button');
button.textContent = 'Start game';
button.className = DESIGN_CLASS.BUTTON;
root.appendChild(button);
```

A screen that must leave the simulation visible behind it adds
`DESIGN_CLASS.SCREEN_VEIL`. An overlay pinned to an edge uses
`DESIGN_CLASS.BAR` plus `BAR_TOP` or `BAR_BOTTOM`.

---

## Specimen

```
                        [ AUTOMATA ]
  ........#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#........

                        > HI-SCORE
                        01  Player 1    1420
                        02  Player 1     890

  ........#.#.#.#.#.#.#.#.#.#.#.#.#.#.#.#........

                        [ PLAY GAME ]
```

---

## Prohibited

- `style.cssText` or any inline colour, font, size, or spacing on a new element.
  The one exception is a value that is genuinely data — a player's swatch colour
  — or a `style.display` toggle that shows or hides an existing block.
- A hex colour, `rem` value, or font stack written anywhere outside
  `DesignTokens.ts`.
- A literal class name string; use `DESIGN_CLASS`.
- Images, icon fonts, emoji, SVG, web fonts, third-party CSS.
- A second typeface, a second accent, or a border width other than the one.

---

## Checklist

Apply to every changed GUI file:

- [ ] Element styling comes from `DESIGN_CLASS`, not `style.cssText`
- [ ] No colour, size, spacing, or font value outside `DesignTokens.ts`
- [ ] Titles use `formatBracketed`, section headings use `formatPrompted`
- [ ] Selection and focus states are readable as characters, not colour alone
- [ ] Dividers come from `createAsciiDivider`; no other ornament is introduced
- [ ] Columns are aligned by string padding on the character grid
- [ ] New pure design helpers have unit tests under `tests/gui/design/`
