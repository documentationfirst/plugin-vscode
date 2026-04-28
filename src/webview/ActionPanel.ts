import * as vscode from 'vscode';
import * as fs from 'fs';
import { aiContextPath } from '../utils/fileUtils';

export class ActionPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = 'dddActionPanel';

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

    webviewView.webview.onDidReceiveMessage((msg: { command: string }) => {
      if (msg.command === 'initContext') {
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

  private _getHtml(): string {
    const aiCtx = aiContextPath();
    const initialized = !!(aiCtx && fs.existsSync(aiCtx));

    const button = initialized
      ? `<button class="btn-action" onclick="send('newContext')">＋ New Context</button>`
      : `<button class="btn-init" onclick="send('initContext')">⚡ Initialize Context</button>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 6px 8px; }
    button {
      width: 100%;
      padding: 6px 12px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      font-family: var(--vscode-font-family);
      font-weight: 500;
      text-align: left;
    }
    .btn-action {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .btn-action:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .btn-init {
      background: #CC6600;
      color: white;
    }
    .btn-init:hover {
      background: #E07A00;
    }
  </style>
</head>
<body>
  ${button}
  <script>
    const vscode = acquireVsCodeApi();
    function send(cmd) { vscode.postMessage({ command: cmd }); }
  </script>
</body>
</html>`;
  }
}

