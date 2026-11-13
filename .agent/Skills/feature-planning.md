---
name: feature-planning
description: Turn one explicitly approved WebAudX feature or change into an implementation plan with traceable tasks, dependencies, and verification. Use before implementation begins.
---

# Feature Planning

## Purpose

Create an implementation plan for one WebAudX feature or change. This skill defines the planning workflow. It does not approve product scope or replace the project rules.

## Use this skill when

- An explicitly approved feature or change is ready to be planned.
- An approved feature needs to be divided into implementation tasks.
- Implementation has a dependency or unresolved question that needs to be made visible before work starts.

Do not use this skill to propose an unapproved feature as though it were approved, make product decisions, or expand the approved scope.

## Required inputs

- A clear description of the feature or change.
- Evidence of approval, such as an explicit approval recorded by the product owner or an approved project decision.
- The requirement source and its current status.
- Repository context when the plan is intended to guide implementation.

The current `WebAudX_PRD_v1.0.md` is marked Draft for approval. A requirement appearing in that draft is not, by itself, evidence that the requirement has been approved.

If approval cannot be located, stop before producing an implementation-ready plan. State what approval or decision is missing. You may produce a clearly labelled clarification list, but do not present it as an approved implementation plan.

## Workflow

1. **Confirm authority**
   - Locate the requirement source and check its status.
   - Record the exact section, decision, or issue reference.
   - Treat an issue or task as a tracking reference, not proof of approval, unless it explicitly records the approval.
   - Separate approved requirements, proposed requirements, and unresolved decisions.

2. **Define the outcome**
   - State the intended user-visible or system outcome in one sentence.
   - Identify the actor and the event that starts the flow.
   - List the behaviour included in this feature.
   - List adjacent behaviour that is explicitly excluded.

3. **Map the required flow**
   - Record the trigger, required steps, expected result, and specified failure or empty states.
   - Identify the inputs and outputs at each step.
   - Include only states supported by the approved requirement.
   - Record missing states as open questions; do not invent behaviour to fill them.

4. **Inspect the current project**
   - Locate the relevant implementation, tests, and existing patterns in the actual repository.
   - Record paths only after confirming that the files exist.
   - Read the applicable repository instructions and current project rules.
   - Identify technical dependencies, sequencing dependencies, and approval blockers separately.

5. **Create implementation tasks**
   - Order tasks according to their dependencies.
   - Each task must describe one implementation outcome and one observable verification method.
   - A task is independently understandable when a developer can identify its intended change, relevant requirement, and completion check without guessing.
   - Split a task when it contains multiple independently verifiable outcomes or requires unrelated changes.
   - Do not split tasks solely to create an arbitrary number of steps.

6. **Define verification for every task**
   - Name the existing test or check that verifies the task, if one exists.
   - If no test exists, record a proposed test or an explicit verification gap.
   - Link each check to the requirement it verifies.
   - Do not treat the existence of a test as proof that it covers the requirement; inspect its assertions or observed behaviour.

7. **Review scope and readiness**
   - Remove unrelated refactoring, speculative enhancements, and future-version work.
   - Confirm every task traces to the approved outcome.
   - List unresolved product decisions and technical investigations as blockers, not implementation assumptions.
   - Mark the plan ready only when the approval source, tasks, dependencies, and verification checks are identifiable.

## Expected output

Provide a plan containing:

- Feature outcome and actor
- Approval evidence and requirement reference
- Requirement status: approved, proposed, or unresolved
- Included and excluded behaviour
- Flow and required states
- Confirmed repository paths and existing patterns
- Technical dependencies, sequencing dependencies, and approval blockers
- Ordered implementation tasks, each with one outcome and one verification method
- Test coverage gaps and open questions
- Plan readiness: Ready or Blocked, with the reason

## Completion criteria

The plan is Ready only when approval is evidenced, each implementation task has one identifiable outcome and verification method, dependencies are recorded, and no unresolved product decision is hidden as an implementation assumption.

## Related project guidance

Locate and consult `product-scope.md`, `architecture-and-coding.md`, `security-and-privacy.md`, `testing-and-acceptance.md`, and `user-facing-content.md` when their subjects are affected. Search the repository's documented rules location and project-provided files. Do not assume a directory path. If a referenced file cannot be found, report that and do not invent its contents.

These rules files define project constraints. This skill defines the feature-planning procedure and does not copy those constraints.
