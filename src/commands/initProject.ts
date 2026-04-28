import * as vscode from 'vscode';
import * as path from 'path';
import { DddDetector } from '../detector/DddDetector';
import { TemplateGenerator, AgentProfile } from '../generator/TemplateGenerator';
import { aiMdFilesPath } from '../utils/fileUtils';
import { DddTreeProvider } from '../treeview/DddTreeProvider';

const PROFILE_ITEMS: Array<vscode.QuickPickItem & { profile: AgentProfile }> = [
  {
    profile: 'strict',
    label: '$(shield) Strict',
    description: 'Recommended',
    detail: 'No terminal commands allowed. Agent displays commands as code blocks only. No rename/delete.',
  },
  {
    profile: 'standard',
    label: '$(warning) Standard',
    description: '',
    detail: 'Build/install forbidden. Read-only commands (grep, find, cat) and tests allowed.',
  },
  {
    profile: 'permissive',
    label: '$(unlock) Permissive',
    description: '',
    detail: 'All terminal commands allowed. Agent may rename/delete files with caution.',
  },
];

export async function initProject(
  context: vscode.ExtensionContext,
  treeProvider: DddTreeProvider
): Promise<void> {
  const aiMdRoot = aiMdFilesPath();
  if (!aiMdRoot) {
    vscode.window.showErrorMessage('DDD: No workspace folder found.');
    return;
  }

  // Pick agent profile
  const picked = await vscode.window.showQuickPick(PROFILE_ITEMS, {
    title: 'DDD — Choose the agent restriction profile',
    placeHolder: 'Select a profile for README_AI.md',
  });
  if (!picked) { return; }

  const detector = new DddDetector();
  const { stack } = await detector.check();

  const generator = new TemplateGenerator(context.extensionPath);
  generator.scaffoldProject(aiMdRoot, stack, picked.profile);

  treeProvider.refresh();

  const bpUri = vscode.Uri.file(path.join(aiMdRoot, 'best-practices.md'));
  await vscode.window.showTextDocument(bpUri);

  vscode.window.showInformationMessage(
    `DDD ✅ Project initialized — stack: ${stack}, profile: ${picked.profile}`
  );
}

