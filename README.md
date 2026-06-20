# Make documentation your AI's superpower contextual memory
[![Extension VsCode](https://img.shields.io/badge/vscode-marketplace-orange?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=DocumentationFirst.ddd-documentation-first)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Website](https://img.shields.io/badge/website-documentationfirst.ai-58a6ff?style=flat-square)](https://documentationfirst.ai)

---

**Documentation-Driven Development** v2 For Agentic AI puts your project's documentation at the center of your AI workflow. 

Write markdown or html specs → Agentic co-writing of context files → Vibe-coding with a targeted context → Commit doc for archive between steps

---

## 📋 How It Works

After running `DDD: Initialize Project`, you get:

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

Define **WHY** and **WHAT** — your project's purpose, goals, and architectural decisions.

Break down **HOW** — milestones, sprints, feature phases. Each step adds to AI context.

Describe your **TECH CHOICES** — frameworks, libraries, patterns.

Document **WHO knows WHAT** — team expertise, conventions, gotchas.

---

## 🚀 Key Features

✅ **Initialize Project** — One-click setup with auto-detected stack templates

✅ **Create Vision Docs** — Document project goals and architecture

✅ **Create Task Lists** — Break down development into actionable steps

✅ **Manage Skills** — Record team expertise and capabilities

✅ **Tree Explorer** — Navigate all DDD files in the sidebar

---

## 📖 Learn More

For full documentation, see [HOWTO.md](./HOWTO.md)

- 🌐 [documentationfirst.ai](https://documentationfirst.ai)
- 📖 [DDD Manifesto](https://github.com/documentationfirst/manifesto)
- 🔌 [IntelliJ Plugin](https://github.com/documentationfirst/plugin-intellij)
- 🔵 [VSCode Plugin](https://github.com/documentationfirst/plugin-vscode)

---

**MIT License — Copyright © 2024 Documentation First**

