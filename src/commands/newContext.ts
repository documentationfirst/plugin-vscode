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

  // ── Step 1: which step was just completed? — QuickPick list ──────────────
  const devContextPath = path.join(aiContextRoot, 'dev-context.json');
  let pendingSteps: Array<{ name: string; description?: string }> = [];
  if (fs.existsSync(devContextPath)) {
    try {
      const devCtx = JSON.parse(fs.readFileSync(devContextPath, 'utf8'));
      pendingSteps = (devCtx.steps ?? [])
        .filter((s: { done?: boolean }) => !s.done);
    } catch { /* ignore */ }
  }

  let completedStepName = '';
  if (pendingSteps.length > 0) {
    const NONE_LABEL = '$(circle-slash) None — no step completed';
    const stepItems: vscode.QuickPickItem[] = [
      { label: NONE_LABEL },
      ...pendingSteps.map(s => ({
        label: `$(check) ${s.name}`,
        description: s.description ?? '',
      })),
    ];
    const pickedStep = await vscode.window.showQuickPick(stepItems, {
      title: 'New Task (1/4) — Which step did you just complete?',
      placeHolder: 'Select the step you completed, or "None"',
    });
    if (pickedStep === undefined) { return; }
    if (pickedStep.label !== NONE_LABEL) {
      completedStepName = pickedStep.label.replace(/^\$\(check\) /, '');
    }
  }

  // ── Step 2: which spec files to delete? — multi-select QuickPick ─────────
  const specDir = path.join(aiContextRoot, 'tasks', 'specification');
  let specsToDelete: string[] = [];
  if (fs.existsSync(specDir)) {
    const specFiles = fs.readdirSync(specDir).filter(
      f => f !== '.gitkeep' && !f.startsWith('permanent-') && f.endsWith('.md')
    );
    if (specFiles.length > 0) {
      const specItems = specFiles.map(f => ({
        label: f,
        picked: true, // checked by default — user unchecks to keep
      }));
      const pickedSpecs = await vscode.window.showQuickPick(specItems, {
        title: 'New Task (2/4) — Which specification files should be deleted?',
        placeHolder: 'Check the ones you want to KEEP. Zero checked = all non permanent deleted.',
        canPickMany: true,
      });
      if (pickedSpecs === undefined) { return; }
      specsToDelete = pickedSpecs.map(i => i.label);
    }
  }

  // ── Step 3: task title ────────────────────────────────────────────────────
  const taskTitle = await vscode.window.showInputBox({
    title: 'New Task (3/4) — Task title',
    prompt: 'What is the next task / sprint?',
    placeHolder: 'e.g. Implement tree view icons',
    validateInput: (v: string) => v?.trim() ? undefined : 'Required',
  });
  if (!taskTitle) { return; }

  const taskDesc = await vscode.window.showInputBox({
    title: 'New Task (3/4) — Description (optional)',
    prompt: 'Brief description of this task',
  }) ?? '';

  // ── Step 4: todos ─────────────────────────────────────────────────────────
  const todos: string[] = [];
  while (true) {
    const todo = await vscode.window.showInputBox({
      title: `New Task (4/4) — Todo ${todos.length + 1} (leave empty to finish)`,
      prompt: 'Add a todo item',
    });
    if (!todo?.trim()) { break; }
    todos.push(todo.trim());
  }

  const generator = new TemplateGenerator(context.extensionPath);
  generator.scaffoldNewTask(aiContextRoot, completedStepName, taskTitle.trim(), taskDesc.trim(), todos, specsToDelete);

  treeProvider.refresh();
  contextPanel.refresh();

  vscode.window.showInformationMessage(
    `Documentation First ✅ New task: "${taskTitle.trim()}"` +
    (completedStepName ? ` — completed step: ${completedStepName}` : '')
  );
}
