# DDD Plugin — VSCode — Functional Specifications

## Purpose

Give any VSCode-based editor user a native DDD experience.
Compatible with: **VSCode, Cursor, Windsurf, VSCodium**

---

## User Stories

### US-01 — Project detection
- [ ] `ai_md_files/` exists → status bar "DDD Ready ✅" for 5s
- [ ] Missing → notification: "No DDD context found. [Initialize] [Later]"

### US-02 — Project initialization
- [ ] Detects stack from `package.json`, `pom.xml`, `Cargo.toml`, etc.
- [ ] Creates `best-practices.md` pre-filled for the detected stack
- [ ] Creates `docs/`, `features/`, `migrations/` folders
- [ ] Creates `README_AI.md` at project root with the AI agent interaction contract (prohibitions, permissions, checklist, reference links) — only if not already present
- [ ] Opens `best-practices.md` automatically

### US-03 — New Feature Context
- [ ] Available via: Command Palette, right-click Explorer, DDD panel
- [ ] Quick input for feature name (e.g. "authentication")
- [ ] Creates `ai_md_files/features/{name}/specs-functional.md`, `specs-technical.md`, `DONE.md`
- [ ] Opens `specs-functional.md` automatically

### US-04 — New Migration Plan
- [ ] Quick input for migration name (e.g. "angular-21")
- [ ] Creates `ai_md_files/migrations/{name}/migration-plan.md`, `MIGRATION_DONE.md`
- [ ] Opens `migration-plan.md` automatically

### US-05 — DDD Explorer Panel
- [ ] Shows tree of `ai_md_files/` with icons per file type
- [ ] Clicking a file opens it in the editor
- [ ] Action buttons: `+ Feature`, `+ Migration`

### US-06 — Generate Agent Files
- [ ] Command: "DDD: Generate Agent Files"
- [ ] Generates: `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`, `AGENTS.md`
- [ ] Each file starts with a "do not edit manually" header

### US-07 — View DONE.md
- [ ] Opens the nearest `DONE.md` relative to the current file
- [ ] Opens in a split editor to the right

---

## Out of Scope for v1.0

- Cursor/Windsurf native API injection (v1.1)
- DONE.md diff viewer
- Multi-root workspace support

