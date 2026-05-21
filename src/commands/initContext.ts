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

const MODE_ITEMS: vscode.QuickPickItem[] = [
  {
    label: '$(star) Full init (recommended)',
    description: 'Profile → Context → Vision → Steps → First task',
    picked: true,
  },
  {
    label: '$(zap) Quick init',
    description: 'Profile + Context only — fill vision & steps later',
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

  // Step 0: Full or Quick init?
  const mode = await vscode.window.showQuickPick(MODE_ITEMS, {
    title: 'Documentation First — Init mode',
    placeHolder: 'Full init is recommended for a new project',
  });
  if (!mode) { return; }
  const isQuick = mode.label.includes('Quick');

  // Step 1: pick profile
  const picked = await vscode.window.showQuickPick(PROFILE_ITEMS, {
    title: isQuick ? 'Quick Init (1/3) — Agent profile' : 'Full Init (1/5) — Agent profile',
    placeHolder: 'Choose a profile for CONTRACT.md',
  });
  if (!picked) { return; }

  // Step 2: project context (permanent)
  const projectContext = await vscode.window.showInputBox({
    title: isQuick ? 'Quick Init (2/3) — Project Context (permanent)' : 'Full Init (2/5) — Project Context (permanent)',
    prompt: 'Describe the project: what it is, the stack, key conventions. Permanent — never reset.',
    placeHolder: 'e.g. VSCode plugin in TypeScript to scaffold .ai_context/ folders for DDD',
    validateInput: (v: string) => v?.trim() ? undefined : 'Required',
  });
  if (!projectContext) { return; }

  let vision = '*(To be defined — fill vision.md before asking the agent to work)*';
  let steps: Array<{ name: string; description: string }> = [];

  if (!isQuick) {
    // Step 3: vision
    const visionInput = await vscode.window.showInputBox({
      title: 'Full Init (3/5) — Vision (semi-permanent)',
      prompt: 'Describe the product vision / big epic. Rewritten on "New Vision".',
      placeHolder: 'e.g. Ship a zero-friction DDD plugin for all major IDEs',
      validateInput: (v: string) => v?.trim() ? undefined : 'Required',
    });
    if (!visionInput) { return; }
    vision = visionInput.trim();

    // Step 4: steps
    while (true) {
      const stepName = await vscode.window.showInputBox({
        title: `Full Init (4/5) — Step ${steps.length + 1} name (leave empty to finish)`,
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
  }

  // Last step: first task
  const taskStepNum = isQuick ? 3 : 5;
  const taskTitle = await vscode.window.showInputBox({
    title: `${isQuick ? 'Quick' : 'Full'} Init (${taskStepNum}/${taskStepNum}) — First Task title`,
    prompt: 'What is the first thing to work on?',
    placeHolder: 'e.g. Implement init command',
    validateInput: (v: string) => v?.trim() ? undefined : 'Required',
  });
  if (!taskTitle) { return; }

  const taskDesc = await vscode.window.showInputBox({
    title: 'First Task — description (optional)',
    prompt: 'Brief description of the first task',
  }) ?? '';

  const todos: string[] = [];
  while (true) {
    const todo = await vscode.window.showInputBox({
      title: `First Task — Todo ${todos.length + 1} (leave empty to finish)`,
      prompt: 'Add a todo item (leave empty to finish)',
    });
    if (!todo?.trim()) { break; }
    todos.push(todo.trim());
  }

  const detector = new DddDetector();
  const { stack } = await detector.check();

  const generator = new TemplateGenerator(context.extensionPath);
  generator.scaffoldInit(
    aiContextRoot, picked.profile,
    projectContext.trim(), vision,
    taskTitle.trim(), taskDesc.trim(), todos, steps
  );

  treeProvider.refresh();
  contextPanel.refresh();

  vscode.window.showInformationMessage(
    `Documentation First ✅ Initialized — stack: ${stack}, profile: ${picked.profile}` +
    (isQuick ? ' (Quick mode — fill vision.md before working with the agent)' : '')
  );
}
