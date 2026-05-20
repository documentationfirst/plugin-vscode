# For AI Agent :

Read all [context](./.ai_context) for context and needs.
L'agent doit appliquer les conditions spécifiées par le fichier CONTRACT.md
Le contexte du développement actuel est présenté dans CONTEXT.md et tous les fichiers du répertoire "documents".
Le sous-répertoire "done" contiendra des fichiers MD rédigés par l'agent expliquant ce qui a été dans ce contexte.
Le sous-répertoire "technical" contient des bonnes pratiques et conseils techniques dans ce contexte.
Le sous-répertoire "specification" contient des détails fonctionnels et d'architecture, ainsi que les besoins détaillés.

# DDD — Documentation-Driven Development for AI (VSCode Plugin)

<div align="center">
    <img src="d-ai.jpg" alt="Documentation-Driven Development" width="260" style="border-radius: 50%; overflow: hidden;" />
</div>

[![VS Marketplace](https://img.shields.io/badge/VS%20Marketplace-coming%20soon-blue?style=flat-square)](https://marketplace.visualstudio.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Website](https://img.shields.io/badge/website-documentationfirst.ai-58a6ff?style=flat-square)](https://documentationfirst.ai)

> Make Documentation-Driven Development a first-class citizen of your IDE.

Works with **VSCode, Cursor, Windsurf, VSCodium**.

---

## Features

| Command | Description |
|---------|-------------|
| `DDD: Initialize Project` | Scaffolds `ai_md_files/` with templates for your detected stack |
| `DDD: New Feature Context` | Creates `features/{name}/specs-functional.md`, `specs-technical.md`, `DONE.md` |
| `DDD: New Migration Plan` | Creates `migrations/{name}/migration-plan.md`, `MIGRATION_DONE.md` |
| `DDD: Generate Agent Files` | Generates `.cursorrules`, `CLAUDE.md`, `copilot-instructions.md`, `AGENTS.md` from `best-practices.md` |
| `DDD: View DONE.md` | Opens the nearest `DONE.md` in a split editor |

**DDD Context panel** in the Explorer sidebar — navigate all your DDD files with one click.

**Auto-detection** — on project open, detects whether `ai_md_files/` is present and offers to initialize.

**Stack detection** — Angular, React, Vue, Spring Boot, Python, Rust, Go, Generic.

---

## Getting Started

### 1. Install the extension

```bash
# From the marketplace (when published)
# Or install the .vsix locally:
code --install-extension ddd-documentation-first-1.0.0.vsix
```

### 2. Open a project and run

```
Ctrl+Shift+P → DDD: Initialize Project
```

### 3. Start writing specs

The plugin creates:
```
.ai_context/
├── README.md                  ← project overview (permanent)
├── CONTRACT.md                ← agent interaction rules (permanent)
├── CONTEXT.md                 ← project identity: stack, conventions, team (permanent — never reset)
├── context.json               ← current task metadata
├── vision.md                  ← product vision and epic goals (semi-permanent — reset on New Vision)
├── history.json               ← append-only log of all visions and tasks
├── steps/                     ← roadmap phases for current vision (reset on New Vision)
│   ├── phase1-core.md
│   └── phase2-growth.md
├── skills/                    ← reusable agent knowledge (permanent-* kept)
│   ├── permanent-dev-stack.md
│   └── permanent-architecture.md
└── tasks/                     ← current sprint work (reset on New Tasks)
    ├── done/                  ← AI execution reports
    ├── specification/         ← functional specs (permanent-* kept)
    └── technical/             ← technical decisions (permanent-* kept)
```

### 4. Create your first feature context

```
Ctrl+Shift+P → DDD: New Feature Context → "authentication"
```

### 5. Generate agent files for your AI tools

```
Ctrl+Shift+P → DDD: Generate Agent Files
```

This creates `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`, and `AGENTS.md`
from your `best-practices.md` — so every AI tool gets the right context automatically.

---

## Development

### Prerequisites

- Node.js 20+
- VSCode 1.85+

### Setup

```bash
npm install
npm run compile
```

### Run in development

Press `F5` in VSCode — this opens a new Extension Development Host window with the plugin loaded.

### Run tests

```bash
npm test
```

### Package

```bash
npm run package
# → ddd-documentation-first-1.0.0.vsix
```

---

## Project Structure

```
src/
├── extension.ts                  ← Entry point
├── detector/
│   └── DddDetector.ts            ← Stack & DDD folder detection
├── commands/
│   ├── initProject.ts
│   ├── newFeatureContext.ts
│   ├── newMigrationPlan.ts
│   └── viewDone.ts
├── generator/
│   ├── TemplateGenerator.ts      ← MD scaffolding + inline templates per stack
│   └── AgentFileGenerator.ts     ← .cursorrules / CLAUDE.md / copilot-instructions
├── treeview/
│   └── DddTreeProvider.ts        ← Explorer panel
└── utils/
    └── fileUtils.ts
```

---

## Roadmap

| Version | Features |
|---------|----------|
| **v1.0** | Detection, scaffolding, tree view, agent file generation, templates (Angular, React, Spring Boot, Python, Rust, Go, Generic) |
| v1.1 | Cursor / Windsurf native context injection (when API available) |
| v1.2 | DONE.md preview panel with diff vs. migration plan |
| v2.0 | DDD score per project, AI session recap |

---

## Links

- 🌐 [documentationfirst.ai](https://documentationfirst.ai)
- 📖 [DDD Manifesto](https://github.com/documentationfirst/manifesto)
- 🔌 [IntelliJ Plugin](https://github.com/documentationfirst/plugin-intellij)
- 🔵 [VS Code Plugin](https://github.com/documentationfirst/plugin-vscode)

---

*MIT License — Documentation First*

