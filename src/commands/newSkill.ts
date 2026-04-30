import * as vscode from 'vscode';
import * as path from 'path';
import { writeFile, today, aiContextPath } from '../utils/fileUtils';
import { DddTreeProvider } from '../treeview/DddTreeProvider';

export async function newSkill(
  treeProvider: DddTreeProvider
): Promise<void> {
  const aiContextRoot = aiContextPath();
  if (!aiContextRoot) {
    vscode.window.showErrorMessage('Documentation First: no .ai_context/ folder found.');
    return;
  }

  const name = await vscode.window.showInputBox({
    prompt: 'Skill name (prefix with "permanent-" to keep across contexts)',
    placeHolder: 'e.g. permanent-dev-typescript or api-design-rules',
    validateInput: (v: string) => v?.trim() ? undefined : 'Name is required',
  });
  if (!name || !name.trim()) { return; }

  const fileName = name.trim().endsWith('.md') ? name.trim() : `${name.trim()}.md`;
  const skillsDir = path.join(aiContextRoot, 'skills');
  const filePath = path.join(skillsDir, fileName);

  writeFile(filePath, `# Skill — ${name.trim().replace('permanent-', '')}\n\n*Créé : ${today()}*\n\n---\n\n## Rôle\n\n\n\n## Règles\n\n\n`);

  treeProvider.refresh();

  await vscode.window.showTextDocument(vscode.Uri.file(filePath));
}

