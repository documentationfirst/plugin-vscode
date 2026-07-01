import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { aiContextPath } from '../utils/fileUtils';
import { DddTreeItem, DddTreeProvider, isPermanentEligiblePath } from '../treeview/DddTreeProvider';

export async function togglePermanent(
  item: DddTreeItem | undefined,
  treeProvider: DddTreeProvider
): Promise<void> {
  const aiContextRoot = aiContextPath();
  const filePath = item?.fullPath;

  if (!aiContextRoot || !filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    vscode.window.showErrorMessage('Documentation First: select a .md file inside .ai_context/.');
    return;
  }

  if (!isPermanentEligiblePath(filePath, aiContextRoot)) {
    vscode.window.showErrorMessage('Documentation First: only files in skills/, tasks/done/, tasks/specification/ or tasks/technical/ can be permanent.');
    return;
  }

  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath);
  const targetName = baseName.startsWith('permanent-')
    ? baseName.replace(/^permanent-/, '')
    : `permanent-${baseName}`;
  const targetPath = path.join(dir, targetName);

  if (fs.existsSync(targetPath)) {
    vscode.window.showErrorMessage(`Documentation First: cannot rename ${baseName}; ${targetName} already exists.`);
    return;
  }

  fs.renameSync(filePath, targetPath);
  treeProvider.refresh();

  await vscode.window.showTextDocument(vscode.Uri.file(targetPath));
  const status = targetName.startsWith('permanent-') ? 'Permanent' : 'Non-permanent';
  vscode.window.showInformationMessage(`Documentation First ✅ ${status}: ${targetName.replace(/^permanent-/, '')}`);
}

