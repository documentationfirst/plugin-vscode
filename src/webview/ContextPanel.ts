import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { aiContextPath } from '../utils/fileUtils';

export class ContextPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = 'dddContextPanel';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._getHtml();

    webviewView.webview.onDidReceiveMessage((msg: { command: string; task: string; done: boolean }) => {
      if (msg.command === 'toggleTodo') {
        this._toggleTodo(msg.task, msg.done);
      } else if (msg.command === 'initContext') {
        vscode.commands.executeCommand('ddd.initContext');
      } else if (msg.command === 'newContext') {
        vscode.commands.executeCommand('ddd.newContext');
      }
    });
  }

  refresh(): void {
    if (this._view) {
      this._view.webview.html = this._getHtml();
    }
  }

  private _toggleTodo(taskText: string, done: boolean): void {
    const aiContextRoot = aiContextPath();
    if (!aiContextRoot) { return; }
    const contextMdPath = path.join(aiContextRoot, 'CONTEXT.md');
    if (!fs.existsSync(contextMdPath)) { return; }

    const from = done ? `- [ ] ${taskText}` : `- [x] ${taskText}`;
    const to   = done ? `- [x] ${taskText}` : `- [ ] ${taskText}`;
    const updated = fs.readFileSync(contextMdPath, 'utf8').replace(from, to);
    fs.writeFileSync(contextMdPath, updated, 'utf8');
    this.refresh();
  }

  private _getHtml(): string {
    const aiContextRoot = aiContextPath();
    const initialized = !!(aiContextRoot && fs.existsSync(aiContextRoot));

    const actionButton = initialized
      ? `<button class="btn-action" onclick="send('newContext')">＋ New Context</button>`
      : `<button class="btn-init" onclick="send('initContext')">⚡ Initialize Context</button>`;

    if (!initialized) {
      return this._wrapHtml(actionButton, '');
    }

    const contextJsonPath = path.join(aiContextRoot!, 'context.json');
    const contextMdPath   = path.join(aiContextRoot!, 'CONTEXT.md');

    if (!fs.existsSync(contextJsonPath) || !fs.existsSync(contextMdPath)) {
      return this._wrapHtml(actionButton, '<p class="empty">No context initialized.</p>');
    }

    let title = '—', startedAt = '—', description = '';
    try {
      const json = JSON.parse(fs.readFileSync(contextJsonPath, 'utf8'));
      title     = this._escape(json.title ?? '—');
      startedAt = (json.startedAt ?? '').slice(0, 10) || '—';
    } catch { /* ignore */ }

    const mdText = fs.readFileSync(contextMdPath, 'utf8');
    const descMatch = mdText.match(/## Description\s*\n+([\s\S]*?)(\n---|\n##|$)/);
    if (descMatch) {
      description = this._escape(descMatch[1].trim().split('\n')[0] ?? '');
    }

    const todoRegex = /^- \[([ x])\] (.+)$/gm;
    let todosHtml = '';
    let match;
    while ((match = todoRegex.exec(mdText)) !== null) {
      const checked = match[1] === 'x';
      const task = this._escape(match[2]);
      const checkedAttr = checked ? 'checked' : '';
      const doneClass = checked ? 'done' : '';
      todosHtml += `<label class="todo ${doneClass}">
        <input type="checkbox" ${checkedAttr} data-task="${task}" onchange="toggle(this)">
        <span>${task}</span>
      </label>`;
    }

    const content = `
      <div class="header">
        <strong>${title}</strong>
        <span class="date">${startedAt}</span>
      </div>
      ${description ? `<p class="desc">${description}</p>` : ''}
      ${todosHtml ? `<div class="todos"><div class="todos-label">Todo</div>${todosHtml}</div>` : ''}
    `;
    return this._wrapHtml(actionButton, content);
  }

  private _wrapHtml(actionButton: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size);
           color: var(--vscode-foreground); padding: 8px; margin: 0; }
    button {
      width: 100%; padding: 5px 10px; margin-bottom: 10px;
      border: none; border-radius: 3px; cursor: pointer;
      font-size: 12px; font-family: var(--vscode-font-family);
      font-weight: 500; text-align: left;
    }
    .btn-action { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .btn-action:hover { background: var(--vscode-button-hoverBackground); }
    .btn-init { background: #CC6600; color: white; }
    .btn-init:hover { background: #E07A00; }
    .empty { color: var(--vscode-descriptionForeground); font-style: italic; }
    .header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
    .header strong { font-size: 1.05em; }
    .date { color: var(--vscode-descriptionForeground); font-size: 0.85em; }
    .desc { color: var(--vscode-descriptionForeground); font-style: italic; margin: 4px 0 10px; font-size: 0.9em; }
    .todos-label { font-weight: bold; margin-bottom: 4px; font-size: 0.9em; }
    .todo { display: flex; align-items: center; gap: 6px; padding: 2px 0; cursor: pointer; font-size: 0.9em; }
    .todo.done span { color: var(--vscode-descriptionForeground); text-decoration: line-through; }
    .todo input { cursor: pointer; }
  </style>
</head>
<body>
  ${actionButton}
  ${body}
  <script>
    const vscode = acquireVsCodeApi();
    function toggle(cb) {
      vscode.postMessage({ command: 'toggleTodo', task: cb.dataset.task, done: cb.checked });
    }
    function send(cmd) {
      vscode.postMessage({ command: cmd });
    }
  </script>
</body>
</html>`;
  }

  private _escape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}
