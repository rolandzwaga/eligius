<!--
Sync Impact Report:
Version: 1.2.0 → 1.3.0 (MINOR: Path aliases requirement added)
Modified Principles: N/A
Added Sections: XXI. Path Aliases for Imports (NON-NEGOTIABLE)
Removed Sections: N/A
Templates Requiring Updates:
  ✅ CLAUDE.md (Import Organization section - updated to mandate path aliases)
Follow-up TODOs: None
Amendment Rationale: Mandates using TypeScript path aliases (@locale/, @adapters/, @eventbus/, @test/, @/, etc.) instead of relative imports for cross-module imports. Improves code readability and maintainability.
-->

# Eligius Project Constitution

**Version**: 1.3.0
**Purpose**: Define non-negotiable development principles, standards, and governance for Eligius - A JavaScript Story Telling Engine

---

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

**STRICTLY ENFORCED**: Every feature MUST begin with tests before any implementation code is written. No implementation code shall be written without a failing test first.

**What Requires Tests** (must write test FIRST):
- All functions, methods, and business logic
- All timeline operations and providers
- All action and operation handlers
- All configuration parsing and validation
- All utilities and helpers
- All controllers and state management
- All engine orchestration logic

**What Does NOT Require Tests**:
- Pure type definitions (`type`, `interface` in type files)
- Configuration files
- Barrel exports (index files with only re-exports)
- JSON schema definitions

**Test-First Workflow** (NO EXCEPTIONS):
1. **RED**: Write failing test that describes desired behavior
2. **GREEN**: Write MINIMUM code to pass test
3. **REFACTOR**: Improve while keeping tests green
4. **NEVER**: Write implementation code before test exists

**Enforcement**:
- ANY file containing executable code MUST have corresponding `.spec.ts` file
- Implementation commits without tests will be rejected in code review
- "I'll add tests later" is NOT acceptable

**Rationale**: Test-first development ensures that every behavior is explicitly defined and verified before implementation, reducing the risk of bugs. Tests written after implementation often miss edge cases and don't drive proper design. For a runtime engine like Eligius, this is critical to ensure reliability.

### II. Technology Stack (Non-negotiable)

The following technology choices are mandatory and MUST NOT be substituted without a constitutional amendment:

**Core Stack**:
- **Language**: TypeScript with strict mode enabled (`"strict": true`)
- **Build Tool**: tsdown
- **Testing Framework**: Vitest (config: src/vitest.config.ts)
- **Code Quality Tools**: Biome (lint, format, check)
- **Runtime Environment**: Node.js >=20
- **Module System**: ESM (ES Modules)

**Peer Dependencies** (Consumer Provided):
- **jQuery**: 3.7.1 (DOM manipulation)
- **lottie-web**: 5.13.0 (animation support)
- **video.js**: 8.23.4 (video timeline provider)

**Core Dependencies**:
- **hotkeys-js**: 3.13.15 (keyboard interaction)
- **ts-is-present**: 1.2.2 (type guards)
- **uuid**: 13.0.0 (unique identifiers)

**Architectural Constraints**:
- All exports MUST be ESM-compatible
- Public API exposed through `dist/index.js`
- Type definitions generated in `dist/` directory
- JSON schema published in `jsonschema/` directory
- Source code organized in `src/` directory

**Rationale**: This stack provides type safety (TypeScript), fast testing (Vitest), modern code quality tooling (Biome), and efficient bundling (tsdown). Peer dependencies allow consumers to control versioning of heavyweight libraries.

### III. Security & Compliance First

**CRITICAL**: All development MUST maintain secure coding practices. Security is not optional.

**Security Requirements**:
- Validate and sanitize ALL configuration inputs before processing
- NEVER execute arbitrary code from configuration without validation
- Prevent prototype pollution in configuration parsing
- Sanitize all DOM manipulation operations to prevent XSS
- Validate timeline provider inputs to prevent injection attacks
- NEVER log sensitive user data or configuration secrets
- Use secure random ID generation (uuid) for internal identifiers

**Browser Security**:
- All DOM operations MUST sanitize user-provided content
- Configuration-driven HTML rendering MUST escape potentially dangerous content
- Event handlers MUST validate event sources
- Timeline scrubbing MUST prevent unauthorized state manipulation

**Rationale**: Eligius processes user-provided JSON configurations and manipulates the DOM. Without strict security practices, this could create XSS vulnerabilities or allow malicious configurations to compromise consumer applications.

### IV. Code Quality & Architecture

All code MUST adhere to consistent quality standards:

**Code Quality Enforcement (MANDATORY)**:
- After completing EACH task, run quality checks:
  1. `npm run lint` - Identify and auto-fix linting issues with Biome
  2. `npm run format` - Format code according to Biome standards
  3. `npm run typecheck` - Verify type correctness with TypeScript
  4. `npm run fix` - Run all Biome checks and auto-fix
- Review all output and manually fix ANY remaining issues
- A task is NOT complete until all checks pass without errors or warnings
- NEVER commit code with unresolved errors

**Architectural Standards**:
- Every feature begins as a standalone, testable module
- Use type system to enforce business rules at compile time
- Avoid `any` type assertions; prefer proper type narrowing
- Keep functions pure and manage side-effects explicitly
- Minimize shared mutable state; prefer immutable data structures
- Each module MUST have a single, well-defined responsibility
- Timeline operations MUST be atomic and reversible
- Engine state MUST be predictable and testable

**Rationale**: Consistent code quality prevents technical debt, reduces code review friction, and ensures maintainability. For a runtime engine, architectural discipline prevents state corruption and timing bugs.

### V. Domain-Specific Requirements

**Timeline Engine Requirements**:

**Timeline Precision**:
- Timeline positions MUST be precise to 0.1 seconds (100ms granularity)
- Timeline providers MUST report time with >=100ms accuracy
- Action scheduling MUST account for sub-second timing
- Scrubbing operations MUST maintain 100ms precision

**Timeline Operations**:
- Timeline play/pause/stop MUST be synchronous state changes
- Timeline scrubbing MUST be idempotent
- Action execution MUST be deterministic for given timeline position
- Timeline state MUST be serializable and restorable

**Configuration Integrity**:
- JSON configuration MUST validate against published JSON schema
- Invalid configurations MUST fail fast with clear error messages
- Configuration versioning MUST be backward-compatible within major versions
- Configuration parsing MUST be pure (no side effects)

**Browser Compatibility**:
- Code MUST work in all modern browsers (last 2 versions of Chrome, Firefox, Safari, Edge)
- Use standard DOM APIs; avoid browser-specific extensions
- Test critical paths in multiple browsers during development
- Document any known browser-specific quirks

**Performance Requirements**:
- Timeline tick processing MUST be optimized for <16ms execution (60fps)
- Action execution MUST NOT block timeline progression
- Configuration parsing MUST be lazy where possible
- Memory usage MUST be bounded (no memory leaks in long-running timelines)
- DOM operations MUST be batched to minimize reflows/repaints

**Rationale**: Eligius is a runtime engine for timeline-based storytelling. Precision, performance, and predictability are essential for smooth user experiences. Sub-second precision enables fine-grained control for animations and media synchronization.

### VI. Testing Standards

Testing is comprehensive and mandatory:

**REQUIRED: Consult Testing Guide First**:
- Before writing or modifying any tests, read `specs/TESTING-GUIDE.md`
- The testing guide contains project-specific patterns, mocking strategies, and best practices
- Includes timer mocking with `vi.useFakeTimers()`, module mocking with `vi.hoisted()`, and real-world examples

**Test Types**:
- **Unit Tests**: Required for all business logic, utilities, pure functions, and isolated modules
- **Integration Tests**: Required for timeline orchestration, action execution, and cross-module interactions
- **Edge Case Testing**: Test error paths, boundary conditions, and edge cases
- **Isolation**: Mock external dependencies; test modules in isolation

**Coverage Requirements (MANDATORY)**:
- **Minimum 90% code coverage** for all business logic
- Coverage config in src/vitest.config.ts
- Run `npm run coverage` to verify

**Coverage Verification (MANDATORY)**:
- **AFTER spec completion**: Run coverage report
- **Analyze coverage**: Review and identify files below 90% threshold
- **Implement missing tests**: Write additional tests to achieve 90%
- **Exception process**: If coverage cannot be achieved:
  1. **STOP IMMEDIATELY**
  2. Document specific files/functions that cannot reach threshold
  3. Provide detailed technical justification
  4. Present findings to user and **WAIT for explicit approval**
  5. Only proceed after approval or alternative approach
- **NO EXCEPTIONS** for business logic without user approval

**Test Organization**:
```
src/test/
├── unit/          # Pure function and business logic tests
└── integration/   # Timeline orchestration and cross-module tests
```

**Test Naming**:
- Use descriptive names (Given-When-Then format preferred)
- Example: `test('given paused timeline, when play called, then timeline state becomes playing')`

**Test Location**:
- All tests in `src/test/unit/` or `src/test/integration/`
- Test file naming: Match source file structure (e.g., `src/engine/timeline.ts` → `src/test/unit/engine/timeline.spec.ts`)

**Rationale**: Comprehensive testing catches bugs before production. 90% coverage ensures no critical code paths are left untested. For a runtime engine, untested code paths can cause unpredictable behavior in production.

### VII. Development Workflow

All development MUST follow Test-First Development:

1. **Red**: Write failing test (BEFORE ANY IMPLEMENTATION)
2. **Green**: Write minimum code to make test pass
3. **Refactor**: Improve code while keeping tests green
4. **Quality Gate**: Run quality checks (`npm run fix && npm run typecheck`)
5. **Fix Issues**: Resolve any errors
6. **Commit**: Commit tests and implementation together after all checks pass
7. **Review**: Ensure all tests pass before requesting code review

**Test-First Enforcement**:
- NEVER write implementation code before test exists
- Each commit MUST show test written before implementation
- Every PR MUST include tests for new functionality
- Breaking changes MUST be discussed and approved

**Rationale**: The Red-Green-Refactor cycle ensures disciplined development. Quality enforcement prevents technical debt accumulation. For Eligius, this discipline is critical for engine stability.

### VIII. Performance & User Experience

**Real-time Timeline Performance**:
- Timeline tick processing MUST complete in <16ms (60fps target)
- Action execution MUST NOT block RequestAnimationFrame loop
- Large configuration parsing MUST use chunking or lazy loading
- Timeline state updates MUST use efficient data structures

**Initial Load Performance**:
- Engine initialization MUST complete in <500ms for typical configurations
- Configuration parsing MUST be incremental where possible
- Resource loading (if any) MUST be asynchronous and non-blocking

**Interaction Responsiveness**:
- Timeline scrubbing MUST respond in <100ms
- Play/pause/stop controls MUST respond in <50ms
- User-triggered actions MUST provide immediate feedback

**Perceived Performance**:
- Long-running operations MUST provide progress indicators
- Async operations MUST show loading states
- Errors MUST be reported immediately with actionable messages

**Memory Management**:
- Timeline cleanup MUST release all resources
- Event listeners MUST be properly removed on teardown
- DOM references MUST be cleared when no longer needed
- Long-running timelines MUST NOT accumulate memory

**Rationale**: Eligius is a real-time engine. Performance directly impacts user experience. Poor performance breaks the illusion of smooth storytelling.

### IX. Accessibility & Usability

**Consumer Responsibility**:
- Eligius is a headless engine; accessibility is primarily the consumer's responsibility
- Provide utilities and APIs that enable accessible implementations

**API Usability**:
- Public APIs MUST have clear, comprehensive TypeDoc comments
- Error messages MUST be actionable and helpful
- Configuration validation errors MUST pinpoint exact location and issue
- API design MUST follow principle of least surprise

**Developer Experience**:
- TypeScript types MUST be comprehensive and accurate
- IDE autocomplete MUST work correctly for all public APIs
- Configuration JSON schema MUST provide helpful validation messages
- Error stack traces MUST be meaningful (avoid deeply nested internals)

**Rationale**: While Eligius doesn't directly render UI, good developer experience and helpful APIs enable consumers to build accessible applications.

### X. Research & Documentation Standards

When researching implementations, accuracy is critical:

**Documentation Sources**:
- MDN for Web APIs (DOM, RequestAnimationFrame, etc.)
- TypeScript handbook for type system features
- Vitest documentation for testing patterns
- jQuery documentation for DOM manipulation patterns (peer dependency)
- lottie-web and video.js documentation for integration patterns

**Research Requirements**:
- Verify API signatures and patterns against official documentation
- Query documentation BEFORE writing unfamiliar code
- Cross-reference implementation patterns with best practices
- Document discrepancies between documentation and actual behavior
- Test edge cases discovered in documentation

**Rationale**: Outdated or incorrect library usage leads to bugs and technical debt. Eligius integrates with multiple libraries; accurate usage is critical.

### XI. Dependency Management

**CRITICAL**: Dependency changes affect stability, security, and maintainability.

**Strict Rules**:
- **DO NOT** automatically install or modify package.json
- **DO NOT** add dependencies without user consultation
- **DO NOT** change peer dependency versions without user approval
- When new dependency is required, **STOP** and discuss first
- **DO NOT** continue until user approval is obtained

**What Requires Discussion**:
- Adding new production dependencies
- Adding new peer dependencies
- Updating major versions of existing dependencies
- Removing any dependency
- Changing dependency version constraints

**Approval Process**:
1. Identify need during planning
2. Research alternatives (can existing dependencies solve this?)
3. Document requirement and justification
4. Present options with pros/cons (bundle size, maintenance, alternatives)
5. Wait for explicit approval
6. Proceed only after approval

**Allowed Without Approval**:
- Updating devDependencies patch versions for security fixes (document in PR)
- Adding devDependencies for tooling (with justification in PR)

**Rationale**: Eligius is a library consumed by others. Dependency changes affect consumer bundle sizes, version conflicts, and security posture. Peer dependencies must be carefully managed to avoid version lock-in.

### XII. Framework-Specific Restrictions

**STRICTLY FORBIDDEN**:
- **NEVER** use React, Vue, Angular, or framework-specific patterns in core engine code
- **NEVER** assume a specific build tool or bundler in library code
- **NEVER** use CommonJS `require()` (ESM only)
- **NEVER** mutate peer dependency objects (jQuery, lottie-web, video.js instances)
- **NEVER** bundle peer dependencies into distribution

**Allowed Patterns**:
- Use jQuery for DOM manipulation (it's a peer dependency)
- Use standard ES6+ features (transpiled by tsdown)
- Use TypeScript features that compile to clean JavaScript
- Use standard Web APIs (DOM, fetch, etc.)

**When Uncertain**:
1. **STOP** if unsure whether pattern is allowed
2. Verify pattern is framework-agnostic
3. Check if pattern works in vanilla JavaScript/TypeScript
4. Ask user for clarification

**Rationale**: Eligius is a library-agnostic runtime engine. Framework-specific patterns would limit consumer adoption and create unnecessary coupling.

### XIII. Debugging Attempt Limit (NON-NEGOTIABLE)

**CRITICAL**: Limited to **5 attempts** before requiring user consultation.

**The 5-Attempt Rule**:
1. **Attempt 1**: Initial diagnosis and first solution
2. **Attempt 2**: Different approach based on new information
3. **Attempt 3**: Research issue more deeply
4. **Attempt 4**: Try fundamental approach or alternative
5. **Attempt 5**: Document attempts and prepare questions

**After 5 Failed Attempts**:
- **STOP IMMEDIATELY**
- **DOCUMENT** what was tried and why each failed
- **ANALYZE** common patterns across failures
- **FORMULATE** specific questions
- **PRESENT** findings to user
- **WAIT** for user response

**Rationale**: After 5 attempts, problem likely requires different perspective or approach. For complex engine issues, user insight is often necessary.

### XIV. Concise Communication (NON-NEGOTIABLE)

**CRITICAL**: Respect user's time with brief, technical communication.

**Communication Rules**:
- Keep responses SHORT and TO THE POINT
- Assume senior-level technical knowledge
- NO hand-holding explanations
- NO verbose status updates
- State what you did, not how or why (unless asked)
- Use bullet points for multiple items
- Omit unnecessary pleasantries

**Good Examples**:
- ✅ "Updated constitution v1.0.0. Added timeline precision requirement (100ms)."
- ✅ "Fixed TypeScript errors in 3 operation files. Tests pass. 92% coverage."

**Bad Examples**:
- ❌ "I've successfully updated the constitution! Let me walk you through..."
- ❌ "Perfect! I'm so happy to report that all tests passed..."

**Rationale**: Senior developers don't need explanations of basic operations. Concise communication respects time and focuses on outcomes.

### XV. Token Efficiency (NON-NEGOTIABLE)

**CRITICAL**: Token usage is finite. NEVER generate redundant documentation.

**Prohibited**:
- **NEVER** generate test coverage reports in documentation
- **NEVER** copy/paste command output into markdown
- **NEVER** document metrics that can be obtained by running commands
- **NEVER** duplicate machine-readable information
- **NEVER** paste entire configuration JSONs unless specifically needed

**Required**:
- **ALWAYS** run commands to view output
- **ONLY** document INSIGHTS requiring human interpretation
- **VERIFY** via command output, not documentation
- Reference file paths for details instead of duplicating content

**Rationale**: Machine-readable output wastes tokens. Documentation should add insight, not duplicate tools. For large configurations, reference instead of duplicate.

### XVI. Zero Failing Tests Policy (NON-NEGOTIABLE)

**CRITICAL**: EVERY spec delivered with ALL tests passing. ANY failing test is IMMEDIATE problem.

**Absolute Requirements**:
- **ALL tests MUST pass** before spec is complete
- **ALL tests MUST pass** before ANY commit
- **ALL tests MUST pass** in CI/CD before merge
- Failing test is YOUR responsibility to fix immediately
- NO "pre-existing failing tests" - this is impossible

**When Tests Fail**:
1. **STOP** all other work
2. **ANALYZE** the failure
3. **FIX** test or code causing failure
4. **VERIFY** all tests pass
5. If unable to fix after 5 attempts, **CONSULT USER**

**NO Excuses Accepted**:
- ❌ "Those failures were already there" → IMPOSSIBLE. Fix them.
- ❌ "That's not my code" → IRRELEVANT. Fix it.
- ❌ "I'll fix it later" → NO. Fix it NOW.

**Rationale**: Failing tests indicate broken functionality. Every spec is delivered with clean, passing test suite. For a runtime engine, any failing test could indicate critical bugs.

### XVII. Technical Overview Reference (NON-NEGOTIABLE)

**CRITICAL**: ALWAYS consult technical documentation before creating specs/plans/tasks.

**Mandatory Consultation**:
- **BEFORE spec**: Read technical docs to understand existing architecture
- **BEFORE plan**: Check docs for existing modules/utilities to reuse
- **BEFORE tasks**: Verify docs for implementation patterns
- **AFTER completion**: UPDATE docs with new utilities/patterns

**What to Check**:
- Existing operations and their implementations
- Timeline provider patterns
- Action execution patterns
- Configuration parsing utilities
- Testing helpers and fixtures
- Type definitions and interfaces
- Engine orchestration patterns

**Prevention of Duplication**:
- Check if operation already exists before creating new one
- Verify reusable utilities exist
- Check for existing test helpers
- Review existing configuration schema before extending

**Update Requirements After Completion**:
- Add new operations to documentation
- Add new patterns to documentation
- Update JSON schema if configuration format changed
- Document architectural decisions
- Update TypeDoc comments for public APIs

**Rationale**: Code duplication is major source of technical debt. For Eligius, operation duplication could lead to inconsistent behavior and bloated configurations.

### XVIII. Configuration Schema Integrity (NON-NEGOTIABLE)

**CRITICAL**: JSON schema is a contract with consumers. Schema changes are breaking changes.

**Schema Requirements**:
- JSON schema MUST be regenerated after configuration format changes
- Schema changes MUST be versioned (major version bump for breaking changes)
- Schema validation errors MUST provide clear, actionable messages
- Schema MUST be published in `jsonschema/` directory
- Schema MUST be accessible at published URL (GitHub Pages)

**Schema Update Workflow**:
1. Modify configuration TypeScript types
2. Run `npm run generate-schema` to regenerate schema
3. Verify schema validates existing configurations
4. Update documentation with schema changes
5. If breaking change, increment major version

**Configuration Validation**:
- Configuration parsing MUST validate against schema
- Invalid configurations MUST fail fast with schema violation details
- Validation errors MUST pinpoint exact JSON path and issue
- Provide suggestions for fixing common validation errors

**Rationale**: Eligius consumers rely on JSON schema for configuration validation and IDE autocomplete. Schema integrity ensures consumers can trust their configurations.

### XIX. Public API Stability (NON-NEGOTIABLE)

**CRITICAL**: Eligius is a published library. API changes affect all consumers.

**API Stability Rules**:
- Public API changes require major version bump
- Adding optional parameters is minor version bump
- Adding new exports is minor version bump
- Deprecation warnings required before removal (one major version notice)
- Internal APIs MUST NOT be exported from `dist/index.js`

**Breaking Change Process**:
1. Document breaking change and migration path
2. Discuss with user before implementation
3. Add deprecation warnings in prior version if possible
4. Increment major version
5. Document in CHANGELOG (if exists) or release notes

**API Documentation**:
- All public APIs MUST have comprehensive TypeDoc comments
- Include usage examples in complex APIs
- Document edge cases and error conditions
- Link to related configuration schema sections

**Rationale**: Eligius is consumed by other projects. Breaking changes without notice or migration paths harm users. Semantic versioning and deprecation warnings provide predictability.

### XX. Documentation Research Standards (NON-NEGOTIABLE)

**CRITICAL**: Whenever research is being done, it is REQUIRED to use the Context7 MCP server to consult the most up-to-date documentation.

**Research Requirements**:
- ALWAYS use Context7 MCP server tools (`mcp__context7__resolve-library-id` and `mcp__context7__get-library-docs`) when researching library APIs, patterns, or integration approaches
- BEFORE writing code that uses external libraries (jQuery, lottie-web, video.js, Vitest, TypeScript features), consult Context7 for current documentation
- NEVER rely solely on training data for library usage patterns - APIs change frequently
- Context7 provides access to official, versioned documentation for accuracy

**When to Use Context7**:
- During Phase 0 (Research) of feature planning - for technology choices and patterns
- When implementing operations that integrate with peer dependencies (jQuery, lottie-web, video.js)
- When using testing framework features (Vitest API usage)
- When exploring TypeScript language features or build tool configurations
- When uncertain about current API signatures, method names, or best practices

**Research Workflow**:
1. Identify library or technology needing research
2. Use `mcp__context7__resolve-library-id` to find the correct library ID
3. Use `mcp__context7__get-library-docs` to fetch up-to-date documentation
4. Extract relevant API patterns, signatures, and examples
5. Document findings in research.md or plan artifacts
6. Apply discovered patterns in implementation

**Prohibited**:
- NEVER guess API signatures without Context7 verification
- NEVER assume library behavior based on outdated knowledge
- NEVER write integration code without consulting current documentation

**Rationale**: Outdated or incorrect library usage leads to runtime bugs, deprecated API usage, and technical debt. For Eligius, which integrates with multiple peer dependencies and testing frameworks, accurate and current documentation is critical. Context7 provides versioned, official documentation that prevents bugs from outdated patterns.

### XXI. Path Aliases for Imports (NON-NEGOTIABLE)

**CRITICAL**: ALWAYS use TypeScript path aliases instead of relative imports.

**Available Path Aliases** (defined in tsconfig.json):
- `@/*` → `src/*` (general source files)
- `@locale/*` → `src/locale/*` (locale module)
- `@adapters/*` → `src/adapters/*` (adapter implementations)
- `@eventbus/*` → `src/eventbus/*` (eventbus module)
- `@test/*` → `src/test/*` (test utilities and fixtures)
- `@configuration/*` → `src/configuration/*` (configuration module)
- `@timelineproviders/*` → `src/timelineproviders/*` (timeline providers)

**Mandatory Rules**:
- **ALWAYS** use path aliases for cross-module imports
- **NEVER** use relative paths like `../../../` across module boundaries
- Relative imports (`./` or `../`) are ONLY allowed within the same module directory
- Import from barrel exports (`index.ts`) where available

**Correct Examples**:
```typescript
// ✅ Correct - using path aliases
import type { ILocaleManager } from '@locale/types.ts';
import { EligiusEngine } from '@/eligius-engine.ts';
import { createMockEventbus } from '@test/fixtures/eventbus-factory.ts';
import type { IEventbus } from '@eventbus/types.ts';

// ✅ Correct - relative import within same module
import { helperFunction } from './helper.ts';
```

**Incorrect Examples**:
```typescript
// ❌ Incorrect - relative paths crossing module boundaries
import type { ILocaleManager } from '../../../locale/types.ts';
import { EligiusEngine } from '../../eligius-engine.ts';
import { createMockEventbus } from '../fixtures/eventbus-factory.ts';
```

**Enforcement**:
- Code reviews MUST reject relative paths crossing module boundaries
- Run `npm run fix` to auto-sort imports after adding new ones
- TypeScript compiler validates path aliases at build time

**Rationale**: Path aliases improve code readability by making import sources immediately clear. They eliminate fragile relative paths that break when files are moved. They also enable IDE autocomplete and refactoring support. For a large codebase like Eligius, consistent import patterns are essential for maintainability.

## Technology Stack Requirements

### Mandatory Dependencies

**Production**:
- hotkeys-js: 3.13.15 (keyboard interaction handling)
- ts-is-present: 1.2.2 (type guard utilities)
- uuid: 13.0.0 (unique identifier generation)

**Peer Dependencies** (Consumer Provided):
- jquery: 3.7.1 (DOM manipulation)
- lottie-web: 5.13.0 (animation provider)
- video.js: 8.23.4 (video timeline provider)

**Development**:
- TypeScript: 5.9.3 (type safety)
- Vitest: 3.2.4 (testing framework)
- Biome: 2.3.2 (linting and formatting)
- tsdown: 0.15.11 (build tool)
- TypeDoc: 0.28.14 (documentation generation)
- tsx: 4.20.6 (TypeScript execution)

### Configuration

**TypeScript Configuration**:
- Strict mode enabled (`"strict": true`)
- Target: Modern ES (ESM output)
- Module: ESNext
- Declaration files generated

**Biome Configuration**:
- Follow project's Biome config
- Auto-fix enabled for standard issues
- Format on quality gate

**Vitest Configuration**:
- Config file: src/vitest.config.ts
- Coverage threshold: 90%
- Test directories: `src/test/unit/`, `src/test/integration/`
- Single-threaded execution for deterministic tests

## Development Workflow

### Feature Development Process

1. **Technical Documentation Consultation**: Read technical docs and existing code
2. **Specification**: Create feature spec using `/speckit.specify`
3. **Planning**: Generate implementation plan using `/speckit.plan`
4. **Clarification**: Use `/speckit.clarify` to resolve underspecified areas
5. **Task Generation**: Generate tasks using `/speckit.tasks`
6. **Test-First Implementation**: For each task:
   - Write failing test(s) first (RED)
   - Implement minimum code to pass (GREEN)
   - Refactor while keeping tests green (REFACTOR)
   - Run quality checks (`npm run fix && npm run typecheck`)
   - Fix all issues
   - Commit atomically
7. **Coverage Verification**: Verify 90% threshold after spec completion (`npm run coverage`)
8. **All Tests Passing**: Ensure ALL tests pass before completion (`npm test`)
9. **Update Technical Docs**: Document new operations/patterns/APIs
10. **Schema Update**: Regenerate schema if configuration format changed (`npm run generate-schema`)
11. **Review**: Submit PR with all checks passing

### Git Workflow

- **Branch Naming**: `feature/description` or `fix/description`
- **Commit Messages**: Conventional commits format preferred
- **Atomic Commits**: Each commit is complete working unit
- **No Broken Commits**: Never commit failing tests or quality violations
- **PR Requirements**: Include tests, pass CI, meet 90% coverage requirement

### Code Review Standards

All code reviews MUST verify:
- [ ] Tests written BEFORE implementation (check git history)
- [ ] Every file has corresponding `.spec.ts` in `src/test/`
- [ ] All tests passing (EVERY SINGLE TEST - run `npm test`)
- [ ] Coverage >= 90% for business logic (run `npm run coverage`)
- [ ] Quality checks pass without errors (`npm run fix && npm run typecheck`)
- [ ] No framework-specific patterns in core engine
- [ ] Technical docs consulted and updated
- [ ] No duplicate operations or utilities
- [ ] JSON schema updated if configuration format changed
- [ ] No unauthorized dependency changes
- [ ] Public API changes documented and justified
- [ ] Timeline precision requirements met (100ms)
- [ ] Performance requirements met (60fps, <16ms tick processing)

## Governance

### Constitutional Authority

This constitution supersedes all other practices. When conflicts arise, this constitution takes precedence.

### Amendment Process

1. **Proposal**: Document change, rationale, impact, migration plan
2. **Review**: Technical lead (project maintainer) reviews
3. **Approval**: Requires project maintainer approval
4. **Documentation**: Document with version bump
5. **Migration**: Include migration guide for breaking changes

### Versioning Policy

Semantic versioning:
- **MAJOR**: Backward-incompatible changes, principle removals, fundamental governance changes
- **MINOR**: New principles added, expanded guidance, additional requirements
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Verification

**Every Pull Request MUST**:
- Verify adherence to all principles
- Document exceptions with justification
- Pass all automated checks (`npm run fix && npm run typecheck && npm test`)
- Meet 90% coverage requirement
- Include compliance verification in PR description

**Quarterly Reviews**:
- Constitution effectiveness review
- Principle adherence audit
- Technology stack assessment
- Dependency security audit
- Performance benchmarking

### Exceptions

Exceptions are **extremely rare** and require:
1. Written justification with technical reasoning
2. Risk assessment and mitigation plan
3. Approval from project maintainer
4. Time-bound exception with remediation plan
5. Documentation in exceptions log (if exists)

**Note**: The following principles have **NO exceptions**:
- Test-First Development (Principle I)
- Zero Failing Tests Policy (Principle XVI)
- Timeline Precision Requirements (Principle V)
- Public API Stability (Principle XIX)
- Configuration Schema Integrity (Principle XVIII)
- Path Aliases for Imports (Principle XXI)

---

**Version**: 1.3.0 | **Ratified**: 2025-10-28 | **Last Amended**: 2025-12-13
