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

  vscode.window.showInformationMessage(
    'Documentation First — Init (1/5): Choose your agent profile, then describe your project context, vision, steps, and first task.'
  );

  // Step 1: pick profile
  const picked = await vscode.window.showQuickPick(PROFILE_ITEMS, {
    title: 'Documentation First — Agent profile (1/5)',
    placeHolder: 'Choose a profile for CONTRACT.md',
  });
  if (!picked) { return; }

  // Step 2: project context (permanent — who we are, what we build, stack)
  const projectContext = await vscode.window.showInputBox({
    title: 'Init (2/5) — Project Context (permanent)',
    prompt: 'Describe the project: what it is, the stack, key conventions. This is permanent — never reset.',
    placeHolder: 'e.g. VSCode plugin in TypeScript to scaffold .ai_context/ folders for DDD',
    validateInput: (v: string) => v?.trim() ? undefined : 'Required',
  });
  if (!projectContext) { return; }

  // Step 3: vision (semi-permanent — product direction)
  const vision = await vscode.window.showInputBox({
    title: 'Init (3/5) — Vision (semi-permanent)',
    prompt: 'Describe the product vision / big epic. Rewritten on "New Vision".',
    placeHolder: 'e.g. Ship a zero-friction DDD plugin for all major IDEs',
    validateInput: (v: string) => v?.trim() ? undefined : 'Required',
  });
  if (!vision) { return; }

  // Step 4: steps (contextual per vision — loop)
  const steps: Array<{ name: string; description: string }> = [];
  while (true) {
    const stepName = await vscode.window.showInputBox({
      title: `Init (4/5) — Steps — Step ${steps.length + 1} name (leave empty to finish)`,
      prompt: 'Name a phase or feature for this vision (leave empty to finish)',
      placeHolder: 'e.g. Phase 1 — Core scaffolding',
    });
    if (!stepName?.trim()) { break; }
    const stepDesc = await vscode.window.showInputBox({
      title: `Step "${stepName.trim()}" — description (optional)`,
      prompt: 'Describe this step briefly',
      placeHolder: 'e.g. Init command, tree view, basic templates',
    }) ?? '';
    steps.push({ name: stepName.trim(), description: stepDesc.trim() });
  }

  // Step 5: first task (ephemeral — title + todos)
  const taskTitle = await vscode.window.showInputBox({
    title: 'Init (5/5) — First Task title',
    prompt: 'What is the first thing to work on? A few words.',
    placeHolder: 'e.g. Implement init command',
    validateInput: (v: string) => v?.trim() ? undefined : 'Required',
  });
  if (!taskTitle) { return; }

  const taskDesc = await vscode.window.showInputBox({
    title: 'First Task — description (optional)',
    prompt: 'Brief description of the first task',
    placeHolder: 'e.g. Scaffold .ai_context/ with profile, vision, steps and first task',
  }) ?? '';

  const todos: string[] = [];
  while (true) {
    const todo = await vscode.window.showInputBox({
      title: `First Task — Todo ${todos.length + 1} (leave empty to finish)`,
      prompt: 'Add a todo item (leave empty to finish)',
      placeHolder: 'e.g. Write scaffold function',
    });
    if (!todo?.trim()) { break; }
    todos.push(todo.trim());
  }

  const detector = new DddDetector();
  const { stack } = await detector.check();

  const generator = new TemplateGenerator(context.extensionPath);
  generator.scaffoldInit(
    aiContextRoot, picked.profile,
    projectContext.trim(), vision.trim(),
    taskTitle.trim(), taskDesc.trim(), todos, steps
  );

  treeProvider.refresh();
  contextPanel.refresh();

  vscode.window.showInformationMessage(
    `Documentation First ✅ Initialized — stack: ${stack}, profile: ${picked.profile}`
  );
}
