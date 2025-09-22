<!--
Sync Impact Report
- Version change: n/a → 1.0.0
- Modified principles: (initial adoption)
- Added sections: Core Principles; Security Requirements; Development Workflow & Quality Gates; Governance
- Removed sections: none
- Templates requiring updates:
  ✅ /Users/ntufar/projects/intellivault/.specify/templates/plan-template.md (version reference)
  ✅ /Users/ntufar/projects/intellivault/.specify/memory/constitution.md (this file)
  ✅ /Users/ntufar/projects/intellivault/.specify/templates/spec-template.md (reviewed, no changes)
  ✅ /Users/ntufar/projects/intellivault/.specify/templates/tasks-template.md (reviewed, no changes)
  ⚠ Pending: None
- Deferred TODOs:
  - TODO(RATIFICATION_DATE): Original adoption date unknown; set once confirmed
-->

# Intellivault Constitution

## Core Principles

### I. Contract- and Test-First Delivery (NON-NEGOTIABLE)
All new behavior MUST begin with a user-facing contract (API/CLI schema) and
failing automated tests. Follow Red-Green-Refactor. No implementation may be
merged without corresponding tests that fail before code and pass after.
Rationale: Ensures correctness, prevents regressions, and makes requirements
executable.

### II. Simplicity First, Then Security by Design
Prefer the simplest viable design that meets requirements. Security controls are
non-optional: apply least privilege, secure defaults, explicit allow-lists,
idempotent operations, and safe failure modes. Secrets and keys MUST never be
logged or stored in plaintext.
Rationale: Simplicity reduces attack surface; security disciplines protect data
and users.

### III. CLI-First with Text I/O
Every capability MUST be invocable via a deterministic CLI with text I/O:
stdin/args → stdout; errors → stderr; support JSON and human-readable outputs.
Commands MUST be composable and scriptable.
Rationale: Improves automation, testing, and interoperability across tools.

### IV. Observability and Auditability
Structured logs, metrics, and traces MUST be emitted for critical paths.
Security-sensitive actions MUST be audited (who, what, when, result). No secret
material may appear in logs. Health checks and diagnostics MUST exist for
operational readiness.
Rationale: Enables debugging, incident response, and compliance.

### V. Versioning and Backward Compatibility
Public interfaces (CLI flags, file formats, APIs) MUST be versioned using
semantic versioning. Backward-incompatible changes require a MAJOR bump and a
documented migration path. Deprecations MUST include warnings for at least one
MINOR release before removal when feasible.
Rationale: Preserves user trust and enables safe evolution.

## Security Requirements

- Data at rest and in transit MUST be encrypted using industry-standard
  algorithms. Keys MUST be rotated and stored in a secure KMS or equivalent.
- Secrets MUST never be committed to VCS. Use `.env.example` and vault
  references instead.
- Access MUST be role-based; default deny. Administrative actions require
  MFA and are auditable.
- PII handling MUST document retention and deletion; only collect minimum
  necessary data.
- Supply chain: Pin dependencies, verify checksums, and track SBOM when
  applicable.

## Development Workflow & Quality Gates

- Every change includes: tests, documentation updates, and observable signals
  as applicable.
- Constitution Check MUST be performed at plan and post-design stages. Violations
  require explicit justification in plan complexity tracking.
- Lint, type checks, and tests MUST pass in CI before merge. All new contracts
  MUST have failing tests prior to implementation.
- Performance and error budgets MUST be declared for critical paths when
  introduced and validated before release.

## Governance

- Authority: This constitution supersedes conflicting practices. Exceptions are
  temporary and MUST be documented with an expiry.
- Amendments: Propose via PR updating this document with version bump and
  migration notes. Approval by maintainers required.
- Version Policy: Use semantic versioning for the constitution itself:
  MAJOR for incompatibilities; MINOR for new or materially expanded sections;
  PATCH for clarifications that do not change obligations.
- Compliance Reviews: PR reviewers MUST verify adherence to principles and
  update plan/task gates accordingly. Noncompliance blocks merge unless an
  approved exception exists.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): Original adoption date unknown | **Last Amended**: 2025-09-22