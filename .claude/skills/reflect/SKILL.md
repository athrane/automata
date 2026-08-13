---
name: reflect
description: "Analytical framework for structured reflection on a GitHub Copilot chat session. Use when asked to reflect on a session, debug why tool calls failed, analyse problem-solving approaches, or generate improvement proposals for the project setup, instructions, prompts, or skill files."
---

# Reflect Skill — Structured Session Reflection

Analytical framework for conducting a structured retrospective on an automata development session. Use it to identify what went well, diagnose failures, and produce actionable improvement proposals.

## When to Use This Skill

Load this skill when:
- A session had repeated tool-call failures or unexpected errors
- The solution required more iterations than expected
- Instructions, skills, or prompts felt ambiguous or incomplete
- You want to improve the overall agent or project setup

## Session Analysis Framework

Use this checklist to assess the overall session quality:

- [ ] **Goals stated vs achieved** — Were all stated goals accomplished?
- [ ] **Tool-call round trips** — How many tool calls were required? A high count relative to complexity indicates inefficiency.
- [ ] **Upfront context gathering** — Was relevant information gathered *before* acting, or discovered reactively?
- [ ] **Validation performed** — Was the validation pipeline (`npm run lint` → `npm run test` → `npm run build`) run before completing the session?

## Problem-Solving Pattern Catalogue

### 1. Explore-then-act (Good)
- Gathers context (file contents, patterns, existing tests) before making changes.
- Continue this pattern; batch multiple reads in parallel.

### 2. Guess-and-check (Risk)
- Acts on assumptions about file contents, iterates on resulting failures.
- Read the target file before editing; verify API signatures with search.

### 3. Over-search (Waste)
- Semantic search used where a direct grep or file read would suffice.
- Use grep for exact symbol names; reserve semantic search for conceptual queries.

### 4. Plan-before-code (Good)
- Creates a todo checklist before starting implementation; follows and updates it.
- Always create a plan for tasks involving 3+ files.

### 5. Shotgun edit (Risk)
- Multiple files changed simultaneously without verifying each change.
- Edit, then validate (lint/test), then proceed to next file.

## Improvement Categories

When generating proposals, check:

- [ ] **Project setup** — `package.json` scripts, jest config, tsconfig, eslint config
- [ ] **Skill files** — Description quality (triggers), content completeness, staleness
- [ ] **Testing** — Low coverage areas, brittle tests, missing edge case tests
- [ ] **Documentation** — Gaps between code and docs, stale references

For each area, proposals should be **specific** (name the exact file), **actionable** (one-sentence change description), and **non-breaking** (don't alter runtime behavior).
