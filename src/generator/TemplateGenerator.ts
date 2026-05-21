import * as fs from 'fs';
import * as path from 'path';
import { writeFile, appendFile, ensureDir, today, nowIso } from '../utils/fileUtils';

export type AgentProfile = 'strict' | 'standard' | 'permissive';

// ─── Static templates (permanent files) ──────────────────────────────────────

const AI_CONTEXT_README = `# \`.ai_context\` — Documentation-Driven Development

This folder is managed by the **Documentation First** plugin.
It structures collaboration between the developer and the AI agent throughout the project.

---

## Philosophy

**Documentation is not a deliverable — it is the architecture.**

The developer and the AI agent collaborate by reading and writing documents.
> It is not the agent who decides — it is the developer who drives through documents.

---

## Reading order (before any action)

### 🔒 Fixed reference — read once, always valid
1. \`CONTEXT.md\` — who we are, what we build, the stack, team conventions *(permanent, never task-specific)*
2. \`CONTRACT.md\` — agent interaction rules *(permanent)*

### 🔄 Current development work — read every session
3. \`vision.md\` — the product direction and epic goals *(reset on "New Vision")*
4. \`steps/\` — roadmap phases for the current vision *(reset on "New Vision")*
5. \`dev-context.json\` — active task: title, description, todos, and step progress
6. \`tasks/specification/\` — functional specs for the current task
7. \`tasks/done/\` — what was already implemented in this task
8. \`tasks/technical/\` — technical decisions

### 🧠 Permanent behaviours
9. \`skills/\` — reusable agent skills (never reset)

---

## Lifecycle layers

| Layer | Files | Reset? |
|---|---|---|
| **Permanent** | \`CONTEXT.md\`, \`CONTRACT.md\`, \`README.md\`, \`skills/\` | Never |
| **Semi-permanent** | \`vision.md\` | On "New Vision" |
| **Contextual (per vision)** | \`steps/\` | On "New Vision" |
| **Ephemeral (per task)** | \`dev-context.json\`, \`tasks/\` non-permanent files | On "New Task" |

## \`permanent-\` Convention

A file prefixed with \`permanent-\` **will not be deleted** when switching tasks or visions.

## Structure

\`\`\`
.ai_context/
├── README.md              ← this file (permanent)
├── CONTEXT.md             ← WHO/WHAT: project identity, stack, conventions (permanent)
├── CONTRACT.md            ← HOW: agent interaction rules (permanent)
├── vision.md              ← WHERE WE'RE GOING: product vision and epic (semi-permanent)
├── dev-context.json       ← WHAT WE'RE DOING NOW: vision + steps + active task
├── history.json           ← log of all tasks and visions (append-only)
├── skills/                ← reusable agent behaviours (permanent)
├── steps/                 ← roadmap phases for current vision (reset on new vision)
└── tasks/
    ├── done/              ← agent execution reports (reset on new task)
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

## 🔄 Session close protocol

At the end of a session, update \`dev-context.json\` → \`lastSession\` with:
\`\`\`json
"lastSession": {
  "date": "YYYY-MM-DD",
  "done": "one sentence — what was implemented",
  "remaining": "what is left in the current task",
  "blocker": "what blocked or is unclear (empty if none)"
}
\`\`\`

**Trigger this automatically when:**
1. The developer signals end of session ("stop", "commit", "done", "à demain", etc.)
2. More than 5 files were modified in this session
3. A significant feature or bug fix was just completed
4. A new major topic is about to begin — natural breakpoint before context switch

This is a lightweight handoff — not a full \`done.md\`. One sentence per field.

---

## 📁 Reference documentation

All context is centralized in [\`.ai_context/\`](./.ai_context/).
**Read and follow the directives in these files** before any modification.
`;
}

// ─── Permanent templates ──────────────────────────────────────────────────────

function visionMd(vision: string): string {
  return `# Vision

*Created: ${today()}*

---

## Epic

${vision}

---

## Goals

- [ ] ...

## Out of scope

- ...
`;
}

function stepMd(name: string, description: string): string {
  return `# Step — ${name}

*Created: ${today()}*

---

## Objective

${description || '*(describe this step)*'}

---

## Tasks

- [ ] ...
`;
}

function contextProjectMd(projectContext: string): string {
  return `# Project Context

*Created: ${today()}*

> **This file is permanent.** It describes WHO we are and WHAT we build.
> It never changes per task or vision — it is the fixed reference the agent reads at the start of every session.
> For the current development work (vision, steps, active task), see \`dev-context.json\`.

---

## What we are building

${projectContext}

---

## Stack & conventions

*(describe the stack, language, framework, key rules)*

---

## Team rules

*(describe how the agent should work: language, code style, what it must never do)*
`;
}

// ─── Ephemeral templates ──────────────────────────────────────────────────────

function methodologySkillMd(): string {
  return `# Skill — DDD Methodology (permanent)

*Created: ${today()}*

> This file is permanent — it survives every context and vision switch.
> It defines how the agent must work on this project at all times.

---

## Reading order (before any action)

### 🔒 Fixed reference — read once, always valid
1. \`CONTEXT.md\` — who we are, what we build, the stack, team conventions *(permanent)*
2. \`CONTRACT.md\` — agent interaction rules *(permanent)*

### 🔄 Current development work — read every session
3. \`vision.md\` — product direction and epic goals
4. \`steps/\` — roadmap phases for the current vision
5. \`dev-context.json\` — active task: title, description, todos, step progress
6. \`tasks/specification/\` — functional specs for the current task
7. \`tasks/done/\` — what was already implemented
8. \`tasks/technical/\` — technical decisions

---

## Session protocol

### 1. Read before acting
Read all context files above in order before taking any action.
> These files are the project's memory. Never assume the state of the code without reading them.

### 2. Spec before code
For any new feature, fix, or refactoring:
1. Create \`tasks/specification/spec-<feature>.md\` with: context, expected behaviour, components, plan
2. Optionally generate \`tasks/specification/spec-<feature>-preview.html\` for UI tasks
3. Wait for explicit developer validation before writing any production code

### 3. Implement
- Follow the validated spec to the letter
- Group changes by file
- Validate errors after each file modified

### 4. Write the done report
After implementation, create \`tasks/done/done-<feature>.md\`:
- Summary of changes
- Per item: problem → root cause (if bug) → solution → modified files
- Optionally generate \`tasks/done/done-<feature>-test.html\` for acceptance verification

---

## Artefact conventions

| File | Location | Written by | Purpose |
|---|---|---|---|
| \`spec-*.md\` | \`tasks/specification/\` | Human | Intent |
| \`spec-*-preview.html\` | \`tasks/specification/\` | AI | Visual validation before coding |
| \`done-*.md\` | \`tasks/done/\` | AI | Execution report |
| \`done-*-test.html\` | \`tasks/done/\` | AI | Acceptance test runner |

Prefix any file with \`permanent-\` to preserve it across context resets.

---

## Communication rules

- If the request is ambiguous: ask ONE focused question, wait for the answer
- If the developer explains something: update mental context only — do not act unless explicitly asked
- If a bug is found in passing: signal it, do not fix without agreement (unless it blocks the current task)
- A developer explanation is not an action order
`;
}

function taskMd(title: string, description: string, todos: string[]): string {
  const todoLines = todos.length > 0
    ? todos.map(t => `- [ ] ${t}`).join('\n')
    : '- [ ] ...';
  return `# Task — ${title}

*Started: ${today()}*

---

## Objective

${description}

---

## Todo

${todoLines}
`;
}

function contextJson(
  title: string,
  description: string,
  vision?: string,
  steps?: Array<{ name: string; description: string; done?: boolean }>,
  todos?: string[]
): string {
  return JSON.stringify({
    vision: vision ?? '',
    steps: (steps ?? []).map(s => ({ name: s.name, description: s.description, done: s.done ?? false })),
    task: {
      title,
      description,
      startedAt: nowIso(),
      todos: (todos ?? []).map(t => ({ text: t, done: false })),
    }
  }, null, 2);
}

function historyLine(type: 'vision' | 'task', title: string, completedStep?: string, vision?: string): string {
  return JSON.stringify({
    type,
    ...(vision ? { vision } : {}),
    title,
    ...(completedStep ? { completedStep } : {}),
    endedAt: nowIso(),
  });
}

// ─── TemplateGenerator ────────────────────────────────────────────────────────

export class TemplateGenerator {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(_extensionPath: string) {}

  scaffoldInit(
    aiContextRoot: string,
    profile: AgentProfile,
    projectContext: string,
    vision: string,
    title: string,
    description: string,
    todos: string[],
    steps: Array<{ name: string; description: string }>
  ): void {
    ensureDir(aiContextRoot);

    // tasks/ subdirs
    for (const sub of ['done', 'specification', 'technical']) {
      ensureDir(path.join(aiContextRoot, 'tasks', sub));
      const gitkeep = path.join(aiContextRoot, 'tasks', sub, '.gitkeep');
      if (!fs.existsSync(gitkeep)) { writeFile(gitkeep, ''); }
    }

    // skills/
    ensureDir(path.join(aiContextRoot, 'skills'));
    if (!fs.existsSync(path.join(aiContextRoot, 'skills', '.gitkeep'))) {
      writeFile(path.join(aiContextRoot, 'skills', '.gitkeep'), '');
    }
    // Default methodology skill (if not already present)
    const methodologyPath = path.join(aiContextRoot, 'skills', 'permanent-methodology.md');
    if (!fs.existsSync(methodologyPath)) {
      writeFile(methodologyPath, methodologySkillMd());
    }

    // steps/
    ensureDir(path.join(aiContextRoot, 'steps'));
    if (!fs.existsSync(path.join(aiContextRoot, 'steps', '.gitkeep'))) {
      writeFile(path.join(aiContextRoot, 'steps', '.gitkeep'), '');
    }
    for (const step of steps) {
      const slug = step.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      writeFile(path.join(aiContextRoot, 'steps', `${slug}.md`), stepMd(step.name, step.description));
    }

    // permanent files (only if not existing)
    const readmePath = path.join(aiContextRoot, 'README.md');
    if (!fs.existsSync(readmePath)) { writeFile(readmePath, AI_CONTEXT_README); }

    const contractPath = path.join(aiContextRoot, 'CONTRACT.md');
    if (!fs.existsSync(contractPath)) { writeFile(contractPath, contractMd(profile)); }

    // CONTEXT.md is permanent — only write on first init
    const contextMdPath = path.join(aiContextRoot, 'CONTEXT.md');
    if (!fs.existsSync(contextMdPath)) {
      writeFile(contextMdPath, contextProjectMd(projectContext));
    }

    // vision.md is semi-permanent — only write on first init
    const visionPath = path.join(aiContextRoot, 'vision.md');
    if (!fs.existsSync(visionPath)) { writeFile(visionPath, visionMd(vision)); }

    // current task
    writeFile(path.join(aiContextRoot, 'dev-context.json'), contextJson(title, description, vision, steps, todos));

    // Create spec file for the first task
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    writeFile(path.join(aiContextRoot, 'tasks', 'specification', `spec-${slug}.md`), newTaskSpecMd(title, description));

    // Create or update project README.md
    const projectRoot = path.dirname(aiContextRoot);
    const projectReadme = path.join(projectRoot, 'README.md');
    const agentHeader = `# For AI Agent

> Read \`.ai_context/\` before any action.

- **WHO/WHAT**: \`CONTEXT.md\` — project identity, stack, conventions *(permanent reference, like a README)*
- **HOW**: \`CONTRACT.md\` — interaction rules *(permanent)*
- **WHERE WE'RE GOING**: \`vision.md\` + \`steps/\` — product direction and roadmap phases
- **WHAT WE'RE DOING NOW**: \`dev-context.json\` — active task title, description, todos and step progress
- **TASK DETAILS**: \`tasks/specification/\`, \`tasks/done/\`, \`tasks/technical/\`

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

  scaffoldNewVision(
    aiContextRoot: string,
    vision: string,
    steps: Array<{ name: string; description: string }>,
    title: string,
    description: string,
    todos: string[]
  ): void {
    // Archive current vision to history.json
    const devContextPath = path.join(aiContextRoot, 'dev-context.json');
    if (fs.existsSync(devContextPath)) {
      const old = JSON.parse(fs.readFileSync(devContextPath, 'utf8'));
      appendFile(
        path.join(aiContextRoot, 'history.json'),
        historyLine('vision', old.task?.title || old.title || 'unnamed vision') + '\n'
      );
    }

    // Reset steps/ (delete all)
    const stepsDir = path.join(aiContextRoot, 'steps');
    if (fs.existsSync(stepsDir)) {
      fs.readdirSync(stepsDir).forEach((f: string) => {
        if (f !== '.gitkeep') { fs.unlinkSync(path.join(stepsDir, f)); }
      });
    } else {
      ensureDir(stepsDir);
      writeFile(path.join(stepsDir, '.gitkeep'), '');
    }
    for (const step of steps) {
      const slug = step.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      writeFile(path.join(stepsDir, `${slug}.md`), stepMd(step.name, step.description));
    }

    // Reset tasks/ non-permanent
    this._clearTasks(aiContextRoot);

    // Overwrite vision.md
    writeFile(path.join(aiContextRoot, 'vision.md'), visionMd(vision));

    // New task metadata
    writeFile(path.join(aiContextRoot, 'dev-context.json'), contextJson(title, description, vision, steps, todos));

    // Create spec file for the first task of the new vision
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    writeFile(path.join(aiContextRoot, 'tasks', 'specification', `spec-${slug}.md`), newTaskSpecMd(title, description));
  }

  scaffoldNewTask(
    aiContextRoot: string,
    completedStep: string,
    title: string,
    description: string,
    todos: string[],
    specsToDelete: string[] = []
  ): void {
    // Archive current task to history.json
    const devContextPath = path.join(aiContextRoot, 'dev-context.json');
    let currentVision = '';
    let currentSteps: Array<{ name: string; description: string; done: boolean }> = [];
    if (fs.existsSync(devContextPath)) {
      const old = JSON.parse(fs.readFileSync(devContextPath, 'utf8'));
      currentVision = old.vision ?? '';
      // Mark the completed step as done
      currentSteps = (old.steps ?? []).map((s: { name: string; description: string; done?: boolean }) => ({
        ...s,
        done: s.done === true || (
          !!completedStep &&
          s.name.toLowerCase().includes(completedStep.toLowerCase())
        ),
      }));
      appendFile(
        path.join(aiContextRoot, 'history.json'),
        historyLine('task', old.task?.title || old.title || 'unnamed task', completedStep, old.vision || '') + '\n'
      );
    }

    // Reset tasks/ non-permanent (with selective spec deletion)
    this._clearTasks(aiContextRoot, specsToDelete);

    // Append retrospective section to the completed step file
    if (completedStep) {
      const slug = completedStep.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const stepFile = path.join(aiContextRoot, 'steps', `${slug}.md`);
      if (fs.existsSync(stepFile)) {
        const retro = `\n\n## Retrospective — ${today()}\n\n- ✅ What worked:\n- ⚠️ What blocked:\n- 📌 To remember:\n`;
        fs.appendFileSync(stepFile, retro, 'utf8');
      }
    }

    // Create spec file for the new task
    const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const specContent = newTaskSpecMd(title, description);
    writeFile(path.join(aiContextRoot, 'tasks', 'specification', `spec-${slug}.md`), specContent);

    // New task metadata — preserve vision and steps (with updated done flags)
    writeFile(devContextPath, contextJson(title, description, currentVision, currentSteps, todos));
  }

  private _clearTasks(aiContextRoot: string, specsToDelete: string[] = []): void {
    // done/ — always cleared entirely
    const doneDir = path.join(aiContextRoot, 'tasks', 'done');
    if (fs.existsSync(doneDir)) {
      fs.readdirSync(doneDir).forEach((f: string) => {
        if (f !== '.gitkeep' && !f.startsWith('permanent-')) {
          fs.unlinkSync(path.join(doneDir, f));
        }
      });
    }

    // specification/ — only delete files explicitly selected by user
    const specDir = path.join(aiContextRoot, 'tasks', 'specification');
    if (fs.existsSync(specDir)) {
      fs.readdirSync(specDir).forEach((f: string) => {
        if (f !== '.gitkeep' && !f.startsWith('permanent-') && specsToDelete.includes(f)) {
          fs.unlinkSync(path.join(specDir, f));
        }
      });
    }

    // technical/ — clear non-permanent
    const technicalDir = path.join(aiContextRoot, 'tasks', 'technical');
    if (fs.existsSync(technicalDir)) {
      fs.readdirSync(technicalDir).forEach((f: string) => {
        if (f !== '.gitkeep' && !f.startsWith('permanent-')) {
          fs.unlinkSync(path.join(technicalDir, f));
        }
      });
    }
  }
}

function newTaskSpecMd(title: string, description: string): string {
  return `# Spec — ${title}

*Created: ${today()}*

---

## Objective

${description || '*(describe the objective of this task)*'}

---

## Expected behaviour

*(describe the expected behaviour)*

---

## Plan

*(describe the implementation plan)*

---

> 💡 **Next step**: ask your AI agent to read \`.ai_context/\` and implement this spec.
`;
}

