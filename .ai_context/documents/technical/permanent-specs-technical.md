# DDD Plugin — VSCode / Cursor / Windsurf — Technical Specifications

## Overview

A VSCode extension that makes Documentation-Driven Development (DDD) a first-class citizen
of VSCode and all VSCode-based editors (Cursor, Windsurf, VSCodium…).

**Target Marketplace:** [marketplace.visualstudio.com](https://marketplace.visualstudio.com)
**Language:** TypeScript
**Runtime:** Node.js (bundled with VSCode)
**Min VSCode version:** 1.85.0

---

## Project Structure

```
ddd-plugin-vscode/
├── package.json                  ← Extension manifest (contributes, activationEvents…)
├── tsconfig.json
├── esbuild.mjs                   ← Bundler (replaces webpack for VSCode extensions)
├── .vscodeignore
├── src/
│   ├── extension.ts              ← Entry point (activate / deactivate)
│   ├── detector/
│   │   └── DddDetector.ts        ← Detects ai_md_files/ and stack
│   ├── commands/
│   │   ├── initProject.ts        ← "DDD: Initialize Project"
│   │   ├── newFeatureContext.ts  ← "DDD: New Feature Context"
│   │   ├── newMigrationPlan.ts   ← "DDD: New Migration Plan"
│   │   └── viewDone.ts           ← "DDD: View DONE.md"
│   ├── treeview/
│   │   ├── DddTreeProvider.ts    ← TreeDataProvider for the Explorer panel
│   │   └── DddTreeItem.ts        ← Tree node model
│   ├── generator/
│   │   ├── TemplateGenerator.ts  ← Copies .md templates, replaces placeholders
│   │   └── AgentFileGenerator.ts ← Generates .cursorrules / CLAUDE.md / COPILOT_INSTRUCTIONS.md
│   └── utils/
│       └── fileUtils.ts
├── templates/                    ← Bundled .md templates per stack
│   ├── angular/
│   │   ├── best-practices.md
│   │   ├── specs-functional.md
│   │   └── specs-technical.md
│   ├── spring-boot/
│   ├── python/
│   ├── rust/
│   └── generic/
└── test/
    └── suite/
        ├── detector.test.ts
        └── generator.test.ts
```

---

## package.json — Key Contributions

```json
{
  "name": "ddd-documentation-first",
  "displayName": "DDD — Documentation-Driven Development",
  "publisher": "documentationfirst",
  "version": "1.0.0",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other", "Snippets"],
  "activationEvents": ["workspaceContains:**/ai_md_files/**", "onStartupFinished"],
  "contributes": {
    "commands": [
      { "command": "ddd.initProject",       "title": "DDD: Initialize Project" },
      { "command": "ddd.newFeatureContext", "title": "DDD: New Feature Context" },
      { "command": "ddd.newMigrationPlan",  "title": "DDD: New Migration Plan" },
      { "command": "ddd.viewDone",          "title": "DDD: View DONE.md" },
      { "command": "ddd.generateAgentFiles","title": "DDD: Generate Agent Files (.cursorrules, CLAUDE.md…)" }
    ],
    "views": {
      "explorer": [
        {
          "id": "dddExplorer",
          "name": "DDD Context",
          "when": "workspaceFolderCount > 0"
        }
      ]
    },
    "menus": {
      "view/title": [
        { "command": "ddd.newFeatureContext", "when": "view == dddExplorer", "group": "navigation" },
        { "command": "ddd.newMigrationPlan",  "when": "view == dddExplorer", "group": "navigation" }
      ],
      "explorer/context": [
        { "command": "ddd.newFeatureContext", "group": "ddd@1" },
        { "command": "ddd.newMigrationPlan",  "group": "ddd@2" }
      ]
    }
  }
}
```

---

## Core Features

### 1. Activation & Detection

**File:** `extension.ts` + `DddDetector.ts`

```typescript
// extension.ts
export async function activate(context: vscode.ExtensionContext) {
    const detector = new DddDetector();
    const status = await detector.check();

    if (status === 'missing') {
        const choice = await vscode.window.showInformationMessage(
            'No DDD context found in this project. Initialize?',
            'Initialize', 'Later'
        );
        if (choice === 'Initialize') {
            vscode.commands.executeCommand('ddd.initProject');
        }
    } else {
        vscode.window.setStatusBarMessage('DDD Ready ✅', 5000);
    }

    // Register all commands
    context.subscriptions.push(
        vscode.commands.registerCommand('ddd.initProject', () => initProject(context)),
        vscode.commands.registerCommand('ddd.newFeatureContext', () => newFeatureContext(context)),
        vscode.commands.registerCommand('ddd.newMigrationPlan', () => newMigrationPlan(context)),
        vscode.commands.registerCommand('ddd.viewDone', () => viewDone()),
        vscode.commands.registerCommand('ddd.generateAgentFiles', () => generateAgentFiles(context)),
    );

    // Register Tree View
    vscode.window.registerTreeDataProvider('dddExplorer', new DddTreeProvider());
}
```

---

### 2. Stack Detection

**File:** `DddDetector.ts`

```typescript
export class DddDetector {
    async detect(): Promise<Stack> {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root) return Stack.GENERIC;

        const files = await vscode.workspace.findFiles('package.json', null, 1);
        if (files.length > 0) {
            const pkg = JSON.parse(fs.readFileSync(files[0].fsPath, 'utf8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps['@angular/core']) return Stack.ANGULAR;
            if (deps['react']) return Stack.REACT;
            if (deps['vue']) return Stack.VUE;
        }
        if (fs.existsSync(path.join(root, 'pom.xml'))) return Stack.SPRING_BOOT;
        if (fs.existsSync(path.join(root, 'Cargo.toml'))) return Stack.RUST;
        if (fs.existsSync(path.join(root, 'go.mod'))) return Stack.GO;
        if (fs.existsSync(path.join(root, 'requirements.txt'))) return Stack.PYTHON;

        return Stack.GENERIC;
    }
}

export enum Stack { ANGULAR, REACT, VUE, SPRING_BOOT, PYTHON, RUST, GO, GENERIC }
```

---

### 3. Template Generator

**File:** `TemplateGenerator.ts`

Copies templates from the extension's bundled `templates/{stack}/` folder,
replacing `{feature}`, `{stack}`, `{date}` placeholders.

```typescript
export async function scaffoldFeature(featureName: string, stack: Stack, extensionPath: string) {
    const target = path.join(workspaceRoot(), 'ai_md_files', 'features', featureName);
    fs.mkdirSync(target, { recursive: true });

    for (const file of ['specs-functional.md', 'specs-technical.md', 'DONE.md']) {
        const tplPath = path.join(extensionPath, 'templates', stack.toLowerCase(), file);
        const fallback = path.join(extensionPath, 'templates', 'generic', file);
        const src = fs.existsSync(tplPath) ? tplPath : fallback;

        let content = fs.readFileSync(src, 'utf8');
        content = content.replace(/\{feature\}/g, featureName)
                         .replace(/\{date\}/g, new Date().toISOString().split('T')[0]);
        fs.writeFileSync(path.join(target, file), content);
    }

    // Open specs-functional.md
    const doc = await vscode.workspace.openTextDocument(path.join(target, 'specs-functional.md'));
    vscode.window.showTextDocument(doc);
}
```

---

### 4. Agent File Generator

**File:** `AgentFileGenerator.ts`

Reads `ai_md_files/best-practices.md` and generates the agent-specific context files:

| Output file | Target agent |
|-------------|-------------|
| `.cursorrules` | Cursor |
| `CLAUDE.md` | Claude Code |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `AGENTS.md` | OpenAI Codex / generic |

```typescript
export async function generateAgentFiles() {
    const root = workspaceRoot();
    const bpPath = path.join(root, 'ai_md_files', 'best-practices.md');

    if (!fs.existsSync(bpPath)) {
        vscode.window.showErrorMessage('best-practices.md not found. Run "DDD: Initialize Project" first.');
        return;
    }

    const content = fs.readFileSync(bpPath, 'utf8');
    const header = `# DDD Context — generated from ai_md_files/best-practices.md\n# Do not edit manually — run "DDD: Generate Agent Files" to regenerate.\n\n`;

    const outputs: [string, string][] = [
        ['.cursorrules', header + content],
        ['CLAUDE.md', header + content],
        ['.github/copilot-instructions.md', header + content],
        ['AGENTS.md', header + content],
    ];

    for (const [file, text] of outputs) {
        const dest = path.join(root, file);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, text);
    }

    vscode.window.showInformationMessage('Agent files generated ✅ (.cursorrules, CLAUDE.md, copilot-instructions.md, AGENTS.md)');
}
```

---

### 5. Tree View

**File:** `DddTreeProvider.ts`

Implements `vscode.TreeDataProvider<DddTreeItem>` to display `ai_md_files/` in the Explorer sidebar panel.

Icons per file type:
| Pattern | Icon |
|---------|------|
| `best-practices.md` | `$(gear)` |
| `specs-functional.md` | `$(checklist)` |
| `specs-technical.md` | `$(tools)` |
| `DONE.md`, `MIGRATION_DONE.md` | `$(pass)` |
| `migration-*.md` | `$(map)` |
| `docs/*.md` | `$(book)` |
| Folders | `$(folder)` |

---

## esbuild.mjs (bundler)

```js
import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
});
```

---

## NPM Scripts

```json
{
  "scripts": {
    "compile": "node esbuild.mjs",
    "watch": "node esbuild.mjs --watch",
    "package": "vsce package",
    "publish": "vsce publish",
    "test": "vscode-test"
  }
}
```

---

## Key Dependencies

```json
{
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "esbuild": "^0.21.0",
    "@vscode/test-cli": "^0.0.9",
    "@vscode/test-electron": "^2.3.9",
    "@vscode/vsce": "^2.26.0"
  }
}
```

No runtime dependencies — the extension is fully self-contained.

---

## Testing Strategy

| Test type | Tool | Coverage target |
|-----------|------|----------------|
| Unit | Mocha + assert | DddDetector, TemplateGenerator, AgentFileGenerator |
| Integration | `@vscode/test-electron` | Commands, TreeView, file creation |
| Manual | VSCode Extension Development Host | Full UX flow |

---

## Roadmap

| Version | Features |
|---------|----------|
| v1.0 | Detection, scaffolding, tree view, agent file generation, templates (Angular, Spring Boot, Generic) |
| v1.1 | Cursor / Windsurf native context injection (when API available) |
| v1.2 | More templates (Python, Rust, Go, React, Vue) |
| v1.3 | DONE.md preview panel with diff vs. plan |
| v2.0 | DDD score per project, AI session recap, team sync |

