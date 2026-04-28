import * as vscode from 'vscode';
import { DddDetector } from '../detector/DddDetector';
import { TemplateGenerator, AgentProfile } from '../generator/TemplateGenerator';
import { aiContextPath } from '../utils/fileUtils';
import { DddTreeProvider } from '../treeview/DddTreeProvider';
import { ContextPanel } from '../webview/ContextPanel';

const PROFILE_ITEMS: Array<vscode.QuickPickItem & { profile: AgentProfile }> = [
  {
    profile: 'strict',
    label: '$(shield) Strict (Recommended)',
    detail: 'No terminal commands. Agent displays commands as code blocks only. No rename/delete.',
  },
  {
    profile: 'standard',
    label: '$(warning) Standard',
    detail: 'Build/install forbidden. Read-only commands and tests allowed.',
  },
  {
    profile: 'permissive',
    label: '$(unlock) Permissive',
    detail: 'All terminal commands allowed. Rename/delete with caution.',
  },
];

export async function initContext(
  context: vscode.ExtensionContext,
  treeProvider: DddTreeProvider,
  contextPanel: ContextPanel
): Promise<void> {
  const aiContextRoot = aiContextPath();
  if (!aiContextRoot) {
    vscode.window.showErrorMessage('Documentation First: no workspace folder found.');
    return;
  }

  // Step 1: pick profile
  const picked = await vscode.window.showQuickPick(PROFILE_ITEMS, {
    title: 'Documentation First — Agent profile',
    placeHolder: 'Choose a profile for CONTRACT.md',
  });
  if (!picked) { return; }

  // Step 2: title
  const title = await vscode.window.showInputBox({
    title: 'Initialize context (1/3)',
    prompt: 'Context title',
    placeHolder: 'e.g. Authentication refactor',
    validateInput: (v: string) => v?.trim() ? undefined : 'Title is required',
  });
  if (!title) { return; }

  // Step 3: description
  const description = await vscode.window.showInputBox({
    title: 'Initialize context (2/3)',
    prompt: 'Objective description',
    placeHolder: 'e.g. Migrate to OAuth2 with refresh tokens',
  }) ?? '';

  // Step 4: todos (loop)
  const todos: string[] = [];
  while (true) {
    const todo = await vscode.window.showInputBox({
      title: `Initialize context (3/3) — Todo ${todos.length + 1}`,
      prompt: 'Add a task (leave empty to finish)',
      placeHolder: 'e.g. Create LoginForm component',
    });
    if (!todo || !todo.trim()) { break; }
    todos.push(todo.trim());
  }

  const detector = new DddDetector();
  const { stack } = await detector.check();

  const generator = new TemplateGenerator(context.extensionPath);
  generator.scaffoldInit(aiContextRoot, picked.profile, title.trim(), description.trim(), todos);

  treeProvider.refresh();
  contextPanel.refresh();

  vscode.window.showInformationMessage(
    `Documentation First ✅ Context initialized — stack: ${stack}, profile: ${picked.profile}`
  );
}
