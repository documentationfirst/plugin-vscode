import * as vscode from 'vscode';
import { TemplateGenerator } from '../generator/TemplateGenerator';
import { aiContextPath } from '../utils/fileUtils';
import { DddTreeProvider } from '../treeview/DddTreeProvider';
import { ContextPanel } from '../webview/ContextPanel';

export async function newContext(
  context: vscode.ExtensionContext,
  treeProvider: DddTreeProvider,
  contextPanel: ContextPanel
): Promise<void> {
  const aiContextRoot = aiContextPath();
  if (!aiContextRoot) {
    vscode.window.showErrorMessage('Documentation First: no workspace folder found.');
    return;
  }

  // Git warning
  const confirm = await vscode.window.showWarningMessage(
    'CONTEXT.md, context.json and documents/ (except permanent-* files) will be erased. ' +
    'Make sure you have committed these files to Git first.',
    { modal: true },
    'Continue anyway'
  );
  if (confirm !== 'Continue anyway') { return; }

  // Title
  const title = await vscode.window.showInputBox({
    title: 'New context (1/3)',
    prompt: 'New context title',
    placeHolder: 'e.g. Notifications feature',
    validateInput: (v: string) => v?.trim() ? undefined : 'Title is required',
  });
  if (!title) { return; }

  // Description
  const description = await vscode.window.showInputBox({
    title: 'New context (2/3)',
    prompt: 'Objective description',
    placeHolder: 'e.g. Real-time notification system',
  }) ?? '';

  // Todos (loop)
  const todos: string[] = [];
  while (true) {
    const todo = await vscode.window.showInputBox({
      title: `New context (3/3) — Todo ${todos.length + 1}`,
      prompt: 'Add a task (leave empty to finish)',
      placeHolder: 'e.g. Create WebSocket service',
    });
    if (!todo || !todo.trim()) { break; }
    todos.push(todo.trim());
  }

  const generator = new TemplateGenerator(context.extensionPath);
  generator.scaffoldNewContext(aiContextRoot, title.trim(), description.trim(), todos);

  treeProvider.refresh();
  contextPanel.refresh();

  vscode.window.showInformationMessage(
    `Documentation First ✅ New context started: ${title}`
  );
}
