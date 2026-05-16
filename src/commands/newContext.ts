import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TemplateGenerator } from '../generator/TemplateGenerator';
import { aiContextPath } from '../utils/fileUtils';
import { DddTreeProvider } from '../treeview/DddTreeProvider';
import { ContextPanel } from '../webview/ContextPanel';

export async function newTask(
  context: vscode.ExtensionContext,
  treeProvider: DddTreeProvider,
  contextPanel: ContextPanel
): Promise<void> {
  const aiContextRoot = aiContextPath();
  if (!aiContextRoot) {
    vscode.window.showErrorMessage('Documentation First: no workspace folder found.');
    return;
  }

  const confirm = await vscode.window.showWarningMessage(
    '⚠️ New Tasks will clear tasks/ non-permanent files. Commit first.',
    { modal: true },
    'Continue anyway'
  );
  if (confirm !== 'Continue anyway') { return; }

  // Which step was just completed? — free text, pending steps shown as hint
  const devContextPath = path.join(aiContextRoot, 'dev-context.json');
  let pendingStepNames: string[] = [];
  if (fs.existsSync(devContextPath)) {
    try {
      const devCtx = JSON.parse(fs.readFileSync(devContextPath, 'utf8'));
      pendingStepNames = (devCtx.steps ?? [])
        .filter((s: { done?: boolean }) => !s.done)
        .map((s: { name: string }) => s.name);
    } catch { /* ignore */ }
  }

  const stepHint = pendingStepNames.length > 0
    ? `Pending: ${pendingStepNames.join(' · ')}`
    : 'No pending steps defined';

  const completedStepRaw = await vscode.window.showInputBox({
    title: 'New Task (1/3) — Which step did you just complete? (optional)',
    prompt: stepHint,
    placeHolder: pendingStepNames[0] ?? 'Leave empty if no step was completed',
  });
  // undefined = user pressed Escape → cancel the whole flow
  if (completedStepRaw === undefined) { return; }
  const completedStepName = completedStepRaw.trim();

  const taskTitle = await vscode.window.showInputBox({
    title: 'New Tasks (2/3) — Task title',
    prompt: 'What is the next task / sprint?',
    placeHolder: 'e.g. Implement tree view icons',
    validateInput: (v: string) => v?.trim() ? undefined : 'Required',
  });
  if (!taskTitle) { return; }

  const taskDesc = await vscode.window.showInputBox({
    title: 'New Tasks (3/3) — Description (optional)',
    prompt: 'Brief description',
  }) ?? '';

  const todos: string[] = [];
  while (true) {
    const todo = await vscode.window.showInputBox({
      title: `Todo ${todos.length + 1} (leave empty to finish)`,
      prompt: 'Add a todo item',
    });
    if (!todo?.trim()) { break; }
    todos.push(todo.trim());
  }

  const generator = new TemplateGenerator(context.extensionPath);
  generator.scaffoldNewTask(aiContextRoot, completedStepName, taskTitle.trim(), taskDesc.trim(), todos);

  treeProvider.refresh();
  contextPanel.refresh();

  vscode.window.showInformationMessage(
    `Documentation First ✅ New task: "${taskTitle.trim()}"` +
    (completedStepName ? ` — completed step: ${completedStepName}` : '')
  );
}
