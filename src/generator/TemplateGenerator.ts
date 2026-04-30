import * as fs from 'fs';
import * as path from 'path';
import { Stack } from '../detector/DddDetector';
import { writeFile, appendFile, ensureDir, today, nowIso } from '../utils/fileUtils';

export type AgentProfile = 'strict' | 'standard' | 'permissive';

// ─── Static templates (permanent files) ──────────────────────────────────────

const AI_CONTEXT_README = `# \`.ai_context\` — Documentation-Driven Development

This folder is managed by the **Documentation First** plugin.
It structures collaboration between the developer and the AI agent throughout the project.

---

## Philosophy

The method is based on a simple principle: **documentation is not a deliverable, it is a working tool**.

The developer and the AI agent collaborate by **reading and writing documents**.
- The developer writes what they want to do, understand or decide.
- The agent reads, completes, refines, questions, and documents what it has done.

> It is not the agent who decides — it is the developer who drives through documents.

---

## \`permanent-\` Convention

A file in \`technical/\` or \`specification/\` prefixed with \`permanent-\`
**will not be deleted** when switching to a new context.

## Structure

\`\`\`
.ai_context/
├── README.md              ← this file (permanent)
├── CONTRACT.md            ← rules for the agent (permanent)
├── CONTEXT.md             ← objective and todo list (contextual)
├── context.json           ← machine metadata (contextual)
├── history.log            ← past contexts journal (permanent)
├── skills/                ← skills and competencies (permanent-* kept)
└── documents/
    ├── done/              ← agent summaries (contextual)
    ├── specification/     ← functional specs (permanent-* kept)
    └── technical/         ← technical decisions (permanent-* kept)
\`\`\`

---

*Managed by [Documentation First Plugin](https://documentationfirst.ai) — MIT License*
`;

const CONTRACT_PROHIBITIONS: Record<AgentProfile, string> = {
  strict: `## 🚫 ABSOLUTE PROHIBITIONS

> These rules apply **without exception**.

1. **Never use any terminal command execution tool.**
   - Forbidden: \`npm install\`, \`npm run\`, \`ng build\`, \`ng serve\`, \`git\`, etc.
   - If a command is needed, display it as a code block — the developer runs it.
2. **Never rename or delete files.**
3. **Never modify files outside the workspace.**`,

  standard: `## ⚠️ RESTRICTIONS

1. **Never run build, install or serve commands.**
   - Forbidden: \`npm install\`, \`npm run build\`, \`ng build\`, \`ng serve\`, \`git push\`, etc.
   - Allowed read-only: \`grep\`, \`find\`, \`cat\`, \`ls\`
   - Test commands (\`ng test\`, \`npm test\`) are allowed.
2. **Never rename or delete files.**
3. **Never modify files outside the workspace.**`,

  permissive: `## ℹ️ RECOMMENDATIONS

1. **Never modify files outside the workspace.**
2. **Display destructive commands** as a code block for review.
3. Build, install, test and serve commands may be executed directly.`,
};

const CONTRACT_PERMISSIONS: Record<AgentProfile, string> = {
  strict: `## ✅ What the agent is allowed to do

| Action | Allowed | Notes |
|---|---|---|
| Modify existing files | ✅ Yes | Without prior confirmation |
| Create new files | ✅ Yes | |
| Read project files | ✅ Yes | |
| Update \`.ai_context/\` | ✅ Yes | |
| Execute terminal commands | ❌ No | Display as code block only |
| Rename or delete files | ❌ No | |`,

  standard: `## ✅ What the agent is allowed to do

| Action | Allowed | Notes |
|---|---|---|
| Modify existing files | ✅ Yes | |
| Create new files | ✅ Yes | |
| Read project files | ✅ Yes | |
| Read-only commands (\`grep\`, \`find\`, \`cat\`) | ✅ Yes | |
| Run tests (\`npm test\`, \`ng test\`) | ✅ Yes | |
| Build / install / serve commands | ❌ No | Display as code block |
| Rename or delete files | ❌ No | |`,

  permissive: `## ✅ What the agent is allowed to do

| Action | Allowed | Notes |
|---|---|---|
| Modify / create files | ✅ Yes | |
| All terminal commands | ✅ Yes | |
| Rename / delete | ✅ Yes | With care |
| Modify files outside workspace | ❌ No | |`,
};

function contractMd(profile: AgentProfile): string {
  return `# AI Agent — Interaction Contract

*Profile: **${profile}***

This file defines the rules of interaction between the developer and the AI agent.
**The agent must read and respect this contract before taking any action.**

---

${CONTRACT_PROHIBITIONS[profile]}

---

${CONTRACT_PERMISSIONS[profile]}

---

## 🧠 Communication preferences

- Reply in **English**
- Be **concise**: do not repeat existing code in explanations
- Do not ask for confirmation on obvious changes — **act directly**
- When in doubt about scope, **ask one focused question**

---

## 📁 Reference documentation

All context is centralized in [\`.ai_context/\`](./.ai_context/).
**Read and follow the directives in these files** before any modification.
`;
}

// ─── Contextual templates ─────────────────────────────────────────────────────

function contextMd(title: string, description: string, todos: string[]): string {
  const todoLines = todos.length > 0
    ? todos.map(t => `- [ ] ${t}`).join('\n')
    : '- [ ] ...';
  return `# Context — ${title}

*Started: ${today()}*

---

## Description

${description}

---

## Todo

${todoLines}
`;
}

function contextJson(title: string, description: string): string {
  const escaped = (s: string) => s.replace(/"/g, '\\"');
  return `{"title":"${escaped(title)}","description":"${escaped(description)}","startedAt":"${nowIso()}"}`;
}

// ─── TemplateGenerator ────────────────────────────────────────────────────────

export class TemplateGenerator {
  constructor(private readonly extensionPath: string) {}

  scaffoldInit(
    aiContextRoot: string,
    profile: AgentProfile,
    title: string,
    description: string,
    todos: string[]
  ): void {
    ensureDir(aiContextRoot);
    for (const sub of ['done', 'specification', 'technical']) {
      ensureDir(path.join(aiContextRoot, 'documents', sub));
      const gitkeep = path.join(aiContextRoot, 'documents', sub, '.gitkeep');
      if (!fs.existsSync(gitkeep)) { writeFile(gitkeep, ''); }
    }
    ensureDir(path.join(aiContextRoot, 'skills'));
    const skillsGitkeep = path.join(aiContextRoot, 'skills', '.gitkeep');
    if (!fs.existsSync(skillsGitkeep)) { writeFile(skillsGitkeep, ''); }

    const readmePath = path.join(aiContextRoot, 'README.md');
    if (!fs.existsSync(readmePath)) { writeFile(readmePath, AI_CONTEXT_README); }

    const contractPath = path.join(aiContextRoot, 'CONTRACT.md');
    if (!fs.existsSync(contractPath)) { writeFile(contractPath, contractMd(profile)); }

    writeFile(path.join(aiContextRoot, 'CONTEXT.md'), contextMd(title, description, todos));
    writeFile(path.join(aiContextRoot, 'context.json'), contextJson(title, description));

    // Create or update project README.md
    const projectRoot = path.dirname(aiContextRoot);
    const projectReadme = path.join(projectRoot, 'README.md');
    const agentHeader = `# For AI Agent :

Read all [context](./.ai_context) for context and needs.
The agent must apply the conditions specified in CONTRACT.md.
The current development context is presented in CONTEXT.md and all files in the \`documents/\` directory.

---

`;
    if (!fs.existsSync(projectReadme)) {
      const projectName = path.basename(projectRoot);
      writeFile(projectReadme, `${agentHeader}# ${projectName}\n\n> *(Describe your project here)*\n`);
    } else {
      const existing = fs.readFileSync(projectReadme, 'utf8');
      if (!existing.includes('.ai_context')) {
        fs.writeFileSync(projectReadme, agentHeader + existing, 'utf8');
      }
    }
  }

  scaffoldNewContext(
    aiContextRoot: string,
    title: string,
    description: string,
    todos: string[]
  ): void {
    // Archive to history.log
    const contextJsonPath = path.join(aiContextRoot, 'context.json');
    if (fs.existsSync(contextJsonPath)) {
      const old = fs.readFileSync(contextJsonPath, 'utf8').trim().replace(/}$/, '');
      appendFile(
        path.join(aiContextRoot, 'history.log'),
        `${old},"endedAt":"${nowIso()}"}\n`
      );
    }

    // Clear done/ entirely
    const doneDir = path.join(aiContextRoot, 'documents', 'done');
    if (fs.existsSync(doneDir)) {
      fs.readdirSync(doneDir).forEach((f: string) => {
        if (f !== '.gitkeep') { fs.unlinkSync(path.join(doneDir, f)); }
      });
    }

    // Clear specification/, technical/, and skills/ except permanent-*
    for (const sub of ['specification', 'technical', 'skills']) {
      const subDir = sub === 'skills' ? path.join(aiContextRoot, sub) : path.join(aiContextRoot, 'documents', sub);
      if (fs.existsSync(subDir)) {
        fs.readdirSync(subDir).forEach((f: string) => {
          if (f !== '.gitkeep' && !f.startsWith('permanent-')) {
            fs.unlinkSync(path.join(subDir, f));
          }
        });
      }
    }

    writeFile(path.join(aiContextRoot, 'CONTEXT.md'), contextMd(title, description, todos));
    writeFile(path.join(aiContextRoot, 'context.json'), contextJson(title, description));
  }
}
