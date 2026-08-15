---
name: grill-me
description: "Option-driven design interview to stress-test a plan before implementation. Use when asked to grill a plan, challenge a design, probe assumptions, or surface weaknesses before writing code, and when a plan or PR implementation plan contains ambiguous or high-impact design decisions."
---

# Skill: Grill Me — Option-Driven Design Interview

Structured interview workflow used to stress-test a plan or design before implementation. It replaces open-ended dialogue with a one-question-at-a-time interview where each question surfaces the next blocking decision, presents concrete options, marks the recommended default, and records the outcome before moving on.

---

## When to Use This Skill

- The user says "grill me on this plan", "challenge my design", "stress-test this", or similar
- A plan or design needs probing before implementation begins
- A planning session benefits from structured decision capture rather than free-form discussion

**Scope**: this skill governs interview *flow* only — not domain knowledge. Domain knowledge is supplied by the other skills (`mandatory-code-requirements`, `solid-principles`, `code-quality`, `test-standards`). Load the relevant domain skill first to understand the task, then run the interview.

**Invoked from other workflows**:

| Skill | When it invokes this skill |
|-------|---------------------------|
| [pr-description-generator](../pr-description-generator/SKILL.md) | Before writing the Implementation Plan when the plan involves ambiguous or high-impact design decisions |
| [reflect](../reflect/SKILL.md) | When an improvement proposal has more than one viable direction |

---

## 1. Inspection-First Rule

**Before asking the user anything**, search the code, tests, and docs for relevant context.

- If the answer to a potential question is derivable from context (existing implementation, prior decisions in the conversation, project skills), record it in the recap and **skip the question**.
- Only ask about decisions that are genuinely unresolved after inspection.
- State what was inspected at the start of the session: "I inspected X and Y. The following decisions are already resolved: …"

---

## 2. Contradiction Scan

**Before asking Decision 1**, scan the plan for pairs of requirements that are mutually exclusive.

- Produce a bulleted list titled **"Contradictions found:"**, one line per conflict, naming the two conflicting requirements and the nature of the conflict.
- If none exist, write **"No contradictions detected."** and proceed.
- Contradictions are treated as unresolved decisions and recorded in the recap as `⚠️ Contradiction:` entries when resolved.

---

## 3. Blocking-Question Identification

Select the **next question** using this heuristic:

> Pick the unresolved decision that, if answered, **unblocks the most downstream decisions**.

**Contradiction-resolution questions have highest priority** — resolve every conflict found in Section 2 before asking any standard design decision.

For standard design decisions:

1. List all unresolved decisions visible from the plan.
2. Note which decisions constrain which others.
3. Ask the decision at the root of the longest dependency chain first.
4. If two decisions are independent and equally blocking, prefer the one with higher risk if chosen incorrectly.

Ask **exactly one question per response**. Do not bundle multiple questions.

---

## 4. Question Format — `AskUserQuestion`

Use the `AskUserQuestion` tool for every interview question, one question per call.

| Field | Rule |
|-------|------|
| `question` | States the decision being made — not a yes/no question. Keep to one sentence. |
| `header` | Short topic label, **≤ 12 characters** (e.g. `Cell owner`, `Score model`). The decision number lives in the recap, not the header. |
| `options` | 2–4 concrete alternatives meeting the criteria in Section 5. |
| recommended option | Listed **first**, with `(Recommended)` appended to its label. |
| `description` | One line per option stating what happens if chosen — for non-recommended options, name the deviation from the recommended path. |
| `multiSelect` | Always `false` — design decisions are mutually exclusive. |

The tool supplies an "Other" choice automatically; do not add a freeform option manually.

After the tool call, add the recommended-option rationale (Section 6) as prose.

### Plain-Markdown Fallback

When `AskUserQuestion` is unavailable, render the question as:

```
**Decision N — [Topic]**

[Decision statement]

1. ⭐ [Option A] _(recommended)_
2. [Option B]
3. [Option C]

_Or describe your own approach._
```

Mark exactly one option with ⭐ and include the "Or describe your own approach." line.

---

## 5. Option-Quality Criteria

Every option must satisfy all five:

1. **Concrete and actionable** — names a specific approach, not a vague direction (e.g. "Store the owner id on the cell and resolve ties by lowest player index", not "Handle ownership").
2. **Materially different in consequence** — leads to observably different implementation decisions. No synonyms.
3. **Decision-shaping** — changes at least one later decision. Options with no downstream effect are not blocking and should not be surfaced.
4. **Same level of abstraction** — do not mix architectural options with implementation details in one question.
5. **Free of obvious dominance** — if one option is trivially better on all dimensions, merge it into the recommended option and drop the dominated one.

---

## 6. Recommended-Option Rationale

After each question, provide exactly **1–2 sentences**:

> **Why ⭐ [Recommended Option]**: [1–2 sentences.] Key assumption: [assumption]. Main tradeoff: [tradeoff].

---

## 7. Branching Behaviour

| User's answer | Record in recap | Note deviation? | Flag risk? |
|--------------|-----------------|-----------------|------------|
| Recommended option | `Decision N — [topic]: [option] (recommended)` | No | No |
| Non-recommended option | `Decision N — [topic]: [option] (deviation)` | Yes — one sentence why | Yes — name the risk introduced |
| Custom / freeform answer | `Decision N — [topic]: [summary] (custom)` | Yes — one sentence noting it is custom | Yes if it contradicts a project constraint |

---

## 8. Consequence Bridge

Before the next question, write exactly **one sentence** linking the last answer to the next question:

> Because [previous decision outcome], the next blocking question is [topic].

---

## 9. Running Decision Recap

Maintain a compact recap block at the **bottom of each response**, after the current question. One line per decision; do not re-explain earlier decisions.

```
---
**Decision Recap**
- Decision 1 — [Topic]: [chosen option] (recommended)
- Decision 2 — [Topic]: [chosen option] (deviation) ⚠️ Risk: [brief risk note]
- Decision 3 — [Topic]: [summary of custom answer] (custom)
- Contradiction 1 — [Topic]: [resolution] ⚠️ Contradiction: [conflicting requirement text]
```

Rules:

- Include all decisions made so far, in order.
- Add ⚠️ plus a brief risk note for any deviation or custom answer that introduces a constraint.
- Mark `⚠️ Contradiction: [requirement text]` when a chosen option conflicts with a stated requirement of the source design.
- Do not include unresolved decisions.

---

## 10. Session-End Trigger

The session ends when:

- **(a)** No blocking unresolved questions remain, or
- **(b)** The user says "done", "summarise", "that's enough", or equivalent.

Produce the final summary immediately. Do not ask another question after the trigger.

---

## 11. Final Summary Schema

Exactly five sections, in this order:

### Chosen Direction

1–2 sentences describing the overall approach chosen across all decisions.

### Key Decisions

Numbered list of all recap entries, copied verbatim from the running recap.

### Rejected Alternatives

| Option | Why Not Chosen |
|--------|---------------|
| [Option from any question] | [1–2 sentence reason] |

### Risks

Bulleted list of risks introduced by deviations or custom answers. If there were none, write: "No deviations from recommended defaults — risk profile is minimal."

### Open Questions / Follow-up Work

Bulleted list of deferred questions, scoping issues, or intentionally skipped details. If none, write: "None identified."

---

## Related Skills

| Skill | Relationship |
|-------|-------------|
| [pr-description-generator](../pr-description-generator/SKILL.md) | Invokes this skill before writing an ambiguous Implementation Plan |
| [reflect](../reflect/SKILL.md) | Invokes this skill when an improvement proposal has multiple viable directions |
| [solid-principles](../solid-principles/SKILL.md) | Supplies the design vocabulary used to frame architectural options |
| [mandatory-code-requirements](../mandatory-code-requirements/SKILL.md) | Constrains which options are admissible for new classes |
