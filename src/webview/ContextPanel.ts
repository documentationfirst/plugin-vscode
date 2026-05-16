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

    // Re-render when the panel becomes visible (e.g. user opens the sidebar)
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this._view!.webview.html = this._getHtml();
      }
    });

    webviewView.webview.onDidReceiveMessage((msg: { command: string; task: string; done: boolean }) => {
      if (msg.command === 'toggleTodo') {
        this._toggleTodo(msg.task, msg.done);
      } else if (msg.command === 'initContext') {
        vscode.commands.executeCommand('ddd.initContext');
      } else if (msg.command === 'newVision') {
        vscode.commands.executeCommand('ddd.newVision');
      } else if (msg.command === 'newTask') {
        vscode.commands.executeCommand('ddd.newTask');
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
    const devContextPath = path.join(aiContextRoot, 'dev-context.json');
    if (!fs.existsSync(devContextPath)) { return; }
    try {
      const json = JSON.parse(fs.readFileSync(devContextPath, 'utf8'));
      const todos: Array<{ text: string; done: boolean }> = json.task?.todos ?? [];
      const idx = todos.findIndex((t) => t.text === taskText);
      if (idx !== -1) { todos[idx].done = done; }
      json.task.todos = todos;
      fs.writeFileSync(devContextPath, JSON.stringify(json, null, 2), 'utf8');
      this.refresh();
    } catch { /* ignore */ }
  }

  private _getHtml(): string {
    const aiContextRoot = aiContextPath();
    const initialized = !!(aiContextRoot && fs.existsSync(aiContextRoot));

    const actionButton = initialized
      ? `<button class="btn-vision" onclick="send('newVision')">🔭 New Vision</button>
         <button class="btn-action" onclick="send('newTask')">＋ New Task</button>`
      : `<button class="btn-init" onclick="send('initContext')">⚡ Initialize Context</button>`;

    if (!initialized) {
      return this._wrapHtml(actionButton, '');
    }

    const contextJsonPath = path.join(aiContextRoot!, 'dev-context.json');

    if (!fs.existsSync(contextJsonPath)) {
      return this._wrapHtml(actionButton, '<p class="empty">No context initialized.</p>');
    }

    let visionLabel = '—', taskTitle = '—', startedAt = '—', description = '';
    let steps: Array<{ name: string; description: string; done?: boolean }> = [];
    let todos: Array<{ text: string; done: boolean }> = [];
    try {
      const json = JSON.parse(fs.readFileSync(contextJsonPath, 'utf8'));
      visionLabel = this._escape(json.vision ?? '—');
      steps       = json.steps ?? [];
      taskTitle   = this._escape(json.task?.title ?? json.title ?? '—');
      startedAt   = (json.task?.startedAt ?? json.startedAt ?? '').slice(0, 10) || '—';
      description = this._escape(json.task?.description ?? json.description ?? '');
      todos       = json.task?.todos ?? [];
    } catch { /* ignore */ }

    let todosHtml = '';
    for (const t of todos) {
      const text = this._escape(t.text);
      const checkedAttr = t.done ? 'checked' : '';
      const doneClass = t.done ? 'done' : '';
      todosHtml += `<label class="todo ${doneClass}">
        <input type="checkbox" ${checkedAttr} data-task="${text}" onchange="toggle(this)">
        <span>${text}</span>
      </label>`;
    }

    const stepsHtml = steps.length > 0
      ? `<div class="steps-label">Steps</div><ul class="steps">${steps.map((s: { name: string; done?: boolean }) =>
          `<li class="${s.done ? 'step-done' : ''}">${s.done ? '✅' : '○'} ${this._escape(s.name)}</li>`
        ).join('')}</ul>`
      : '';

    const content = `
      <div class="section-label">Vision</div>
      <div class="header">
        <strong>${visionLabel}</strong>
      </div>
      ${stepsHtml}
      <div class="section-label task-label">Task — <span class="date">${startedAt}</span></div>
      <div class="task-title">${taskTitle}</div>
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
    .btn-vision { background: var(--vscode-button-secondaryBackground, #3a3d41); color: var(--vscode-button-secondaryForeground, #ccc); margin-bottom: 4px; }
    .btn-vision:hover { background: var(--vscode-button-secondaryHoverBackground, #45494e); }
    .btn-init { background: #CC6600; color: white; }
    .btn-init:hover { background: #E07A00; }
    .empty { color: var(--vscode-descriptionForeground); font-style: italic; }
    .section-label { font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vscode-descriptionForeground); margin: 8px 0 2px; }
    .task-label { margin-top: 12px; }
    .header strong, .task-title { font-size: 1.0em; font-weight: 600; }
    .date { color: var(--vscode-descriptionForeground); font-size: 0.85em; }
    .steps-label { font-weight: bold; font-size: 0.85em; margin: 4px 0 2px; }
    .steps { margin: 0 0 6px 14px; padding: 0; font-size: 0.85em; color: var(--vscode-descriptionForeground); }
    .steps li { margin-bottom: 1px; list-style: none; }
    .steps li.step-done { text-decoration: line-through; opacity: 0.6; }
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
