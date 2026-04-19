# GitHub Pull Request Template

Generic template for creating pull requests in the Herodotus project.

## PR Title Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring (no functional changes)
- `test`: Adding or updating tests
- `chore`: Build process, dependency updates, tooling
- `perf`: Performance improvements
- `style`: Code style/formatting changes

**Examples**:
- `feat(realm): Add resource modifier system`
- `fix(chronicle): Correct event timestamp calculation`
- `docs(readme): Update installation instructions`
- `refactor(ecs): Simplify component matching logic`
- `test(world): Add tests for feature generation`

## PR Description Template

```markdown
## Summary
Brief description of what this PR accomplishes (1-3 sentences).

## Motivation
Why is this change needed? What problem does it solve?

## Changes

### Files Deleted

- **Delete `[path/to/file]`** — [Reason for deletion]

### Files Updated

- **`[path/to/file]`** — [Description of changes]

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

## Implementation Plan

Describe the ordered execution phases for this PR:

### Phase 1 — [Phase name]

[Description of steps]

### Phase 2 — [Phase name]

[Description of steps]

## Testing

### TypeScript unit tests

[Describe which test files are added/updated, or note if no test changes are required and why.]

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing (`npm run test`)

**Test coverage**: [If applicable, note new/changed test coverage]

### Manual validation steps

| # | Check | How to verify |
|---|-------|---------------|
| 1 | [Check description] | [Verification method] |

## Documentation Plan

_Omit this section if no documentation changes are required._

Describe the documentation changes needed:

| File | Changes |
|------|---------|
| `[path/to/doc.md]` | [Description of changes] |

## Related Issues
Closes #[issue-number]
Related to #[issue-number]

## Checklist
- [ ] Code follows project conventions (static factory methods, TypeUtils validation, etc.)
- [ ] TypeScript types are correct (`npm run typecheck` passes)
- [ ] Code lints without errors (`npm run lint` passes)
- [ ] All tests pass (`npm run test` passes)
- [ ] Build succeeds (`npm run build` passes)
- [ ] JSDoc comments added for public APIs
- [ ] Updated documentation (if applicable)
- [ ] No breaking changes (or documented in PR description)
- [ ] Commit messages follow Conventional Commits format

## Additional Notes
Any additional context, screenshots, or information that reviewers should know.
```

## PR Review Checklist (for Reviewers)

### Code Quality
- [ ] Code follows project architectural patterns (ECS, Builder, Factory methods)
- [ ] TypeScript strict mode compliance
- [ ] Proper use of TypeUtils for validation
- [ ] Static factory methods used consistently
- [ ] Null object pattern implemented where appropriate
- [ ] No use of `Math.random()` (uses `RandomComponent` instead)

### Testing
- [ ] Adequate test coverage for new/changed code
- [ ] Tests follow established patterns
- [ ] Integration tests added for system interactions (if applicable)
- [ ] Tests are deterministic and reproducible

### Documentation
- [ ] JSDoc comments for public APIs
- [ ] Inline comments for complex logic
- [ ] README or documentation updated (if applicable)
- [ ] Coding instructions updated (if new patterns introduced)

### Build & Validation
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] No console errors or warnings (except expected validation output)

### Architecture
- [ ] Changes align with existing architectural patterns
- [ ] No unnecessary dependencies introduced
- [ ] Proper separation of concerns (Components = data, Systems = logic)
- [ ] FilteredSystem used when appropriate for entity filtering
