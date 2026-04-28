import * as vscode from 'vscode';

export class WelcomePanel {
  static readonly viewType = 'dddWelcome';
  private static _panel: vscode.WebviewPanel | undefined;

  static show(extensionUri: vscode.Uri): void {
    if (WelcomePanel._panel) {
      WelcomePanel._panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      WelcomePanel.viewType,
      'DDD — Welcome',
      vscode.ViewColumn.One,
      { enableScripts: false }
    );

    panel.onDidDispose(() => { WelcomePanel._panel = undefined; });
    panel.webview.html = WelcomePanel._getHtml();
    WelcomePanel._panel = panel;
  }

  private static _getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DDD — Welcome</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 32px 48px;
      max-width: 860px;
      margin: 0 auto;
      line-height: 1.6;
    }
    h1 { font-size: 2em; margin-bottom: 4px; }
    h2 { font-size: 1.2em; margin-top: 32px; border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 6px; }
    .subtitle { color: var(--vscode-descriptionForeground); margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .card {
      background: var(--vscode-editor-inactiveSelectionBackground);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 16px 20px;
    }
    .card h3 { margin: 0 0 6px 0; font-size: 1em; }
    .card p { margin: 0; font-size: 0.88em; color: var(--vscode-descriptionForeground); }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.9em; }
    th { text-align: left; padding: 6px 10px; background: var(--vscode-editor-inactiveSelectionBackground); }
    td { padding: 6px 10px; border-top: 1px solid var(--vscode-panel-border); }
    code {
      font-family: var(--vscode-editor-font-family);
      background: var(--vscode-textCodeBlock-background);
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 0.88em;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.78em;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      margin-left: 8px;
      vertical-align: middle;
    }
    .tip {
      background: var(--vscode-inputValidation-infoBackground);
      border-left: 3px solid var(--vscode-inputValidation-infoBorder);
      padding: 10px 14px;
      border-radius: 0 4px 4px 0;
      margin-top: 16px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>

  <h1>📖 DDD2 — Documentation-Driven Development for AI</h1>
  <p class="subtitle">Make documentation a first-class citizen of your IDE — for Angular, React, Vue, Spring Boot, Python, Rust, Go.</p>

  <h2>🚀 Getting Started</h2>
  <div class="tip">
    Open a project, then run <code>Ctrl+Shift+P</code> → <strong>DDD: Initialize Project</strong> to scaffold your <code>ai_md_files/</code> folder.
  </div>

  <h2>⌨️ Commands</h2>
  <table>
    <thead>
      <tr><th>Command</th><th>Description</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><code>DDD: Initialize Project</code></td>
        <td>Scaffolds <code>ai_md_files/</code> with best practices, docs, features and migrations folders. Lets you choose the agent profile (strict / standard / permissive).</td>
      </tr>
      <tr>
        <td><code>DDD: New Feature Context</code></td>
        <td>Creates <code>features/{name}/specs-functional.md</code>, <code>specs-technical.md</code> and <code>DONE.md</code>.</td>
      </tr>
      <tr>
        <td><code>DDD: New Migration Plan</code></td>
        <td>Creates <code>migrations/{name}/migration-plan.md</code> and <code>MIGRATION_DONE.md</code>.</td>
      </tr>
      <tr>
        <td><code>DDD: Generate Agent Files</code></td>
        <td>Generates <code>.cursorrules</code>, <code>CLAUDE.md</code>, <code>.github/copilot-instructions.md</code> and <code>AGENTS.md</code> from your <code>best-practices.md</code>.</td>
      </tr>
      <tr>
        <td><code>DDD: View DONE.md</code></td>
        <td>Opens the nearest <code>DONE.md</code> or <code>MIGRATION_DONE.md</code> in a split editor.</td>
      </tr>
      <tr>
        <td><code>DDD: Welcome</code></td>
        <td>Opens this page.</td>
      </tr>
    </tbody>
  </table>

  <h2>🧩 Agent Profiles</h2>
  <div class="grid">
    <div class="card">
      <h3>🛡️ Strict <span class="badge">Recommended</span></h3>
      <p>No terminal commands. Agent displays commands as code blocks only. No rename or delete.</p>
    </div>
    <div class="card">
      <h3>⚠️ Standard</h3>
      <p>Build/install forbidden. Read-only commands (grep, find, cat) and <code>npm test</code> allowed.</p>
    </div>
    <div class="card">
      <h3>🔓 Permissive</h3>
      <p>All terminal commands allowed. Agent may rename/delete files with caution.</p>
    </div>
    <div class="card">
      <h3>📁 Folder Structure</h3>
      <p><code>ai_md_files/best-practices.md</code><br>
         <code>ai_md_files/features/{name}/</code><br>
         <code>ai_md_files/migrations/{name}/</code></p>
    </div>
  </div>

  <h2>🤖 Compatible AI Tools</h2>
  <table>
    <thead><tr><th>File generated</th><th>Tool</th></tr></thead>
    <tbody>
      <tr><td><code>.cursorrules</code></td><td>Cursor</td></tr>
      <tr><td><code>CLAUDE.md</code></td><td>Claude Code</td></tr>
      <tr><td><code>.github/copilot-instructions.md</code></td><td>GitHub Copilot</td></tr>
      <tr><td><code>AGENTS.md</code></td><td>OpenAI Codex / generic</td></tr>
    </tbody>
  </table>

  <h2>📚 Supported Stacks</h2>
  <p>Angular · React · Vue · Spring Boot · Python · Rust · Go · Generic</p>
  <p style="margin-top:32px; font-size:0.8em; color:var(--vscode-descriptionForeground)">
    MIT License — <a href="https://documentationfirst.ai" style="color:inherit">documentationfirst.ai</a>
  </p>

</body>
</html>`;
  }
}
