import * as vscode from 'vscode';
import { TemplateGenerator } from '../generator/TemplateGenerator';
import { aiContextPath } from '../utils/fileUtils';
import { DddTreeProvider } from '../treeview/DddTreeProvider';
import { ContextPanel } from '../webview/ContextPanel';

export async function newVision(
  context: vscode.ExtensionContext,
  treeProvider: DddTreeProvider,
  contextPanel: ContextPanel
): Promise<void> {
  const aiContextRoot = aiContextPath();
  if (!aiContextRoot) {
    vscode.window.showErrorMessage('Documentation First: no workspace folder found.');
    return;
  }

  // Warning: vision reset clears steps/ and tasks/ non-permanent
  const confirm = await vscode.window.showWarningMessage(
    '⚠️ New Vision will overwrite vision.md, reset all steps/, and clear tasks/ non-permanent files. ' +
    'CONTEXT.md and skills/ are preserved. Make sure you have committed first.',
    { modal: true },
    'Continue anyway'
  );
  if (confirm !== 'Continue anyway') { return; }

  // New vision
  const vision = await vscode.window.showInputBox({
    title: 'New Vision (1/3) — Vision',
    prompt: 'Describe the new product vision / big epic',
    placeHolder: 'e.g. Expand to all major IDE platforms',
    validateInput: (v: string) => v?.trim() ? undefined : 'Required',
  });
  if (!vision) { return; }

  // New steps (loop)
  const steps: Array<{ name: string; description: string }> = [];
  while (true) {
    const stepName = await vscode.window.showInputBox({
      title: `New Vision (2/3) — Step ${steps.length + 1} (leave empty to finish)`,
      prompt: 'Add a step/phase for this vision (leave empty to finish)',
      placeHolder: 'e.g. Phase 1 — JetBrains port',
    });
    if (!stepName?.trim()) { break; }
    const stepDesc = await vscode.window.showInputBox({
      title: `Step "${stepName.trim()}" — description`,
      prompt: 'Describe this step briefly',
    }) ?? '';
    steps.push({ name: stepName.trim(), description: stepDesc.trim() });
  }

  // First task for new vision
  const taskTitle = await vscode.window.showInputBox({
    title: 'New Vision (3/3) — First Task title',
    prompt: 'What is the first task for this new vision?',
    placeHolder: 'e.g. Setup IntelliJ project structure',
    validateInput: (v: string) => v?.trim() ? undefined : 'Required',
  });
  if (!taskTitle) { return; }

  const taskDesc = await vscode.window.showInputBox({
    title: 'First Task — description (optional)',
    prompt: 'Brief description',
  }) ?? '';

  const todos: string[] = [];
  while (true) {
    const todo = await vscode.window.showInputBox({
      title: `First Task — Todo ${todos.length + 1} (leave empty to finish)`,
      prompt: 'Add a todo (leave empty to finish)',
    });
    if (!todo?.trim()) { break; }
    todos.push(todo.trim());
  }

  const generator = new TemplateGenerator(context.extensionPath);
  generator.scaffoldNewVision(aiContextRoot, vision.trim(), steps, taskTitle.trim(), taskDesc.trim(), todos);

  treeProvider.refresh();
  contextPanel.refresh();

  vscode.window.showInformationMessage(`Documentation First ✅ New vision started: ${vision.trim()}`);
}

