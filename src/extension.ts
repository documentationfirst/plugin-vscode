import * as vscode from 'vscode';
import * as fs from 'fs';
import { DddDetector } from './detector/DddDetector';
import { DddTreeItem, DddTreeProvider } from './treeview/DddTreeProvider';
import { ContextPanel } from './webview/ContextPanel';
import { initContext } from './commands/initContext';
import { newVision } from './commands/newVision';
import { newTask } from './commands/newContext'; // newContext.ts repurposed as newTask
import { newDocument } from './commands/newDocument';
import { newSkill } from './commands/newSkill';
import { togglePermanent } from './commands/togglePermanent';
import { aiContextPath } from './utils/fileUtils';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // ── Tree view ──────────────────────────────────────────────────────────────
  const treeProvider = new DddTreeProvider();
  vscode.window.registerTreeDataProvider('dddExplorer', treeProvider);


  // ── Context panel (WebviewView) ────────────────────────────────────────────
  const contextPanel = new ContextPanel(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ContextPanel.viewType, contextPanel)
  );

  // ── Helper: update context key ────────────────────────────────────────────
  const updateInitState = () => {
    const aiCtx = aiContextPath();
    const initialized = !!(aiCtx && fs.existsSync(aiCtx));
    vscode.commands.executeCommand('setContext', 'ddd.initialized', initialized);
    contextPanel.refresh();
  };
  updateInitState();

  // ── File watcher ───────────────────────────────────────────────────────────
  const watcher = vscode.workspace.createFileSystemWatcher('**/.ai_context/**');
  watcher.onDidCreate(() => { updateInitState(); treeProvider.refresh(); contextPanel.refresh(); });
  watcher.onDidDelete(() => { updateInitState(); treeProvider.refresh(); contextPanel.refresh(); });
  watcher.onDidChange(() => contextPanel.refresh());
  context.subscriptions.push(watcher);

  // ── Commands ───────────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('ddd.initContext', () =>
      initContext(context, treeProvider, contextPanel).then(updateInitState)
    ),
    vscode.commands.registerCommand('ddd.newVision', () =>
      newVision(context, treeProvider, contextPanel).then(updateInitState)
    ),
    vscode.commands.registerCommand('ddd.newTask', () =>
      newTask(context, treeProvider, contextPanel).then(updateInitState)
    ),
    vscode.commands.registerCommand('ddd.newDocument', (item: DddTreeItem) => {
      const targetDir = item?.fullPath;
      if (targetDir && fs.statSync(targetDir).isDirectory()) {
        newDocument(targetDir, treeProvider);
      }
    }),
    vscode.commands.registerCommand('ddd.newSkill', () =>
      newSkill(treeProvider)
    ),
    vscode.commands.registerCommand('ddd.togglePermanent', (item: DddTreeItem) =>
      togglePermanent(item, treeProvider)
    ),
    vscode.commands.registerCommand('ddd.refresh', () => {
      treeProvider.refresh();
      contextPanel.refresh();
    }),
  );

  // ── Startup detection (detached — must not block activate()) ──────────────
  (async () => {
    // Small delay to ensure workspace folders are fully resolved
    await new Promise(resolve => setTimeout(resolve, 500));
    const detector = new DddDetector();
    const { hasDddFolder, stack } = await detector.check();

    if (hasDddFolder) {
      vscode.window.setStatusBarMessage(`Documentation First ✅ — ${stack}`, 5000);
    } else {
      const choice = await vscode.window.showInformationMessage(
        'Documentation First: no .ai_context/ folder found in this project. Initialize now?',
        { modal: false },
        'Initialize',
        'Later'
      );
      if (choice === 'Initialize') {
        vscode.commands.executeCommand('ddd.initContext');
      }
    }
  })();
}

export function deactivate(): void {}
