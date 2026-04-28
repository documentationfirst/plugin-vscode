import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { writeFile, today } from '../utils/fileUtils';
import { DddTreeProvider } from '../treeview/DddTreeProvider';

export async function newDocument(
  targetDir: string,
  treeProvider: DddTreeProvider
): Promise<void> {
  const name = await vscode.window.showInputBox({
    prompt: 'File name (without extension)',
    placeHolder: 'e.g. my-decision or permanent-conventions',
    validateInput: (v: string) => v?.trim() ? undefined : 'Name is required',
  });
  if (!name || !name.trim()) { return; }

  const fileName = name.trim().endsWith('.md') ? name.trim() : `${name.trim()}.md`;
  const filePath = path.join(targetDir, fileName);

  if (!fs.existsSync(filePath)) {
    writeFile(filePath, `# ${name.trim()}\n\n*Created: ${today()}*\n\n---\n\n`);
  }

  treeProvider.refresh();

  const uri = vscode.Uri.file(filePath);
  await vscode.window.showTextDocument(uri);
}
