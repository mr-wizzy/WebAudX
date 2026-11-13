# WebAudX Architecture and Coding Rules

## 1. Authority
- The current WebAudX PRD v1.0 is marked **Draft for approval**.
- The PRD does not select a programming language, framework, database, hosting provider, package manager, or repository structure.
- Do not describe any technology choice as approved unless the product owner has explicitly approved it.
- Once a repository is available, its existing structure and conventions are the implementation baseline.
- Repository conventions govern implementation style only. They must not override approved product, security, privacy, or acceptance requirements.

## 2. Required repository inspection
Before proposing or changing code:
1. Inspect the repository root and its existing files.
2. Identify the language and framework from actual source and configuration files.
3. Identify the package manager from the committed lockfile and project configuration.
4. Identify dependencies from the actual dependency manifests.
5. Identify available commands from actual project scripts, task files, or documented instructions.
6. Read the README and the files directly related to the requested change.
7. Report any required information that cannot be established from the repository.

Do not claim a file, command, script, framework, package, or folder exists unless it has been observed in the repository or supplied by the product owner.

## 3. Technology and dependency decisions
- Do not introduce a framework, database, authentication provider, API, service, build tool, or runtime dependency unless an approved requirement cannot be implemented with the existing project setup.
- Before adding any runtime or development dependency, state its purpose, the requirement it supports, and whether the existing project can meet that requirement without it. Obtain product-owner approval before adding it.
- A **major dependency** means a dependency that adds a runtime service, changes the framework or build system, introduces persistent storage or authentication, or materially changes security, deployment, or application architecture.
- Do not add a major dependency without explicit approval.
- Do not invent package scripts or assume a package manager. Use only commands verified in repository configuration or documentation.
- Keep secrets and private credentials out of source control and client-side code.

## 4. Architecture boundaries
Keep the following responsibilities identifiable in the codebase:
- Address parsing and validation.
- Safe destination validation and webpage retrieval.
- Automated page measurements.
- Questionnaire state and validation.
- Suggested-answer calculation.
- Answer-to-report processing.
- Report assembly and presentation.
- PDF generation.
- Account access and data isolation.
- Branding settings and logo processing.

These responsibilities may be separate modules, functions, or existing framework units. Do not force a particular folder or architecture when the repository has an established pattern. For a code change, identify the relevant responsibility and its implementation location in the completion summary.

## 5. Folder conventions
- Follow the repository's existing folder structure.
- Do not create a new top-level folder or reorganise existing folders without explicit approval.
- Place new code in the existing location used for the same responsibility.
- If no matching convention or location exists, propose the smallest required change and obtain approval before creating a new folder structure.
- Do not create empty folders or placeholder files unless the task explicitly requires them.

## 6. Naming and style
- Existing repository naming and formatting conventions take priority.
- If the repository has no established convention for a specific case, propose one and obtain approval before applying it to new files or symbols.
- Do not rename existing files or symbols merely to make them conform to a newly proposed convention.
- Names must identify the responsibility of the file, function, variable, component, or type. Avoid unexplained abbreviations.
- Follow the formatter, linter, and language configuration that actually exists in the repository. Do not add one without approval.

## 7. Code-change boundaries
- Change only files necessary to implement the requested, approved task.
- Preserve existing behaviour unless the approved task explicitly changes it.
- Do not perform unrelated refactoring, file moves, renaming, dependency upgrades, or formatting changes.
- Before a change that affects more files than the requested feature requires, explain why and obtain approval.
- Do not introduce speculative abstractions or general-purpose systems. An abstraction must serve at least two identified uses in the approved implementation or be required by an existing framework convention.
- Comments are required for non-obvious business rules, security assumptions, non-standard workarounds, and decisions that would otherwise be difficult to infer. Do not add comments that merely repeat the code.
- For AI-generated code, inspect the input, transformation, output, and failure handling before relying on it.
- Do not claim code is complete, working, secure, or tested unless the relevant verification has actually been performed.
