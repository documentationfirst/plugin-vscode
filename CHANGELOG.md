# Changelog — Documentation First (VSCode)

## [1.0.2] — 2026-05-21

### New features
- **Steps retrospective** — when a step is marked done in "New Task", a retrospective section is automatically appended to the corresponding `steps/<slug>.md` file
- **Spec file auto-created** — a `tasks/specification/spec-<slug>.md` is created at every init, new vision, and new task
- **Selective spec deletion** — "New Task" now shows a multi-select list of non-permanent spec files; only selected ones are deleted
- **Quick init mode** — new choice at init: Full (5 steps) or Quick (profile + context + first task, vision/steps filled later)
- **CONTRACT session protocol** — generated `CONTRACT.md` now includes a session close protocol with 4 auto-triggers for the agent to write `lastSession` in `dev-context.json`
- **Fix startup spinner** — startup detection is now detached from `activate()`, no more loading state on fresh install
- **Step list in New Task** — replaced free-text input with a clickable QuickPick list of pending steps

### Fixes
- Activity bar icon now uses `icon.svg` (theme-aware, adapts to dark/light/high-contrast themes)
- Marketplace icon uses `ddd-ai-marketplace.png` with dark background (visible on white marketplace page)
- `galleryBanner` added (`#2d2d2d`, dark theme) for cohesive marketplace page
- `engines.vscode` lowered to `^1.75.0` for broader compatibility

## [1.0.1] — 2026-04-30

### Initial public release
- Full DDD v2 lifecycle: init → vision → steps → tasks → done
- Agent-agnostic: works with GitHub Copilot, Cursor, Windsurf, any AI assistant
- Zero external dependencies — pure Markdown + Git
- Tree view: specification/, done/, technical/, steps/, skills/
- Permanent files (`permanent-*`) survive all context resets
- Task history in `history.json` (JSON Lines, append-only)

